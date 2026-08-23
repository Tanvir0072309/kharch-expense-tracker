const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "../../../server/.env") });

// Database connection from server's .env
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "kharch",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const runMigration = async () => {
  try {
    console.log("🔄 Starting database migration...");

    // Migration file path (relative to this script)
    const migrationFile = path.join(
      __dirname,
      "../migrations/001_create_tables.sql"
    );
    
    console.log(`📄 Reading migration file: ${migrationFile}`);
    
    // Check if file exists
    if (!fs.existsSync(migrationFile)) {
      console.error(`❌ Migration file not found at: ${migrationFile}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, "utf-8");

    // Split SQL into individual statements
    const statements = sql
      .split(";")
      .filter((stmt) => stmt.trim().length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Test database connection first
    try {
      const client = await pool.connect();
      console.log("✅ Database connection successful");
      client.release();
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      process.exit(1);
    }

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt) {
        try {
          await pool.query(stmt);
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          // Check if it's a "already exists" error (which is fine)
          if (error.code === "42P07" || error.message.includes("already exists")) {
            console.log(`⚠️ Table already exists, skipping...`);
          } else if (error.message.includes("already exists")) {
            console.log(`⚠️ Object already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log("✅ Database migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
};

runMigration();