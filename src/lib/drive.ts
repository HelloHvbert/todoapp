/** Minimal Google Drive v3 client for one JSON file in the hidden app data folder. */

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const FILE_NAME = 'todo-backup.json';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

export class DriveAuthError extends Error {}

export type RemoteFile = { id: string; modifiedTime: string };

async function call(token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } });
  if (res.status === 401) throw new DriveAuthError('Sesja Google wygasła');
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Google Drive: błąd ${res.status}${body ? ` – ${body.slice(0, 200)}` : ''}`);
  }
  return res;
}

export async function findBackup(token: string): Promise<RemoteFile | null> {
  const q = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
  const res = await call(
    token,
    `${API}/files?spaces=appDataFolder&q=${q}&orderBy=modifiedTime desc&fields=files(id,modifiedTime)&pageSize=1`,
  );
  const json = (await res.json()) as { files?: RemoteFile[] };
  return json.files?.[0] ?? null;
}

export async function downloadBackup(token: string, fileId: string): Promise<string> {
  const res = await call(token, `${API}/files/${fileId}?alt=media`);
  return res.text();
}

/** Creates the backup file, or overwrites it when `fileId` is given. Returns the file. */
export async function uploadBackup(token: string, content: string, fileId?: string): Promise<RemoteFile> {
  if (fileId) {
    const res = await call(token, `${UPLOAD}/files/${fileId}?uploadType=media&fields=id,modifiedTime`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: content,
    });
    return res.json();
  }
  const boundary = `todo${Date.now()}`;
  const metadata = JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'], mimeType: 'application/json' });
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`;
  const res = await call(token, `${UPLOAD}/files?uploadType=multipart&fields=id,modifiedTime`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  return res.json();
}
