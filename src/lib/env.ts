/**
 * BlockExchange — embedded environment defaults.
 *
 * This module hardcodes the production database credentials so the app
 * works on hosting platforms (Vercel, Railway, etc.) WITHOUT requiring
 * the operator to set env vars in the dashboard.
 *
 * If the hosting platform DOES set these env vars, those take precedence
 * (we only set them when they're missing).
 *
 * Import this module at the top of any file that instantiates PrismaClient
 * or MongoClient — it must run BEFORE those clients are constructed.
 */

const DEFAULTS: Record<string, string> = {
  // Neon Postgres — POOLED connection (app runtime)
  DATABASE_URL:
    "postgresql://neondb_owner:npg_e5To1bGSkcwR@ep-lucky-dew-atuc6qxu-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  // Neon Postgres — DIRECT connection (migrations / db push)
  DIRECT_URL:
    "postgresql://neondb_owner:npg_e5To1bGSkcwR@ep-lucky-dew-atuc6qxu.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  // MongoDB Atlas (price history caching)
  MONGODB_URI:
    "mongodb+srv://playbeatdigitalxx:playbeat1122@ghar.ahbfod0.mongodb.net/?appName=ghar",
};

// Only set env vars that are not already defined by the hosting platform.
// This way, dashboard-configured values always win.
for (const [key, value] of Object.entries(DEFAULTS)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
