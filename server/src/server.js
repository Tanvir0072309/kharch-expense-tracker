require("dotenv").config();

const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.query("SELECT 1");

    console.log("PostgreSQL connection successful");

    app.listen(PORT, () => {
      console.log(`Kharch API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();