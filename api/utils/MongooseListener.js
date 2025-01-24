const mongoose = require("mongoose");
require("dotenv").config();

const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🌱 MongoDB is connected to the atlas!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    setTimeout(connectWithRetry, 5000); // Retry connection after 5 seconds
  }
};

module.exports = async () => {
  console.log("Started connecting to MongoDB...");
  mongoose.connection
    .on("error", (error) => {
      console.error("MongoDB connection error:", error);
    })
    .on("disconnected", () => {
      console.warn("Disconnected from MongoDB! Attempting to reconnect...");
      connectWithRetry();
    });

  await connectWithRetry();
};

// Global error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  if (reason.name === "MongoNetworkError") {
    connectWithRetry();
  }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception thrown:", error);
  if (error.name === "MongoNetworkError") {
    connectWithRetry();
  }
});