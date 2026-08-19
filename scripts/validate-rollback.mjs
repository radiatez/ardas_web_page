import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const rollback = readFileSync(join(root, "docs", "operations", "ROLLBACK.md"), "utf8");
for (const required of [
  "known previous good version",
  "forward-fix/rollback plan",
  "public routes",
  "admin auth",
  "protected CV access",
]) {
  if (!rollback.toLowerCase().includes(required.toLowerCase())) {
    throw new Error(`ROLLBACK.md missing required contract: ${required}`);
  }
}

const migrationFiles = readdirSync(join(root, "drizzle"))
  .filter((file) => /^\d+_.+\.sql$/.test(file))
  .sort();
if (migrationFiles.length === 0) throw new Error("No committed migrations found.");
for (const file of migrationFiles) {
  const sql = readFileSync(join(root, "drizzle", file), "utf8");
  if (/\b(?:drop\s+database|truncate)\b/i.test(sql)) {
    throw new Error(`Destructive rollback-incompatible statement found in ${file}.`);
  }
}
console.log(`M8_ROLLBACK_CONTRACT migrations=${migrationFiles.length} procedure=ok destructive_database_ops=none`);
