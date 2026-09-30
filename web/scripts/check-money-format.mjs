import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(new URL("../src/domain/moneyFormat.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
const { budgetMoneyParts, BILLION_SCALE } = await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));
for (const [value, number, million] of [
  [7.06e9, "7,06", false], [240e6, "240", true], [-94e6, "−94", true],
  [0, "0", false], [1e9, "1", false], [999999999, "1", false],
  [500, "<0,01", true], [null, "—", false], [NaN, "—", false],
]) assert.deepEqual(budgetMoneyParts(value), { number, million });
assert.equal(BILLION_SCALE.unit, "tỷ đồng");
console.log("PASS: default billions, explicit millions, signed/zero/missing values");
