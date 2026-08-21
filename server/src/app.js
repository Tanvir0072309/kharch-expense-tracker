const express = require("express");
const errorHandler = require("./middleware/errorHandler");

const pool = require("./config/database");
const redisClient = require("./config/redis");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
  // ... existing health check code
});

app.use("/api/v1/auth", authRoutes);

// Error handling middleware - should be after all routes
app.use(errorHandler);

module.exports = app;