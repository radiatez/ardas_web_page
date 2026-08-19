import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

function dockerExecutable() {
  const candidates = [
    "docker",
    process.env.LOCALAPPDATA
      ? join(process.env.LOCALAPPDATA, "Programs", "DockerDesktop", "resources", "bin", "docker.exe")
      : undefined,
    process.env.ProgramFiles
      ? join(process.env.ProgramFiles, "Docker", "Docker", "resources", "bin", "docker.exe")
      : undefined,
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate === "docker") {
      const probe = spawnSync(candidate, ["--version"], { stdio: "ignore" });
      if (!probe.error) return candidate;
    } else if (existsSync(candidate)) return candidate;
  }
  throw new Error("Docker CLI bulunamadı.");
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: options.capture ? "utf8" : undefined,
    stdio: options.capture ? "pipe" : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} komutu ${result.status ?? "unknown"} koduyla başarısız oldu.`);
  }
  return options.capture ? String(result.stdout).trim() : "";
}

const databaseUrl = new URL(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "");
if (!["ardas_test", "ardas_ci"].includes(databaseUrl.pathname.slice(1))) {
  throw new Error("Recovery drill yalnız ardas_test veya ardas_ci veritabanında çalışabilir.");
}
if (!["localhost", "127.0.0.1"].includes(databaseUrl.hostname)) {
  throw new Error("Recovery drill yalnız local disposable PostgreSQL hedefinde çalışabilir.");
}

const docker = dockerExecutable();
const labelled = run(
  docker,
  ["ps", "--filter", "label=com.docker.compose.project=ardas-test", "--format", "{{.ID}}"],
  { capture: true },
).split(/\s+/)[0];
const containerId = labelled || run(
  docker,
  ["ps", "--filter", "ancestor=postgres:18.4", "--format", "{{.ID}}"],
  { capture: true },
).split(/\s+/)[0];
if (!containerId) throw new Error("Disposable PostgreSQL 18.4 container bulunamadı.");

const user = decodeURIComponent(databaseUrl.username);
const database = databaseUrl.pathname.slice(1);
const exec = (...args) => run(docker, ["exec", containerId, ...args]);
const psql = (target, sql) =>
  exec("psql", "-v", "ON_ERROR_STOP=1", "-U", user, "-d", target, "-c", sql);

const fixtureHash = "a".repeat(64);
psql(
  database,
  `insert into rate_limit_bucket
    (route, identifier_hash, window_started_at, request_count, expires_at)
   values ('m8-recovery', '${fixtureHash}', '2020-01-01T00:00:00Z', 1, '2020-01-01T00:15:00Z')
   on conflict (route, identifier_hash, window_started_at) do update set request_count = 1`,
);
exec("pg_dump", "-U", user, "-d", database, "--format=custom", "--file=/tmp/ardas-m8.dump");
exec("dropdb", "--force", "-U", user, database);
exec("createdb", "-U", user, database);
exec("pg_restore", "--exit-on-error", "--no-owner", "-U", user, "-d", database, "/tmp/ardas-m8.dump");
psql(
  database,
  `do $$ begin
    if (select count(*) from public.__drizzle_migrations) < 1 then
      raise exception 'migration journal missing after restore';
    end if;
    if (select count(*) from rate_limit_bucket where route = 'm8-recovery') <> 1 then
      raise exception 'critical recovery fixture missing after restore';
    end if;
   end $$`,
);
psql(database, "delete from rate_limit_bucket where expires_at <= now()");
psql(
  database,
  `do $$ begin
    if exists (select 1 from rate_limit_bucket where route = 'm8-recovery') then
      raise exception 'post-restore retention cleanup failed';
    end if;
   end $$`,
);
exec("rm", "-f", "/tmp/ardas-m8.dump");

const recoveryDocument = readFileSync(join(process.cwd(), "docs", "operations", "BACKUP_RECOVERY.md"), "utf8");
if (!/pg_dump/i.test(recoveryDocument) || !/pg_restore/i.test(recoveryDocument)) {
  throw new Error("BACKUP_RECOVERY.md portability procedure is incomplete.");
}
console.log("M8_RECOVERY_DRILL backup=ok restore=ok migrations=ok fixture=ok retention_cleanup=ok");
