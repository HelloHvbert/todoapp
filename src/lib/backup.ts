import Constants from 'expo-constants';
import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import { parseBackup, serializeBackup } from './backup-format';
import { store as db } from './db';
import { DRIVE_SCOPE, DriveAuthError, downloadBackup, findBackup, RemoteFile, uploadBackup } from './drive';
import { getData, onDataChange, replaceData } from './store';

type GoogleModule = typeof import('@react-native-google-signin/google-signin');

export type BackupStatus = {
  /** False in Expo Go / web, where the native Google Sign-In module is missing. */
  available: boolean;
  email: string | null;
  autoBackup: boolean;
  lastBackupAt: number | null;
  /** There are local changes not yet uploaded. */
  dirty: boolean;
  busy: 'signin' | 'backup' | 'restore' | null;
  error: string | null;
};

const AUTO_DELAY_MS = 15_000;
const K = { email: 'backup.email', auto: 'backup.auto', last: 'backup.lastAt', file: 'backup.fileId', dirty: 'backup.dirty' };

let google: GoogleModule | null | undefined;
function getGoogle(): GoogleModule | null {
  if (google === undefined) {
    google = null;
    if (Platform.OS !== 'web') {
      try {
        // Loaded lazily: the native module does not exist in Expo Go.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod: GoogleModule = require('@react-native-google-signin/google-signin');
        const webClientId = Constants.expoConfig?.extra?.googleWebClientId as string | undefined;
        mod.GoogleSignin.configure({ scopes: [DRIVE_SCOPE], ...(webClientId ? { webClientId } : {}) });
        google = mod;
      } catch {
        google = null;
      }
    }
  }
  return google;
}

let status: BackupStatus = {
  available: false,
  email: null,
  autoBackup: false,
  lastBackupAt: null,
  dirty: false,
  busy: null,
  error: null,
};
const listeners = new Set<() => void>();
function set(patch: Partial<BackupStatus>) {
  status = { ...status, ...patch };
  listeners.forEach((l) => l());
}

export function useBackupStatus(): BackupStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
    () => status,
  );
}

function meta(key: string, value: string | null) {
  try {
    db.setMeta(key, value);
  } catch {
    // ignore — status in memory is still correct
  }
}

// ---- errors ----

function describe(e: unknown): string {
  const g = getGoogle();
  if (g?.isErrorWithCode(e)) {
    if (e.code === g.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return 'Brak Usług Google Play na tym urządzeniu.';
    if (e.code === g.statusCodes.IN_PROGRESS) return 'Logowanie już trwa.';
    if (String(e.code) === '10' || /DEVELOPER_ERROR/i.test(e.message)) {
      return 'Google odrzucił logowanie (DEVELOPER_ERROR). Sprawdź konfigurację w Google Cloud — pakiet com.hellohvbert.todoapp i odcisk SHA-1 klucza (README).';
    }
    return `Google: ${e.message}`;
  }
  if (e instanceof Error) {
    if (/Network request failed/i.test(e.message)) return 'Brak połączenia z internetem.';
    return e.message;
  }
  return String(e);
}

// ---- auth ----

async function accessToken(): Promise<string> {
  const g = getGoogle();
  if (!g) throw new Error('Logowanie Google działa tylko w zainstalowanej aplikacji (APK), nie w Expo Go.');
  if (!g.GoogleSignin.getCurrentUser()) {
    const res = await g.GoogleSignin.signInSilently();
    if (res.type !== 'success') throw new DriveAuthError('Zaloguj się ponownie przez Google.');
  }
  return (await g.GoogleSignin.getTokens()).accessToken;
}

/** Runs a Drive call; on an expired token clears it and retries once. */
async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await accessToken();
  try {
    return await fn(token);
  } catch (e) {
    if (!(e instanceof DriveAuthError)) throw e;
    await getGoogle()?.GoogleSignin.clearCachedAccessToken(token);
    return fn(await accessToken());
  }
}

export type SignInResult = { cancelled: true } | { cancelled: false; remote: RemoteFile | null };

