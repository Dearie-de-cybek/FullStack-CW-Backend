const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config({ path: "config.env" });

process.on("uncaughtException", err => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require("./app.js");
const { listen } = app; 

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

const client = new MongoClient(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("DB connection successful! 💥");

    const port = process.env.PORT || 3000;
    const server = listen(port, () => {
      console.log(`App running on port ${port}...`);
    });

    process.on("unhandledRejection", err => {
      console.log("UNHANDLED REJECTION! 💥 Shutting down...");
      console.log(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on("SIGTERM", () => {
      console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
      server.close(() => {
        console.log("💥 Process terminated!");
      });
    });
  } catch (err) {
    console.log("Error connecting to the database: 💥", err.message);
    process.exit(1);
  }
}

connectToDatabase();
