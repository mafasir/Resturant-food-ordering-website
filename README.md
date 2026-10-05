# FeastCraft

A full-stack restaurant ordering website: browse the menu, build a cart, check out
with Stripe test payments, track orders, and manage the menu, categories, promos and
orders from an admin dashboard.

Dark, responsive interface built with Next.js App Router, Tailwind CSS and Framer Motion,
backed by SQLite through Prisma.

## Features

**Guest and customer**
- Menu browsing with live search, category and tag filters, sorting, and incremental loading
- Item detail pages with quantity, special instructions and live availability
- Persistent cart with delivery/pickup toggle, kitchen notes, promo codes and free-delivery progress
- Checkout with Stripe Payment Element, cash on delivery, guest or signed-in ordering
- Saved addresses, order history, and live order status timelines

**Admin**
- Dashboard with revenue, order counts, average order value and a seven-day chart
- Order management with status transitions and per-order detail pages
- Menu, category and promo code CRUD
- Revenue and status figures computed from the database, not from client input

**Engineering**
- Server actions re-price every cart from the database, so totals sent by the browser are never trusted
- Promo codes are re-evaluated server side and their usage counted in the same transaction as the order
- Card payments are settled by verifying the Stripe PaymentIntent, and the intent ID is bound to the order
- Sessions are signed JWTs in httpOnly cookies; passwords are bcrypt hashed
- Guest orders are attached to an account automatically when the same email registers or signs in

## Requirements

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
cp .env.example .env
```

Set a real session secret in `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Then create the database and load the demo data:

```bash
npm run setup
```

`npm run setup` generates the Prisma client, applies migrations, and seeds the database.
Start the dev server:

```bash
npm run dev
```

The site runs at http://localhost:3000.

## Demo accounts

| Role    | Email                  | Password      |
| ------- | ---------------------- | ------------- |
| Admin   | `admin@feastcraft.test` | `admin1234`   |
| Customer| `demo@feastcraft.test`  | `customer1234`|

The seed also creates 8 categories, 34 dishes, 4 promo codes, and 3 sample orders.

## Payments

The app has two payment modes:

- **Demo mode** (default): leave `STRIPE_SECRET_KEY` empty. Card checkout confirms the
  order without contacting Stripe, and the checkout page says so clearly.
- **Stripe test mode**: set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  to your test keys. The Payment Element appears and payments are settled by verifying
  the PaymentIntent.

To receive webhook events locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

Cash on delivery orders stay unpaid until staff mark them delivered.

## Scripts

| Command              | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| `npm run dev`        | Start the dev server                           |
| `npm run build`      | Production build                               |
| `npm run start`      | Serve the production build                     |
| `npm run typecheck`  | TypeScript type checking                       |
| `npm run lint`       | ESLint                                         |
| `npm run check`      | Typecheck and lint                             |
| `npm run db:migrate` | Create and apply a migration during development |
| `npm run db:seed`    | Reseed demo data                               |
| `npm run db:reset`   | Drop, re-migrate and reseed                    |
| `npm run db:studio`  | Browse the database in Prisma Studio           |
| `npm run setup`      | Generate client, migrate and seed              |
| `npm run smoke`      | Run the checkout and pricing smoke checks      |
| `npm run e2e`        | Browser end-to-end checks (needs a running server) |

## Verifying a change

`npm run check` and `npm run smoke` run without a server. The browser suite
drives real Chrome against a production build, so start one first:

```bash
npm run build
npm run start -- -p 3111          # in another terminal
npm run e2e                        # BASE_URL defaults to http://localhost:3111
```

The suite signs in as a customer and as an admin, orders from the menu, exercises
guest checkout, checks access control, walks an order through the admin status
workflow, and creates a promo code through the form. It cleans up its own orders
and promo codes afterwards.

## Project structure

```
prisma/
  schema.prisma        Database schema
  seed.ts              Demo data
  menu-data.ts         Categories and dishes
src/
  app/                 Routes, server actions and API handlers
  components/          UI, split by feature area
  generated/prisma/    Generated Prisma client
  lib/                 Auth, queries, money, validation, Stripe
scripts/               Local development helpers
```

`scripts/make-session.ts` prints a signed session token for a demo account, which is
handy for testing authenticated pages with curl:

```bash
npx tsx scripts/make-session.ts admin@feastcraft.test
curl -H "Cookie: feastcraft_session=<token>" http://localhost:3000/admin
```

## Notes

- Menu artwork is generated as inline SVG by `src/lib/menu-artwork.ts`, so the site
  has no external image dependencies.
- `DATABASE_URL` paths are resolved to an absolute path at runtime so the CLI and the
  app always open the same SQLite file.
- `.agents/`, `.claude/` and `.windsurf/` were generated by `prisma init` and are safe
  to delete.
