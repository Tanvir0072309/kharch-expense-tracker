const { Pool } = require("pg");

const createPool = (host, port) => {
  return new Pool({
    host,
    port: Number(port),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    min: Number(process.env.DB_POOL_MIN) || 2,
    max: Number(process.env.DB_POOL_MAX) || 20,

    idleTimeoutMillis:
      Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000,

    connectionTimeoutMillis:
      Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 5000,

    statement_timeout:
      Number(process.env.DB_STATEMENT_TIMEOUT_MS) || 10000,

    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });
};

const shards = {
  0: createPool(process.env.SHARD_0_HOST, process.env.SHARD_0_PORT),
  1: createPool(process.env.SHARD_1_HOST, process.env.SHARD_1_PORT),
  2: createPool(process.env.SHARD_2_HOST, process.env.SHARD_2_PORT),
};

module.exports = shards;