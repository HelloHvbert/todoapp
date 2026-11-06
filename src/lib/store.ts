import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { newId, ShoppingItem, ShoppingList, Task } from './model';

type State = { loaded: boolean; tasks: Task[]; lists: ShoppingList[] };

const KEY = 'todoapp:state:v1';
let state: State = { loaded: false, tasks: [], lists: [] };
const listeners = new Set<() => void>();

function emit(next: State, persist = true) {
  state = next;
  listeners.forEach((l) => l());
  if (persist) {
    AsyncStorage.setItem(KEY, JSON.stringify({ tasks: state.tasks, lists: state.lists })).catch(() => {});
  }
}

let loading: Promise<void> | null = null;
function load() {
  loading ??= AsyncStorage.getItem(KEY)
    .then((raw) => {
      const data = raw ? (JSON.parse(raw) as Partial<State>) : {};
      emit({ loaded: true, tasks: data.tasks ?? [], lists: data.lists ?? [] }, false);
    })
    .catch(() => emit({ ...state, loaded: true }, false));
  return loading;
}

function subscribe(l: () => void) {
  listeners.add(l);
  load();
  return () => {
    listeners.delete(l);
  };
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

// ---- tasks ----

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'done'>;

export function addTask(input: TaskInput) {
  const task: Task = { ...input, id: newId(), done: false, createdAt: Date.now() };
  emit({ ...state, tasks: [...state.tasks, task] });
}

export function updateTask(id: string, patch: Partial<Task>) {
  emit({ ...state, tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
}

export function toggleTask(id: string) {
  const t = state.tasks.find((x) => x.id === id);
  if (t) updateTask(id, { done: !t.done });
}

export function deleteTask(id: string) {
  emit({ ...state, tasks: state.tasks.filter((t) => t.id !== id) });
}

// ---- shopping lists ----

export function addList(title: string, date?: string): string {
  const list: ShoppingList = { id: newId(), title, date, items: [], createdAt: Date.now() };
  emit({ ...state, lists: [list, ...state.lists] });
  return list.id;
}

export function updateList(id: string, patch: Partial<ShoppingList>) {
  emit({ ...state, lists: state.lists.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
}

export function deleteList(id: string) {
  emit({ ...state, lists: state.lists.filter((l) => l.id !== id) });
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
