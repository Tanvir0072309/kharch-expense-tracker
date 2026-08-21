require("dotenv").config();

const app = require("./app");
const pool = require("./config/database");
const redisClient = require("./config/redis");
const { verifyEmailTransport } = require("./services/email.service");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connection successful");

    await redisClient.connect();
    console.log("Redis connection successful");

    await verifyEmailTransport();
    console.log("Email service connection successful");

    app.listen(PORT, () => {
      console.log(`Kharch API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();