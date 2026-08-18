import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export function createDatabase(connectionString: string) {
  const isLocal = /(?:localhost|127\.0\.0\.1|\[::1\])/.test(connectionString);
  const pool = new Pool({
    connectionString,
    max: 10,
    ssl: isLocal ? undefined : { rejectUnauthorized: true },
  });

  return {
    db: drizzle(pool, { schema }),
    pool,
  };
}

export function createDatabaseFromEnvironment() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for database access.");
  }

  return createDatabase(connectionString);
}
