const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Simple database connection
const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "kharch",
});

async function migrate() {
  try {
    console.log("Starting migration...");
    
    // Read SQL file
    const sql = fs.readFileSync(
      path.join(__dirname, "../migrations/001_create_tables.sql"),
      "utf-8"
    );
    
    // Execute SQL
    await pool.query(sql);
    console.log("✅ Migration completed!");
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    await pool.end();
    process.exit(1);
  }
}

migrate();