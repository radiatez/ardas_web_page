import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const repositoryRoot = process.cwd();
const composeFile = join(repositoryRoot, "compose.test.yaml");
const testDatabaseUrl =
  "postgresql://ardas_test:ardas_test@127.0.0.1:55432/ardas_test";

function dockerExecutable() {
  const candidates = [
    "docker",
    process.env.LOCALAPPDATA
      ? join(
          process.env.LOCALAPPDATA,
          "Programs",
          "DockerDesktop",
          "resources",
          "bin",
          "docker.exe",
        )
      : undefined,
    process.env.ProgramFiles
      ? join(
          process.env.ProgramFiles,
          "Docker",
          "Docker",
          "resources",
          "bin",
          "docker.exe",
        )
      : undefined,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === "docker") {
      const probe = spawnSync(candidate, ["--version"], { stdio: "ignore" });
      if (!probe.error) return candidate;
      continue;
    }
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Docker CLI bulunamadı. Docker Desktop kurulumundan sonra terminali yeniden açın.",
  );
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    env: options.env ?? process.env,
    stdio: options.quiet ? "ignore" : "inherit",
    shell: options.shell ?? false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`${command} komutu ${result.status ?? "unknown"} koduyla başarısız oldu.`);
  }
  return result.status ?? 1;
}

function runPnpm(args, environment) {
  if (process.platform === "win32") {
    return run(process.env.ComSpec ?? "cmd.exe", [
      "/d",
      "/s",
      "/c",
      `corepack pnpm ${args.join(" ")}`,
    ], { env: environment });
  }
  return run("corepack", ["pnpm", ...args], { env: environment });
}

const docker = dockerExecutable();
const compose = ["compose", "-f", composeFile];
const testEnvironment = {
  ...process.env,
  APP_ENV: "test",
  DATABASE_URL: testDatabaseUrl,
  TEST_DATABASE_URL: testDatabaseUrl,
};
const fullIntegration = process.argv.includes("--full");

run(docker, [...compose, "down", "--volumes", "--remove-orphans"], {
  allowFailure: true,
  quiet: true,
});

let started = false;
try {
  run(docker, [...compose, "up", "--detach", "--wait", "postgres-test"]);
  started = true;
  runPnpm(["run", "db:migrate"], testEnvironment);
  runPnpm(["run", "db:check"], testEnvironment);
  if (fullIntegration) {
    runPnpm(["run", "db:generate"], testEnvironment);
    run("git", ["diff", "--exit-code", "--", "drizzle"]);
  }
  runPnpm(["run", "test"], testEnvironment);
  if (fullIntegration) {
    runPnpm(["run", "build"], testEnvironment);
    runPnpm(["run", "test:e2e"], testEnvironment);
    runPnpm(["run", "drill:recovery"], testEnvironment);
    runPnpm(["run", "validate:rollback"], testEnvironment);
  }
} finally {
  if (started) {
    run(docker, [...compose, "down", "--volumes", "--remove-orphans"], {
      allowFailure: true,
    });
  }
}
