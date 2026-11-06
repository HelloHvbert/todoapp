import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, dayCount, formatLong, formatPrice, monthGrid, parsePrice } from '../src/lib/dates.ts';
import { buildMarks, compareTasks, taskOnDay, type ShoppingList, type Task } from '../src/lib/model.ts';

const task = (p: Partial<Task>): Task => ({ id: Math.random().toString(), title: 't', done: false, createdAt: 0, ...p });

test('monthGrid starts on Monday and covers the month', () => {
  const g = monthGrid(2026, 10); // November 2026, starts on Sunday
  assert.equal(g.length, 42);
  assert.equal(g[0], '2026-10-26');
  assert.equal(g[6], '2026-11-01');
  assert.ok(g.includes('2026-11-30'));
});

test('date helpers', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(dayCount('2026-11-06', '2026-11-06'), 1);
  assert.equal(dayCount('2026-10-30', '2026-11-02'), 4);
  assert.equal(formatLong('2026-11-06', new Date(2026, 10, 6)), 'piątek, 6 listopada');
});

test('price parsing and formatting', () => {
  assert.equal(parsePrice('12,50'), 12.5);
  assert.equal(parsePrice('1 234,99 zł'), 1234.99);
  assert.equal(parsePrice('7'), 7);
  assert.equal(parsePrice('abc'), null);
  assert.equal(parsePrice('1,234'), null);
  assert.equal(parsePrice(''), null);
  assert.equal(formatPrice(1234.5), '1 234,50 zł');
});

test('taskOnDay handles single-day, ranges and undated tasks', () => {
  assert.equal(taskOnDay(task({}), '2026-11-06'), false);
  assert.equal(taskOnDay(task({ startDate: '2026-11-06' }), '2026-11-06'), true);
  const range = task({ startDate: '2026-11-05', endDate: '2026-11-08' });
  assert.equal(taskOnDay(range, '2026-11-04'), false);
  assert.equal(taskOnDay(range, '2026-11-07'), true);
  assert.equal(taskOnDay(range, '2026-11-08'), true);
  assert.equal(taskOnDay(range, '2026-11-09'), false);
});

test('buildMarks marks every day of a range and shopping days', () => {
  const tasks = [
    task({ startDate: '2026-10-30', endDate: '2026-11-02' }),
    task({ startDate: '2026-11-02', done: true }),
    task({}),
  ];
  const lists: ShoppingList[] = [{ id: 'a', title: 'Biedronka', date: '2026-11-02', items: [], createdAt: 0 }];
  const m = buildMarks(tasks, lists, '2026-11-01', '2026-11-30');
  assert.equal(m.has('2026-10-31'), false); // clipped to the visible range
  assert.deepEqual(m.get('2026-11-01'), { tasks: 1, done: 0, shopping: 0 });
  assert.deepEqual(m.get('2026-11-02'), { tasks: 2, done: 1, shopping: 1 });
  assert.equal(m.has('2026-11-03'), false);
});

test('compareTasks orders undone first, then by time', () => {
  const a = task({ title: 'a', done: true });
  const b = task({ title: 'b', startTime: '10:00' });
  const c = task({ title: 'c' });
  assert.deepEqual([a, b, c].sort(compareTasks).map((t) => t.title), ['c', 'b', 'a']);
});
