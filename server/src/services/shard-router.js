const shards = require("../config/shards");

const SHARD_COUNT = Object.keys(shards).length;

const getShardId = (userId) => {
  if (!userId) {
    throw new Error("userId is required for shard routing");
  }

  const numericUserId = BigInt(userId);

  return Number(numericUserId % BigInt(SHARD_COUNT));
};

const getShard = (userId) => {
  const shardId = getShardId(userId);

  const pool = shards[shardId];

  if (!pool) {
    throw new Error(`Shard ${shardId} is not configured`);
  }

  return {
    shardId,
    pool,
  };
};

module.exports = {
  getShardId,
  getShard,
};
