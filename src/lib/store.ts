import { useSyncExternalStore } from 'react';
import { store as db } from './db';
import type { Data } from './db-types';
import { newId, ShoppingItem, ShoppingList, Task } from './model';

type State = Data & { loaded: boolean };

let state: State = { loaded: false, tasks: [], lists: [] };
const listeners = new Set<() => void>();
const changeListeners = new Set<() => void>();

function emit(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

/** Called after every user change (used to schedule the Google Drive backup). */
export function onDataChange(fn: () => void): () => void {
  changeListeners.add(fn);
  return () => {
    changeListeners.delete(fn);
  };
}
const changed = () => changeListeners.forEach((l) => l());

let loading: Promise<void> | null = null;
export function loadStore(): Promise<void> {
  loading ??= db
    .load()
    .then((data) => emit({ ...data, loaded: true }))
    .catch(() => emit({ ...state, loaded: true }));
  return loading;
}

function subscribe(l: () => void) {
  listeners.add(l);
  loadStore();
  return () => {
    listeners.delete(l);
  };
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function getData(): Data {
  return { tasks: state.tasks, lists: state.lists };
}

export function isEmpty(): boolean {
  return state.tasks.length === 0 && state.lists.length === 0;
}

/** Replaces everything (restore from backup). Does not trigger a new backup. */
export function replaceData(data: Data) {
  db.replaceAll(data);
  emit({ ...data, loaded: true });
}

// ---- tasks ----

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'done'>;

function putTask(task: Task) {
  db.saveTask(task);
  const exists = state.tasks.some((t) => t.id === task.id);
  emit({ ...state, tasks: exists ? state.tasks.map((t) => (t.id === task.id ? task : t)) : [...state.tasks, task] });
  changed();
}

export function addTask(input: TaskInput) {
  putTask({ ...input, id: newId(), done: false, createdAt: Date.now() });
}

export function updateTask(id: string, patch: Partial<Task>) {
  const t = state.tasks.find((x) => x.id === id);
  if (t) putTask({ ...t, ...patch });
}

export function toggleTask(id: string) {
  const t = state.tasks.find((x) => x.id === id);
  if (t) putTask({ ...t, done: !t.done });
}

export function deleteTask(id: string) {
  db.deleteTask(id);
  emit({ ...state, tasks: state.tasks.filter((t) => t.id !== id) });
  changed();
}

// ---- shopping lists ----

function putList(list: ShoppingList) {
  db.saveList(list);
  const exists = state.lists.some((l) => l.id === list.id);
  emit({ ...state, lists: exists ? state.lists.map((l) => (l.id === list.id ? list : l)) : [list, ...state.lists] });
  changed();
}

export function addList(title: string, date?: string): string {
  const list: ShoppingList = { id: newId(), title, date, items: [], createdAt: Date.now() };
  putList(list);
  return list.id;
}

export function updateList(id: string, patch: Partial<ShoppingList>) {
  const l = state.lists.find((x) => x.id === id);
  if (l) putList({ ...l, ...patch });
}

export function deleteList(id: string) {
  db.deleteList(id);
  emit({ ...state, lists: state.lists.filter((l) => l.id !== id) });
  changed();
}

function updateItems(listId: string, fn: (items: ShoppingItem[]) => ShoppingItem[]) {
  const list = state.lists.find((l) => l.id === listId);
  if (list) updateList(listId, { items: fn(list.items) });
}

export function addItem(listId: string, name: string) {
  updateItems(listId, (items) => [...items, { id: newId(), name, done: false }]);
}

export function toggleItem(listId: string, itemId: string) {
  updateItems(listId, (items) => items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)));
}

export function deleteItem(listId: string, itemId: string) {
  updateItems(listId, (items) => items.filter((i) => i.id !== itemId));
}

export function completeList(id: string, finalPrice: number) {
  updateList(id, { completedAt: Date.now(), finalPrice });
}

export function reopenList(id: string) {
  updateList(id, { completedAt: undefined, finalPrice: undefined });
}

