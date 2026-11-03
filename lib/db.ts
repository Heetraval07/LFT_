// Single shared Prisma client (MariaDB driver adapter). Reused across hot reloads in development.
import { PrismaClient } from '../generated/prisma/client.ts';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const adapter = new PrismaMariaDb(url);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { __lftPrisma?: ReturnType<typeof createClient> };

export const db = globalForPrisma.__lftPrisma ?? createClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.__lftPrisma = db;
