import "server-only";
import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

// bigint (int8, incl. count(*)) and numeric come back as strings by default. Our values (PKR prices) fit in a JS number.
types.setTypeParser(20, (v) => Number(v));
types.setTypeParser(1700, (v) => Number(v));
// timestamptz -> ISO string (serialisable across the server/client boundary)
types.setTypeParser(1184, (v) => new Date(v).toISOString());

const g = globalThis as unknown as { __gbwPool?: Pool };

function pool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!g.__gbwPool) {
    g.__gbwPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_MAX ?? 5),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
    g.__gbwPool.on("error", (e) => console.error("[db] idle client error", e.message));
  }
  return g.__gbwPool;
}

export async function query<T extends QueryResultRow = Record<string, any>>(text: string, params: unknown[] = []): Promise<T[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const res = await pool().query<T>(text, params as unknown[]);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow = Record<string, any>>(text: string, params: unknown[] = []): Promise<T | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  return (await query<T>(text, params))[0] ?? null;
}

/** Run several statements atomically. Throws (and rolls back) if the callback throws. */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("begin");
    const out = await fn(client);
    await client.query("commit");
    return out;
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/** Never let a read failure take a whole page down: log it and use the fallback. */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[db] query failed:", (e as Error).message);
    return fallback;
  }
}
