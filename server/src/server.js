require("dotenv").config();

const app = require("./app");
const pool = require("./config/database");
const redisClient = require("./config/redis");
const { verifyEmailTransport } = require("./services/email.service");

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connection successful");

    await redisClient.connect();
    console.log("Redis connection successful");

    await verifyEmailTransport();
    console.log("Email service connection successful");

    server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Kharch API running on port ${PORT}`);
});
  } catch (error) {
    console.error("Failed to start server:", error);

    await shutdown();
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal || "Shutdown"} received`);

  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
    });
  }

  try {
    await pool.end();
    console.log("PostgreSQL pool closed");
  } catch (error) {
    console.error("Failed to close PostgreSQL pool:", error);
  }

  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log("Redis connection closed");
    }
  } catch (error) {
    console.error("Failed to close Redis connection:", error);
  }
};

process.on("SIGTERM", async () => {
  await shutdown("SIGTERM");
  process.exit(0);
});

process.on("SIGINT", async () => {
  await shutdown("SIGINT");
  process.exit(0);
});

startServer();