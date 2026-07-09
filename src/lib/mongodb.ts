import { MongoClient, Db } from "mongodb";

/**
 * MongoDB connection for price-history caching.
 *
 * MONGODB_URI is REQUIRED — there is no longer a hardcoded fallback.
 * The previous version shipped with a credential baked into source,
 * which is unsafe. Set MONGODB_URI in your .env:
 *
 *   MONGODB_URI="mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/?appName=APP"
 */
const uri = process.env.MONGODB_URI;
const dbName = "brockexchange";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoDb(): Promise<Db> {
  if (db) return db;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env — see README. " +
      "Price-history endpoints (/api/market/history, /api/market/live) will not work without it."
    );
  }
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  db = client.db(dbName);
  return db;
}
