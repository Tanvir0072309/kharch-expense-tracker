const { Pool } = require('pg');

// Primary database connection
const pool = new Pool({
  host: process.env.SHARD_0_HOST || 'shard-1-primary',
  port: parseInt(process.env.SHARD_0_PORT || '5432'),
  database: process.env.SHARD_0_DB || 'kharch',
  user: process.env.SHARD_0_USER || 'postgres',
  password: process.env.SHARD_0_PASSWORD,
});

module.exports = pool;
