import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Data, Db } from './db-types';

// Web preview only: keeps everything in one AsyncStorage (localStorage) entry.
const KEY = 'todoapp:state:v1';
let data: Data = { tasks: [], lists: [] };
const meta = new Map<string, string>();
const flush = () => AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});

export const store: Db = {
  async load() {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Data>) : {};
    data = { tasks: parsed.tasks ?? [], lists: parsed.lists ?? [] };
    return data;
  },
  saveTask(task) {
    data = { ...data, tasks: [...data.tasks.filter((t) => t.id !== task.id), task] };
    flush();
  },
  deleteTask(id) {
    data = { ...data, tasks: data.tasks.filter((t) => t.id !== id) };
    flush();
  },
  saveList(list) {
    data = { ...data, lists: [list, ...data.lists.filter((l) => l.id !== list.id)] };
    flush();
  },
  deleteList(id) {
    data = { ...data, lists: data.lists.filter((l) => l.id !== id) };
    flush();
  },
  replaceAll(next) {
    data = next;
    flush();
  },
  getMeta: (key) => meta.get(key) ?? null,
  setMeta: (key, value) => (value == null ? meta.delete(key) : meta.set(key, value)),
};
