// Brings the database up to date: runs every file in database/migrations that this
// database has not run yet, in number order, and records it in the schema_migrations table.
// Usage (from the backend folder):  npm run migrate
// Safe to run any time - if everything is already applied, it just says so.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const DIR = path.join(__dirname, "..", "database", "migrations");

// Databases that existed before this script was added already contain these changes.
// The first time the script runs on such a database, it marks them as done instead of running them again.
const ALREADY_APPLIED_IF_TABLE_EXISTS = {
  "001_initial_schema.sql": "users",
  "002_drop_offs.sql": "drop_offs",
};

async function main() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_NAME) throw new Error("DB_NAME is missing from .env");

  const conn = await mysql.createConnection({
    host: DB_HOST || "localhost",
    port: Number(DB_PORT) || 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true, // each migration file holds several SQL statements
  });

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4`);
    await conn.changeUser({ database: DB_NAME });
    await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version    VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    const [rows] = await conn.query("SELECT version FROM schema_migrations");
    const done = new Set(rows.map((r) => r.version));

    if (done.size === 0) {
      for (const [file, table] of Object.entries(ALREADY_APPLIED_IF_TABLE_EXISTS)) {
        const [found] = await conn.query("SHOW TABLES LIKE ?", [table]);
        if (found.length) {
          await conn.query("INSERT INTO schema_migrations (version) VALUES (?)", [file]);
          done.add(file);
          console.log(`Already in this database: ${file} (table ${table} exists)`);
        }
      }
    }

    const files = fs.readdirSync(DIR).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
    const pending = files.filter((f) => !done.has(f));

    for (const file of pending) {
      process.stdout.write(`Running ${file} ... `);
      await conn.query(fs.readFileSync(path.join(DIR, file), "utf8"));
      await conn.query("INSERT INTO schema_migrations (version) VALUES (?)", [file]);
      console.log("done");
    }

    console.log(
      pending.length
        ? `Database ${DB_NAME} is up to date (${pending.length} migration(s) run).`
        : `Database ${DB_NAME} is already up to date - nothing to run.`
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message);
  console.error("Files after the failed one were not run. Fix the problem, then run `npm run migrate` again.");
  process.exit(1);
});
