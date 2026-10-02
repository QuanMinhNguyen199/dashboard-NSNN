import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { runProcess, ProcessStopped } from "./run-process.mjs";

function fixture() {
  const host = new EventEmitter();
  const child = new EventEmitter();
  const killed = [];
  child.kill = signal => killed.push(signal);
  const run = () => runProcess("test: Vite", "node", [], {}, { host, spawnProcess: () => child });
  const clean = () => {
    assert.equal(host.listenerCount("SIGINT"), 0);
    assert.equal(host.listenerCount("SIGTERM"), 0);
  };
  return { host, child, killed, run, clean };
}

test("successful build removes shutdown listeners", async () => {
  const f = fixture();
  const done = f.run();
  f.child.emit("close", 0, null);
  await done;
  f.clean();
  f.host.emit("SIGINT");
  assert.deepEqual(f.killed, []);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  test(`${signal} stops the pipeline even when the child returns zero`, async () => {
    const f = fixture();
    const done = f.run();
    f.host.emit(signal);
    f.child.emit("close", 0, null);
    await assert.rejects(done, e => e instanceof ProcessStopped && e.requested && e.message.includes(signal));
    assert.deepEqual(f.killed, [signal]);
    f.clean();
  });
}

test("unexpected signal includes its name instead of exit null", async () => {
  const f = fixture();
  const done = f.run();
  f.child.emit("close", null, "SIGKILL");
  await assert.rejects(done, e => !e.requested && e.message.includes("SIGKILL") && e.exitCode !== 0);
  f.clean();
});

test("spawn failure removes shutdown listeners", async () => {
  const f = fixture();
  const done = f.run();
  f.child.emit("error", new Error("ENOENT"));
  await assert.rejects(done, /ENOENT/);
  f.child.emit("close", -2, null);
  f.clean();
});

test("real child success and failure preserve exit status", async () => {
  await runProcess("node", process.execPath, ["-e", "process.exit(0)"], { stdio: "ignore" });
  await assert.rejects(
    runProcess("node", process.execPath, ["-e", "process.exit(7)"], { stdio: "ignore" }),
    e => e.exitCode === 7 && !e.requested,
  );
});
