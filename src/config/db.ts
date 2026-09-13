import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { seedDemoData } from "./seed";

let mongodInstance: MongoMemoryServer | null = null;

// Allow queries to buffer briefly during connection setup
mongoose.set("bufferTimeoutMS", 30000);

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const uri = process.env.MONGO_URI;

    if (uri) {
      try {
        console.log("Connecting to MongoDB URI...");
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 4000,
          connectTimeoutMS: 4000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        await seedDemoData();
        return;
      } catch (cloudErr) {
        console.warn(`⚠️ Failed to connect to external MongoDB (${(cloudErr as Error).message}). Falling back to in-memory MongoDB...`);
        try {
          await mongoose.disconnect();
        } catch {
          // ignore disconnect error
        }
      }
    }

    // Fallback: Start in-memory MongoDB server
    console.log("🚀 Starting in-memory MongoDB server for preview/local environment...");
    if (!mongodInstance) {
      mongodInstance = await MongoMemoryServer.create();
    }
    const inMemoryUri = mongodInstance.getUri();
    const conn = await mongoose.connect(inMemoryUri);
    console.log(`✅ In-Memory MongoDB Connected: ${conn.connection.host}`);

    // Seed sample data for immediate preview usability
    await seedDemoData();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${(error as Error).message}`);
  }
};

