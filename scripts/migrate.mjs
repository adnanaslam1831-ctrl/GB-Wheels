// Applies db/schema.sql (idempotent). Runs before `next build`, so every deploy keeps the schema current.
import fs from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL not set: skipping (the site will show 'Database not connected').");
  process.exit(0);
}
const sql = fs.readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  await client.query(sql);
  console.log("[migrate] schema is up to date.");
} catch (e) {
  console.error("[migrate] FAILED:", e.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
