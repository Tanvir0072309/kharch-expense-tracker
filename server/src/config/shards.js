const { Pool } = require('pg');

const shards = [
  new Pool({
    host: process.env.SHARD_0_HOST || 'shard-1-primary',
    port: parseInt(process.env.SHARD_0_PORT || '5432'),
    database: process.env.SHARD_0_DB || 'kharch',
    user: process.env.SHARD_0_USER || 'postgres',
    password: process.env.SHARD_0_PASSWORD,
  }),
  new Pool({
    host: process.env.SHARD_1_HOST || 'shard-2-primary',
    port: parseInt(process.env.SHARD_1_PORT || '5432'),
    database: process.env.SHARD_1_DB || 'kharch',
    user: process.env.SHARD_1_USER || 'postgres',
    password: process.env.SHARD_1_PASSWORD,
  }),
  new Pool({
    host: process.env.SHARD_2_HOST || 'shard-3-primary',
    port: parseInt(process.env.SHARD_2_PORT || '5432'),
    database: process.env.SHARD_2_DB || 'kharch',
    user: process.env.SHARD_2_USER || 'postgres',
    password: process.env.SHARD_2_PASSWORD,
  }),
];

module.exports = shards;
