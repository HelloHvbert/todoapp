import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseBackup, serializeBackup } from '../src/lib/backup-format.ts';

const data = {
  tasks: [{ id: 't1', title: 'Siłownia', done: false, startDate: '2026-11-06', createdAt: 1 }],
  lists: [{ id: 'l1', title: 'Biedronka', items: [{ id: 'i1', name: 'Mleko', done: true }], finalPrice: 23.47, completedAt: 5, createdAt: 2 }],
};

test('backup round-trips tasks and shopping lists', () => {
  const back = parseBackup(serializeBackup(data, 123));
  assert.equal(back.exportedAt, 123);
  assert.deepEqual(back.tasks, data.tasks);
  assert.deepEqual(back.lists, data.lists);
});

test('rejects files that are not our backups', () => {
  assert.throws(() => parseBackup('nope'), /uszkodzony/);
  assert.throws(() => parseBackup('{"tasks":[]}'), /nie jest kopia/);
  assert.throws(() => parseBackup(JSON.stringify({ app: 'todoapp', version: 2, tasks: [], lists: [] })), /nowszej wersji/);
});
