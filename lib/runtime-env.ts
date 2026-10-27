import { AsyncLocalStorage } from "node:async_hooks";
type RuntimeEnv = Record<string, unknown>;
const store = new AsyncLocalStorage<RuntimeEnv>();
export function withRuntimeEnv<T>(env: RuntimeEnv, run: () => T): T {
  return store.run(env, run);
}
export function runtimeValue(key: string): string {
  const value = store.getStore()?.[key] ?? process.env[key];
  return typeof value === "string" ? value : "";
}
