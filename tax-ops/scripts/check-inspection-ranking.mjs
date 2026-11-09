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

// Kiểm tra kịch bản dữ liệu demo bằng dữ liệu nguồn, không ghim hạng ở UI.
const moduleUrl = source => {
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
};
const randomUrl = moduleUrl(await readFile(new URL('../src/data/ngauNhien.ts', import.meta.url), 'utf8'));
const dataSource = (await readFile(new URL('../src/data/kiemTra.ts', import.meta.url), 'utf8')).replace('@/data/ngauNhien', randomUrl);
const kt = await import(moduleUrl(dataSource));
const criteria = [kt.tyLeHT, c => c.htNay, c => c.thuNay, kt.binhQuan, kt.tyLeDonDoc];
for (let month = 1; month <= 12; month++) {
  for (const mode of ['chung', 'dichDanh']) {
    const leader = kt.soLieuKT('KT1', month)[mode];
    for (const metric of criteria) {
      for (const unit of kt.PHONG_KT.filter(d => d.id !== 'KT1')) {
        assert.ok(metric(leader) > metric(kt.soLieuKT(unit.id, month)[mode]), `KT1 must lead: month ${month}, ${mode}, ${unit.id}`);
      }
    }
    for (const field of Object.keys(leader)) {
      const sum = kt.DON_VI_KT.reduce((sum, d) => sum + kt.soLieuKT(d.id, month)[mode][field], 0);
      assert.equal(kt.soLieuKT('TN', month)[mode][field], sum);
    }
  }
  for (const unit of kt.DON_VI_KT) {
    const data = kt.soLieuKT(unit.id, month);
    assert.equal(Object.values(data.loai).reduce((a, b) => a + b, 0), data.chung.htNay);
    assert.equal(data.loai.dichDanh, data.dichDanh.htNay);
    assert.ok(data.dichDanh.htNay <= data.chung.htNay);
    for (const mode of ['chung', 'dichDanh']) {
      assert.ok(data[mode].nop <= data[mode].thuNay);
      assert.ok(data[mode].coTruyThu <= data[mode].htNay);
    }
  }
}
console.log('PASS: KT1 leads all 5 criteria in both modes for all 12 months; totals and inspection types reconcile.');
