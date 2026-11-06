/** Dates are stored as local "YYYY-MM-DD" keys, times as "HH:MM". */

export const MONTHS = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
];
export const MONTHS_GEN = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];
export const WEEKDAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
/** Monday-first short labels for the calendar header. */
export const WEEKDAYS_SHORT = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function addDays(key: string, days: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

/** Inclusive number of days between two keys (same day = 1). */
export function dayCount(start: string, end: string): number {
  return Math.round((fromKey(end).getTime() - fromKey(start).getTime()) / 86_400_000) + 1;
}

/** "piątek, 6 listopada" (+ year if not the current one). */
export function formatLong(key: string, now = new Date()): string {
  const d = fromKey(key);
  const year = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}${year}`;
}

/** "6 lis" style short label. */
export function formatShort(key: string, now = new Date()): string {
  const d = fromKey(key);
  const year = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()].slice(0, 3)}${year}`;
}

export function formatRange(start: string, end?: string, now = new Date()): string {
  if (!end || end === start) return formatShort(start, now);
  return `${formatShort(start, now)} – ${formatShort(end, now)}`;
}

/**
 * 6×7 grid of day keys for the month containing `year/month`, Monday first.
 * Days from neighbouring months are included to fill the weeks.
 */
export function monthGrid(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(year, month, 1 - offset);
  const days: string[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(toKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)));
  }
  return days;
}

export function timeToDate(time: string | undefined, base = new Date()): Date {
  const d = new Date(base);
  if (time) {
    const [h, m] = time.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  }
  return d;
}

export function dateToTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Polish currency formatting without relying on Intl availability. */
export function formatPrice(value: number): string {
  const [int, frac] = value.toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped},${frac} zł`;
}

/** Accepts "12,50", "12.5", "1 234,99 zł". Returns null when not a valid amount. */
export function parsePrice(input: string): number | null {
  const cleaned = input.replace(/zł/gi, '').replace(/[\s ]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100) / 100;
}

/** Polish plural: plural(1, 'zadanie', 'zadania', 'zadań'). */
export function plural(n: number, one: string, few: string, many: string): string {
  const word = n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many;
  return `${n} ${word}`;
}
