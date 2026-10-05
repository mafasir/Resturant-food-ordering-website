import "server-only";
import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

/**
 * Resolves `file:./prisma/dev.db` style URLs to an absolute path.
 *
 * The Prisma CLI resolves these from the project root, so we do the same here.
 * Without this the app can silently open a second, empty database file.
 */
function resolveDatabaseUrl(url: string): string {
  if (!url.startsWith("file:")) return url;
  const raw = url.slice("file:".length);
  if (raw.startsWith(":memory:")) return url;
  // `turbopackIgnore` keeps the build from tracing the whole project just
  // because this path is computed at runtime.
  const absolute = path.isAbsolute(raw)
    ? raw
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), raw);
  return `file:${absolute}`;
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: resolveDatabaseUrl(process.env.DATABASE_URL ?? "file:./prisma/dev.db"),
  });
  return new PrismaClient({ adapter });
}

// Reuse the client across hot reloads in development so we don't exhaust
// SQLite write locks by opening a new pool on every edit.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
