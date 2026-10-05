import "dotenv/config";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { renderMenuArtwork } from "../src/lib/menu-artwork";
import { menu, promoCodes } from "./menu-data";

/**
 * Resolves `file:./prisma/dev.db` style URLs to an absolute path. The Prisma CLI
 * resolves them from the project root, so we do the same here to guarantee the
 * app and the CLI talk to the same database file.
 */
function resolveDatabaseUrl(url: string): string {
  if (!url.startsWith("file:")) return url;
  const raw = url.slice("file:".length);
  if (raw === ":memory:" || raw.startsWith(":memory:")) return url;
  const absolute = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  return `file:${absolute}`;
}

const adapter = new PrismaBetterSqlite3({
  url: resolveDatabaseUrl(process.env.DATABASE_URL ?? "file:./prisma/dev.db"),
});

const prisma = new PrismaClient({ adapter });

const ARTWORK_DIR = path.join(process.cwd(), "public", "images", "menu");

/**
 * Menu items ship with real photography in `public/images/menu`. The generated
 * SVG poster is only a fallback for dishes that have no photo on disk (a new item
 * added from the admin panel before artwork is generated, for example).
 */
function imageFor(slug: string) {
  return existsSync(path.join(ARTWORK_DIR, `${slug}.jpg`))
    ? `/images/menu/${slug}.jpg`
    : `/images/menu/${slug}.svg`;
}

async function writeArtwork() {
  await mkdir(ARTWORK_DIR, { recursive: true });
  let count = 0;
  for (const category of menu) {
    for (const item of category.items) {
      if (existsSync(path.join(ARTWORK_DIR, `${item.slug}.jpg`))) continue;
      const svg = renderMenuArtwork(item.slug, category.name);
      await writeFile(path.join(ARTWORK_DIR, `${item.slug}.svg`), svg, "utf8");
      count += 1;
    }
  }
  console.log(
    count > 0
      ? `  generated ${count} fallback artworks in public/images/menu`
      : "  every dish already has a photo, no artwork needed",
  );
}

async function main() {
  console.log("Seeding FeastCraft database...\n");

  await writeArtwork();

  console.log("  clearing existing data");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.user.deleteMany();

  console.log("  creating categories and menu items");
  let itemCount = 0;
  for (const [index, category] of menu.entries()) {
    await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        tagline: category.tagline,
        sortOrder: index,
      },
    });

    for (const item of category.items) {
      await prisma.menuItem.create({
        data: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          price: item.price,
          image: imageFor(item.slug),
          category: { connect: { slug: category.slug } },
          isAvailable: true,
          isFeatured: item.isFeatured ?? false,
          isSpicy: item.isSpicy ?? false,
          isVeg: item.isVeg ?? true,
          calories: item.calories ?? null,
          prepMinutes: item.prepMinutes ?? 20,
          rating: item.rating ?? 4.5,
          tags: (item.tags ?? []).join(","),
        },
      });
      itemCount += 1;
    }
  }
  console.log(`  ${menu.length} categories, ${itemCount} menu items`);

  console.log("  creating promo codes");
  for (const promo of promoCodes) {
    await prisma.promoCode.create({ data: promo });
  }
  console.log(`  ${promoCodes.length} promo codes`);

  console.log("  creating users");
  const adminPassword = await bcrypt.hash("admin1234", 12);
  const customerPassword = await bcrypt.hash("customer1234", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@feastcraft.test",
      passwordHash: adminPassword,
      name: "Ava Chen",
      phone: "+1 415 555 0110",
      role: "ADMIN",
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "demo@feastcraft.test",
      passwordHash: customerPassword,
      name: "Noah Bennett",
      phone: "+1 415 555 0142",
      role: "CUSTOMER",
    },
  });

  await prisma.address.create({
    data: {
      userId: customer.id,
      label: "Home",
      fullName: "Noah Bennett",
      phone: "+1 415 555 0142",
      line1: "218 Folsom Street",
      line2: "Apt 14B",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      isDefault: true,
    },
  });

  console.log("  creating sample orders");
  const truffleFries = await prisma.menuItem.findUniqueOrThrow({
    where: { slug: "truffle-parmesan-fries" },
  });
  const smashBurger = await prisma.menuItem.findUniqueOrThrow({
    where: { slug: "feastcraft-smash-burger" },
  });
  const misoSalmon = await prisma.menuItem.findUniqueOrThrow({
    where: { slug: "miso-glazed-salmon" },
  });
  const basqueCheesecake = await prisma.menuItem.findUniqueOrThrow({
    where: { slug: "basque-cheesecake" },
  });

  const sampleOrders = [
    {
      status: "DELIVERED",
      paymentStatus: "PAID",
      daysAgo: 12,
      lines: [
        { item: smashBurger, quantity: 2, notes: "Extra pickles" },
        { item: truffleFries, quantity: 1, notes: null },
      ],
    },
    {
      status: "DELIVERED",
      paymentStatus: "PAID",
      daysAgo: 5,
      lines: [
        { item: misoSalmon, quantity: 1, notes: "No coriander please" },
        { item: basqueCheesecake, quantity: 1, notes: null },
      ],
    },
    {
      status: "OUT_FOR_DELIVERY",
      paymentStatus: "PAID",
      daysAgo: 0,
      lines: [
        { item: smashBurger, quantity: 1, notes: null },
        { item: truffleFries, quantity: 2, notes: "One without parmesan" },
        { item: basqueCheesecake, quantity: 1, notes: null },
      ],
    },
  ];

  const TAX_RATE = 0.0875;
  const DELIVERY_FEE = 399;

  for (const sample of sampleOrders) {
    const subtotal = sample.lines.reduce(
      (sum, line) => sum + line.item.price * line.quantity,
      0,
    );
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + tax + DELIVERY_FEE;
    const placedAt = new Date(Date.now() - sample.daysAgo * 86_400_000);

    await prisma.order.create({
      data: {
        orderNumber: `FC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
        userId: customer.id,
        status: sample.status,
        paymentStatus: sample.paymentStatus,
        subtotal,
        deliveryFee: DELIVERY_FEE,
        tax,
        total,
        customerName: "Noah Bennett",
        customerPhone: "+1 415 555 0142",
        addressLine1: "218 Folsom Street",
        addressLine2: "Apt 14B",
        city: "San Francisco",
        state: "CA",
        postalCode: "94105",
        placedAt,
        items: {
          create: sample.lines.map((line) => ({
            menuItemId: line.item.id,
            name: line.item.name,
            price: line.item.price,
            quantity: line.quantity,
            notes: line.notes,
          })),
        },
      },
    });
  }
  console.log(`  ${sampleOrders.length} sample orders`);

  console.log("\nSeed complete.\n");
  console.log("  Admin    admin@feastcraft.test   / admin1234");
  console.log("  Customer demo@feastcraft.test   / customer1234\n");
  console.log(`  Admin id: ${admin.id}\n`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