/** Interactive sign-in. Returns the existing backup on Drive (if any) so the UI can decide what to do. */
export async function signIn(): Promise<SignInResult> {
  const g = getGoogle();
  if (!g) {
    set({ error: 'Logowanie Google działa tylko w zainstalowanej aplikacji (APK), nie w Expo Go.' });
    return { cancelled: true };
  }
  set({ busy: 'signin', error: null });
  try {
    await g.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await g.GoogleSignin.signIn();
    if (!g.isSuccessResponse(res)) return { cancelled: true };
    const email = res.data.user.email;
    meta(K.email, email);
    set({ email });
    const remote = await withToken(findBackup);
    if (remote) meta(K.file, remote.id);
    return { cancelled: false, remote };
  } catch (e) {
    set({ error: describe(e) });
    return { cancelled: true };
  } finally {
    set({ busy: null });
  }
}

export async function signOut() {
  clearTimer();
  try {
    await getGoogle()?.GoogleSignin.signOut();
  } catch {
    // signed out locally anyway
  }
  Object.values(K).forEach((k) => meta(k, null));
  set({ email: null, autoBackup: false, lastBackupAt: null, dirty: false, error: null });
}

export function setAutoBackup(on: boolean) {
  meta(K.auto, on ? '1' : null);
  set({ autoBackup: on });
  if (on && status.dirty) schedule();
}

// ---- backup / restore ----

let running: Promise<boolean> | null = null;

/** Uploads all data to Drive. Resolves to true on success. */
export function backupNow(): Promise<boolean> {
  clearTimer();
  running ??= (async () => {
    set({ busy: 'backup', error: null });
    try {
      const content = serializeBackup(getData());
      const file = await withToken(async (token) => {
        const known = db.getMeta(K.file) ?? (await findBackup(token))?.id;
        try {
          return await uploadBackup(token, content, known ?? undefined);
        } catch (e) {
          if (known && e instanceof Error && /błąd 404/.test(e.message)) return uploadBackup(token, content);
          throw e;
        }
      });
      const at = Date.now();
      meta(K.file, file.id);
      meta(K.last, String(at));
      meta(K.dirty, null);
      set({ lastBackupAt: at, dirty: false });
      return true;
    } catch (e) {
      set({ error: describe(e) });
      return false;
    } finally {
      set({ busy: null });
      running = null;
    }
  })();
  return running;
}

/** Replaces local data with the backup from Drive. */
export async function restoreFromDrive(): Promise<boolean> {
  clearTimer();
  set({ busy: 'restore', error: null });
  try {
    const raw = await withToken(async (token) => {
      const remote = await findBackup(token);
      if (!remote) throw new Error('Na Dysku Google nie ma jeszcze kopii.');
      meta(K.file, remote.id);
      return downloadBackup(token, remote.id);
    });
    const backup = parseBackup(raw);
    replaceData({ tasks: backup.tasks, lists: backup.lists });
    meta(K.last, String(backup.exportedAt));
    meta(K.dirty, null);
    set({ lastBackupAt: backup.exportedAt, dirty: false });
    return true;
  } catch (e) {
    set({ error: describe(e) });
    return false;
  } finally {
    set({ busy: null });
  }
}

// ---- automatic backup ----

let timer: ReturnType<typeof setTimeout> | null = null;
function clearTimer() {
  if (timer) clearTimeout(timer);
  timer = null;
}
function schedule(delay = AUTO_DELAY_MS) {
  if (!status.autoBackup || !status.email) return;
  clearTimer();
  timer = setTimeout(() => {
    timer = null;
    backupNow();
  }, delay);
}

let started = false;
/** Reads saved backup settings and starts listening for changes. Call once at startup. */
export function initBackup() {
  if (started) return;
  started = true;
  try {
    set({
      available: !!getGoogle(),
      email: db.getMeta(K.email),
      autoBackup: db.getMeta(K.auto) === '1',
      lastBackupAt: Number(db.getMeta(K.last)) || null,
      dirty: db.getMeta(K.dirty) === '1',
    });
  } catch {
    set({ available: !!getGoogle() });
  }
  onDataChange(() => {
    if (!status.email) return;
    if (!status.dirty) {
      meta(K.dirty, '1');
      set({ dirty: true });
    }
    schedule();
  });
  // Upload right away when the app goes to the background with unsaved changes.
  AppState.addEventListener('change', (s) => {
    if (s === 'background' && status.dirty && status.autoBackup && status.email && !running) backupNow();
  });
  if (status.dirty) schedule(3_000);
}
