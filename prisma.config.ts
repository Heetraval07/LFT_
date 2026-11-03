// Prisma 7 configuration. DATABASE_URL comes from the environment (.env locally, hPanel in production).
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
