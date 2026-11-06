/** Quantity + unit parsing for shopping items ("Mleko 2l", "2 kg ziemniaki", "Masło x2"). */

export const UNITS = ['szt.', 'kg', 'dag', 'g', 'l', 'ml', 'op.', 'paczka', 'puszka', 'butelka', 'pęczek'] as const;
export type Unit = (typeof UNITS)[number];

const ALIASES: Record<string, Unit> = {};
const add = (unit: Unit, ...names: string[]) => names.forEach((n) => (ALIASES[n] = unit));
add('szt.', 'szt', 'szt.', 'sztuka', 'sztuki', 'sztuk');
add('kg', 'kg', 'kilo', 'kilogram', 'kilograma', 'kilogramy', 'kilogramów');
add('dag', 'dag', 'dkg', 'deko');
add('g', 'g', 'gr', 'gram', 'grama', 'gramy', 'gramów');
add('l', 'l', 'litr', 'litra', 'litry', 'litrów');
add('ml', 'ml', 'mililitr', 'mililitrów');
add('op.', 'op', 'op.', 'opak', 'opak.', 'opakowanie', 'opakowania', 'opakowań');
add('paczka', 'paczka', 'paczki', 'paczek');
add('puszka', 'puszka', 'puszki', 'puszek');
add('butelka', 'but', 'but.', 'butelka', 'butelki', 'butelek');
add('pęczek', 'pęczek', 'pęczki', 'pęczków');

export type ParsedItem = { name: string; qty?: number; unit?: Unit };

const NUM = '(\\d+(?:[.,]\\d+)?)';
const UNIT = '([a-ząćęłńóśźż]+\\.?)';
const END = new RegExp(`^(.+?)\\s+${NUM}\\s*${UNIT}?$`, 'i');
const START = new RegExp(`^${NUM}\\s*${UNIT}?\\s+(.+)$`, 'i');
const X_END = new RegExp(`^(.+?)\\s+x\\s*${NUM}$`, 'i');
const X_START = new RegExp(`^${NUM}\\s*x\\s+(.+)$`, 'i');

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const toNum = (s: string) => Number(s.replace(',', '.'));

function build(name: string, num: string, unitWord?: string): ParsedItem | null {
  const qty = toNum(num);
  if (!(qty > 0) || !name.trim()) return null;
  let unit: Unit = 'szt.';
  if (unitWord) {
    const u = ALIASES[unitWord.toLowerCase()];
    if (!u) return null; // "Mleko 3,2%" or "Cola 7up" — not a quantity
    unit = u;
  }
  return { name: capitalize(name.trim()), qty, unit };
}

export function parseItem(input: string): ParsedItem {
  const text = input.trim().replace(/\s+/g, ' ');
  let m: RegExpMatchArray | null;
  let r: ParsedItem | null = null;
  if ((m = text.match(X_END))) r = build(m[1], m[2]);
  else if ((m = text.match(X_START))) r = build(m[2], m[1]);
  else if ((m = text.match(END)) && !/\d\s*x$/i.test(m[1])) r = build(m[1], m[2], m[3]);
  else if ((m = text.match(START))) r = build(m[3], m[1], m[2]);
  return r ?? { name: capitalize(text) };
}

export function formatNumber(n: number): string {
  return String(Math.round(n * 1000) / 1000).replace('.', ',');
}

export function formatQty(qty?: number, unit?: string): string {
  if (qty == null) return '';
  return `${formatNumber(qty)} ${unit ?? 'szt.'}`;
}

/** Step used by the −/+ buttons. */
export function stepFor(unit?: string): number {
  if (unit === 'kg' || unit === 'l') return 0.5;
  if (unit === 'g' || unit === 'ml') return 100;
  if (unit === 'dag') return 10;
  return 1;
}

export const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
