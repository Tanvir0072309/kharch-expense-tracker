const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Connection pool configuration
  min: Number(process.env.DB_POOL_MIN) || 2,
  max: Number(process.env.DB_POOL_MAX) || 20,

  // Close idle connections after 30 seconds
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000,

  // Fail fast if PostgreSQL cannot be reached
  connectionTimeoutMillis:
    Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 5000,

  // Prevent queries from running indefinitely
  statement_timeout:
    Number(process.env.DB_STATEMENT_TIMEOUT_MS) || 10000,

  // TCP keepalive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

module.exports = pool;