import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/domain/xepHangKiemTra.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } });
const { xepHangGiaTri } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const ds = (...values) => values.map((gia, i) => ({ id: String(i), gia }));

const normal = xepHangGiaTri(ds(30.6, 38.7, 44.7, 33.5, 35.5));
assert.deepEqual(['0', '1', '2', '3', '4'].map(id => normal.hang.get(id)), [5, 2, 1, 4, 3]);
assert.deepEqual([...normal.cuoi], ['0']);

const ties = xepHangGiaTri(ds(263, 263, 235, 227, 227));
assert.deepEqual([...ties.hang.values()], [1, 1, 3, 4, 4]);
assert.deepEqual([...ties.cao], ['0', '1']);
assert.deepEqual([...ties.thap], ['3', '4']);
assert.deepEqual([...ties.cuoi], ['3', '4']);

const boundary = xepHangGiaTri(ds(10, 8, 8, 3), 2);
assert.deepEqual([...boundary.cuoi], ['1', '2', '3']);
const missing = xepHangGiaTri(ds(null, NaN, Infinity, 0, 2));
assert.deepEqual([...missing.hang.entries()], [['4', 1], ['3', 2]]);
assert.deepEqual([...missing.thap], ['3']);
assert.deepEqual([...missing.cuoi], ['3']);
for (const values of [[], [null, NaN], [0], [7, 7, 7]]) {
  assert.equal(xepHangGiaTri(ds(...values)).cuoi.size, 0);
}
assert.equal(xepHangGiaTri(ds(3, 2, 1), 0).cuoi.size, 0);
assert.deepEqual([...xepHangGiaTri(ds(7, 7, 7)).hang.values()], [1, 1, 1]);
console.log('PASS: screenshot ranking, ties, shared extrema, bottom cutoff ties, missing/zero values, empty and equal groups.');
