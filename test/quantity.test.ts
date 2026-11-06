import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatQty, parseItem } from '../src/lib/quantity.ts';

const cases: [string, ReturnType<typeof parseItem>][] = [
  ['Mleko 2l', { name: 'Mleko', qty: 2, unit: 'l' }],
  ['mleko 2 l', { name: 'Mleko', qty: 2, unit: 'l' }],
  ['2 kg ziemniaki', { name: 'Ziemniaki', qty: 2, unit: 'kg' }],
  ['2kg ziemniaki', { name: 'Ziemniaki', qty: 2, unit: 'kg' }],
  ['Szynka 30 dag', { name: 'Szynka', qty: 30, unit: 'dag' }],
  ['Szynka 30dkg', { name: 'Szynka', qty: 30, unit: 'dag' }],
  ['Jajka 10', { name: 'Jajka', qty: 10, unit: 'szt.' }],
  ['10 jajek', { name: 'Jajek', qty: 10, unit: 'szt.' }],
  ['Masło x2', { name: 'Masło', qty: 2, unit: 'szt.' }],
  ['2x masło', { name: 'Masło', qty: 2, unit: 'szt.' }],
  ['2 x masło', { name: 'Masło', qty: 2, unit: 'szt.' }],
  ['Woda 1,5l', { name: 'Woda', qty: 1.5, unit: 'l' }],
  ['Woda 1.5 litra', { name: 'Woda', qty: 1.5, unit: 'l' }],
  ['Pomidory 3 szt', { name: 'Pomidory', qty: 3, unit: 'szt.' }],
  ['Makaron 2 opak.', { name: 'Makaron', qty: 2, unit: 'op.' }],
  ['Pietruszka 1 pęczek', { name: 'Pietruszka', qty: 1, unit: 'pęczek' }],
  ['Kukurydza 2 puszki', { name: 'Kukurydza', qty: 2, unit: 'puszka' }],
  ['Chleb', { name: 'Chleb' }],
  ['7up', { name: '7up' }],
  ['Cola 7up', { name: 'Cola 7up' }],
  ['Mleko 3,2%', { name: 'Mleko 3,2%' }],
  ['Mleko 0', { name: 'Mleko 0' }],
  ['Woda 6 x 1,5l', { name: 'Woda 6 x 1,5l' }],
  ['  pasta   do zębów  ', { name: 'Pasta do zębów' }],
];

for (const [input, expected] of cases) {
  test(`parseItem(${JSON.stringify(input)})`, () => assert.deepEqual(parseItem(input), expected));
}

test('formatQty', () => {
  assert.equal(formatQty(1.5, 'l'), '1,5 l');
  assert.equal(formatQty(2), '2 szt.');
  assert.equal(formatQty(undefined), '');
  assert.equal(formatQty(0.1 + 0.2, 'kg'), '0,3 kg');
});
