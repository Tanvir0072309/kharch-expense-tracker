const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "kharch",
});

const migrationsPath = path.join(
  __dirname,
  "../../infrastructure/postgres/migrations",
);

const migrate = async () => {
  const client = await pool.connect();

  try {
    console.log("🚀 Starting migration...");

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