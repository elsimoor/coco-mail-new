import { MongoClient, Db } from "mongodb";
import dotenv from 'dotenv';

// Load environment variables as early as possible. Without calling dotenv.config()
// here, modules that rely on variables like MONGO_URI may see them as undefined
// because index.ts calls dotenv.config() after importing this module. By
// invoking dotenv.config() at the top of this file, we ensure that
// process.env is populated before accessing it below.
dotenv.config();

// Explicitly type the MongoDB URI as `any` to avoid TypeScript warnings. This
// ensures that even if the environment variable is undefined or missing,
// TypeScript will not complain about type incompatibility when passing
// MONGODB_URI to the MongoClient constructor. In a real application you
// should perform runtime checks and validation.
const MONGODB_URI: any = process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error("MONGO_URI is not defined in the environment variables.");
}

let db: Db;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  db = client.db();
  console.log("Connected to MongoDB");
  return db;
}