import { createDatabaseFromEnvironment } from "./client";

type RuntimeDatabase = ReturnType<typeof createDatabaseFromEnvironment>;

const runtimeGlobal = globalThis as typeof globalThis & {
  ardasRuntimeDatabase?: RuntimeDatabase;
};

export function getRuntimeDatabase(): RuntimeDatabase {
  if (!runtimeGlobal.ardasRuntimeDatabase) {
    runtimeGlobal.ardasRuntimeDatabase = createDatabaseFromEnvironment();
  }

  return runtimeGlobal.ardasRuntimeDatabase;
}
