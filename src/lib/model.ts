import { addDays } from './dates';

export type Task = {
  id: string;
  title: string;
  note?: string;
  done: boolean;
  /** Optional — tasks without a date live in the "Ogólne" tab. */
  startDate?: string;
  /** Optional last day for multi-day events (inclusive). */
  endDate?: string;
  startTime?: string;
  endTime?: string;
  createdAt: number;
};

export type ShoppingItem = {
  id: string;
  name: string;
  done: boolean;
  /** Optional amount, e.g. 2 with unit "kg". */
  qty?: number;
  unit?: string;
};

export type ShoppingList = {
  id: string;
  title: string;
  date?: string;
  items: ShoppingItem[];
  /** Set when the list is completed ("zaliczona"). */
  completedAt?: number;
  finalPrice?: number;
  createdAt: number;
};

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function taskOnDay(task: Task, day: string): boolean {
  if (!task.startDate) return false;
  const end = task.endDate && task.endDate >= task.startDate ? task.endDate : task.startDate;
  return task.startDate <= day && day <= end;
}

export function isMultiDay(task: Task): boolean {
  return !!task.startDate && !!task.endDate && task.endDate > task.startDate;
}

/** Sort: undone first, then by start time (untimed first), then creation. */
export function compareTasks(a: Task, b: Task): number {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const ta = a.startTime ?? '';
  const tb = b.startTime ?? '';
  if (ta !== tb) return ta < tb ? -1 : 1;
  return a.createdAt - b.createdAt;
}

export type DayMarks = { tasks: number; done: number; shopping: number };

/** Per-day counters used to draw markers on the calendar. */
export function buildMarks(tasks: Task[], lists: ShoppingList[], from: string, to: string): Map<string, DayMarks> {
  const marks = new Map<string, DayMarks>();
  const get = (k: string) => {
    let m = marks.get(k);
    if (!m) marks.set(k, (m = { tasks: 0, done: 0, shopping: 0 }));
    return m;
  };
  for (const t of tasks) {
    if (!t.startDate) continue;
    const end = t.endDate && t.endDate >= t.startDate ? t.endDate : t.startDate;
    if (end < from || t.startDate > to) continue;
    const start = t.startDate < from ? from : t.startDate;
    const last = end > to ? to : end;
    for (let day = start; day <= last; day = addDays(day, 1)) {
      const m = get(day);
      m.tasks++;
      if (t.done) m.done++;
    }
  }
  for (const l of lists) {
    if (l.date && l.date >= from && l.date <= to) get(l.date).shopping++;
  }
  return marks;
}

export function listProgress(list: ShoppingList): { done: number; total: number } {
  return { done: list.items.filter((i) => i.done).length, total: list.items.length };
}
