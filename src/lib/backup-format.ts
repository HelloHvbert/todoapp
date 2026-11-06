import type { Data } from './db-types';

export type BackupFile = Data & { app: 'todoapp'; version: 1; exportedAt: number };

export function serializeBackup(data: Data, now = Date.now()): string {
  const file: BackupFile = { app: 'todoapp', version: 1, exportedAt: now, tasks: data.tasks, lists: data.lists };
  return JSON.stringify(file);
}

/** Validates a downloaded backup; throws a readable error when it is not ours. */
export function parseBackup(raw: string): BackupFile {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error('Plik kopii jest uszkodzony.');
  }
  const f = json as Partial<BackupFile>;
  if (f?.app !== 'todoapp' || !Array.isArray(f.tasks) || !Array.isArray(f.lists)) {
    throw new Error('To nie jest kopia tej aplikacji.');
  }
  if (f.version !== 1) throw new Error('Kopia pochodzi z nowszej wersji aplikacji — zaktualizuj aplikację.');
  return f as BackupFile;
}
