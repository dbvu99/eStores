import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString =
    import.meta.env.DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Provide a PostgreSQL connection string before using the API.",
    );
  }

  pool = new Pool({ connectionString });
  return pool;
}

export function getPoolDuc(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString =
    import.meta.env.DATABASE_URL_DUC || process.env.DATABASE_URL_DUC;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL_DUC is not set. Provide a PostgreSQL connection string before using the API.",
    );
  }

  pool = new Pool({ connectionString });
  return pool;
}
