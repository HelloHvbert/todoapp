import type { ShoppingList, Task } from './model';

export type Data = { tasks: Task[]; lists: ShoppingList[] };

/** Persistence backend: SQLite on devices, AsyncStorage on web (see db.web.ts). */
export type Db = {
  load(): Promise<Data>;
  saveTask(task: Task): void;
  deleteTask(id: string): void;
  /** Writes the list together with all of its items. */
  saveList(list: ShoppingList): void;
  deleteList(id: string): void;
  replaceAll(data: Data): void;
  getMeta(key: string): string | null;
  setMeta(key: string, value: string | null): void;
};
