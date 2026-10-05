import "dotenv/config";
import { SignJWT } from "jose";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const raw = url.slice("file:".length);
  const absolute = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);

  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: `file:${absolute}` }),
  });

  const email = process.argv[2] ?? "admin@feastcraft.test";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No user ${email}`);

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  console.log(token);
  await prisma.$disconnect();
}

main();