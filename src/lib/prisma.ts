import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set.");
}

const url = new URL(databaseUrl);
const sslMode = url.searchParams.get("sslmode");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslMode && sslMode !== "disable" ? { rejectUnauthorized: false } : undefined,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
