import { spawn } from "node:child_process";

export class ProcessStopped extends Error {
  constructor(label, code, signal, requested) {
    super(signal ? `${label}: stopped by ${signal}` : `${label}: exited with code ${code}`);
    this.exitCode = signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : code || 1;
    this.requested = requested;
  }
}

// Remove listeners after every command so completed builds cannot receive a
// later shutdown signal. Wait for close so inherited output has finished.
export function runProcess(label, command, args, options, { spawnProcess = spawn, host = process } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnProcess(command, args, options);
    let requested;
    const stop = (signal) => {
      requested ??= signal;
      child.kill(signal);
    };
    const onInterrupt = () => stop("SIGINT");
    const onTerminate = () => stop("SIGTERM");
    const cleanup = () => {
      host.removeListener("SIGINT", onInterrupt);
      host.removeListener("SIGTERM", onTerminate);
    };
    host.on("SIGINT", onInterrupt);
    host.on("SIGTERM", onTerminate);
    child.once("error", (error) => {
      cleanup();
      reject(error);
    });
    child.once("close", (code, signal) => {
      cleanup();
      // An interrupted build must not start the next stage, even if the child
      // handles the signal and returns zero (or Windows reports only a code).
      if (requested || signal || code !== 0) reject(new ProcessStopped(label, code, signal ?? requested, !!requested));
      else resolve();
    });
  });
}
