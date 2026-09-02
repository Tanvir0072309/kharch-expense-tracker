const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

// Falls back to the same SHARD_0_* vars the running app already uses
// (see src/config/database.js), so you don't need a separate set of
// DB_* vars just to run migrations against the primary shard.
const pool = new Pool({
  host: process.env.DB_HOST || process.env.SHARD_0_HOST || "localhost",
  port: Number(process.env.DB_PORT || process.env.SHARD_0_PORT) || 5432,
  user: process.env.DB_USER || process.env.SHARD_0_USER || "postgres",
  password: process.env.DB_PASSWORD || process.env.SHARD_0_PASSWORD,
  database: process.env.DB_NAME || process.env.SHARD_0_DB || "kharch",
});

// Self-contained: migrations live inside this package (server/migrations),
// not in a sibling "infrastructure" folder that may not exist wherever this
// image/checkout is deployed. Still overridable via MIGRATIONS_DIR for
// setups that do keep migrations elsewhere.
const migrationsPath = process.env.MIGRATIONS_DIR
  ? path.resolve(process.env.MIGRATIONS_DIR)
  : path.join(__dirname, "../migrations");

const migrate = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Starting migration...");
    console.log(`   Target DB: ${pool.options.host}:${pool.options.port}/${pool.options.database}`);
    console.log(`   Migrations dir: ${migrationsPath}`);

    await client.query("BEGIN");

    // Migration tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationFiles = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (migrationFiles.length === 0) {
      throw new Error("No migration files found");
    }

    for (const filename of migrationFiles) {
      const { rows } = await client.query(
        `
          SELECT 1
          FROM schema_migrations
          WHERE filename = $1
        `,
        [filename],
      );

      if (rows.length > 0) {
        console.log(`⏭️  Skipping ${filename}`);
        continue;
      }

      console.log(`▶️  Running ${filename}`);

      const migrationPath = path.join(
        migrationsPath,
        filename,
      );

      const sql = fs.readFileSync(
        migrationPath,
        "utf8",
      );

      await client.query(sql);

      await client.query(
        `
          INSERT INTO schema_migrations (filename)
          VALUES ($1)
        `,
        [filename],
      );

      console.log(`✅ ${filename} completed`);
    }

    await client.query("COMMIT");

    console.log("🎉 All migrations completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("❌ Migration failed:", error);

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();