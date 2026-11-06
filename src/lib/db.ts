import AsyncStorage from '@react-native-async-storage/async-storage';
import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import type { Data, Db } from './db-types';
import type { ShoppingList, Task } from './model';

const LEGACY_KEY = 'todoapp:state:v1';

type TaskRow = {
  id: string;
  title: string;
  note: string | null;
  done: number;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: number;
};
type ListRow = {
  id: string;
  title: string;
  date: string | null;
  completed_at: number | null;
  final_price: number | null;
  created_at: number;
};
type ItemRow = { id: string; list_id: string; name: string; done: number; qty: number | null; unit: string | null };

const u = <T,>(v: T | null): T | undefined => (v == null ? undefined : v);

/** Schema changes after the first release, applied in order (PRAGMA user_version). */
const MIGRATIONS = [
  // 1: quantity and unit for shopping items
  'ALTER TABLE items ADD COLUMN qty REAL; ALTER TABLE items ADD COLUMN unit TEXT;',
];

function migrate(d: SQLiteDatabase) {
  const version = d.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
  for (let v = version; v < MIGRATIONS.length; v++) {
    d.withTransactionSync(() => {
      d.execSync(MIGRATIONS[v]);
      d.execSync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}

let conn: SQLiteDatabase | null = null;
function db(): SQLiteDatabase {
  if (!conn) {
    conn = openDatabaseSync('todo.db');
    conn.execSync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        note TEXT,
        done INTEGER NOT NULL DEFAULT 0,
        start_date TEXT,
        end_date TEXT,
        start_time TEXT,
        end_time TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS tasks_start ON tasks (start_date);
      CREATE TABLE IF NOT EXISTS lists (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        date TEXT,
        completed_at INTEGER,
        final_price REAL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY NOT NULL,
        list_id TEXT NOT NULL REFERENCES lists (id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS items_list ON items (list_id);
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    `);
    migrate(conn);
  }
  return conn;
}

function writeTask(t: Task) {
  db().runSync(
    `INSERT OR REPLACE INTO tasks (id, title, note, done, start_date, end_date, start_time, end_time, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    t.id, t.title, t.note ?? null, t.done ? 1 : 0, t.startDate ?? null, t.endDate ?? null,
    t.startTime ?? null, t.endTime ?? null, t.createdAt,
  );
}

function writeList(l: ShoppingList) {
  const d = db();
  d.runSync(
    `INSERT OR REPLACE INTO lists (id, title, date, completed_at, final_price, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    l.id, l.title, l.date ?? null, l.completedAt ?? null, l.finalPrice ?? null, l.createdAt,
  );
  d.runSync('DELETE FROM items WHERE list_id = ?', l.id);
  l.items.forEach((i, pos) =>
    d.runSync(
      'INSERT INTO items (id, list_id, name, done, position, qty, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      i.id, l.id, i.name, i.done ? 1 : 0, pos, i.qty ?? null, i.unit ?? null,
    ),
  );
}

function readAll(): Data {
  const d = db();
  const tasks = d.getAllSync<TaskRow>('SELECT * FROM tasks ORDER BY created_at').map(
    (r): Task => ({
      id: r.id,
      title: r.title,
      note: u(r.note),
      done: !!r.done,
      startDate: u(r.start_date),
      endDate: u(r.end_date),
      startTime: u(r.start_time),
      endTime: u(r.end_time),
      createdAt: r.created_at,
    }),
  );
  const items = d.getAllSync<ItemRow>('SELECT id, list_id, name, done, qty, unit FROM items ORDER BY position');
  const lists = d.getAllSync<ListRow>('SELECT * FROM lists ORDER BY created_at DESC').map(
    (r): ShoppingList => ({
      id: r.id,
      title: r.title,
      date: u(r.date),
      completedAt: u(r.completed_at),
      finalPrice: u(r.final_price),
      createdAt: r.created_at,
      items: items.filter((i) => i.list_id === r.id).map((i) => ({ id: i.id, name: i.name, done: !!i.done, qty: u(i.qty), unit: u(i.unit) })),
    }),
  );
  return { tasks, lists };
}

function replaceAll(data: Data) {
  const d = db();
  d.withTransactionSync(() => {
    d.execSync('DELETE FROM items; DELETE FROM lists; DELETE FROM tasks;');
    data.tasks.forEach(writeTask);
    data.lists.forEach(writeList);
  });
}

/** One-time import of data saved by the first (AsyncStorage) version of the app. */
async function migrateLegacy() {
  const raw = await AsyncStorage.getItem(LEGACY_KEY);
  if (!raw) return;
  const old = JSON.parse(raw) as Partial<Data>;
  const empty = db().getFirstSync<{ n: number }>('SELECT (SELECT COUNT(*) FROM tasks) + (SELECT COUNT(*) FROM lists) AS n');
  if (!empty?.n) replaceAll({ tasks: old.tasks ?? [], lists: old.lists ?? [] });
  await AsyncStorage.removeItem(LEGACY_KEY);
}

export const store: Db = {
  async load() {
    try {
      await migrateLegacy();
    } catch {
      // keep going with whatever is in SQLite
    }
    return readAll();
  },
  saveTask: writeTask,
  deleteTask: (id) => {
    db().runSync('DELETE FROM tasks WHERE id = ?', id);
  },
  saveList: (l) => db().withTransactionSync(() => writeList(l)),
  deleteList: (id) => {
    db().runSync('DELETE FROM lists WHERE id = ?', id);
  },
  replaceAll,
  getMeta: (key) => db().getFirstSync<{ value: string }>('SELECT value FROM meta WHERE key = ?', key)?.value ?? null,
  setMeta: (key, value) => {
    if (value == null) db().runSync('DELETE FROM meta WHERE key = ?', key);
    else db().runSync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', key, value);
  },
};
