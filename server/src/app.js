const express = require("express");
const redisClient = require("./config/redis");

const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    const redisStatus = await redisClient.ping();

    res.status(200).json({
      success: true,
      message: "Kharch API is running",
      redis: redisStatus,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Redis unavailable",
    });
  }
});

module.exports = app;