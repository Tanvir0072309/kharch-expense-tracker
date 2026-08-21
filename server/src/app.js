const express = require("express");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Kharch API is running",
  });
});

module.exports = app;