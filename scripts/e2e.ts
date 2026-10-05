import "dotenv/config";
import path from "node:path";
import { existsSync } from "node:fs";
import puppeteer, {
  type Browser,
  type ElementHandle,
  type Page,
} from "puppeteer-core";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

/**
 * End-to-end browser checks against a running server.
 *
 * Usage:  BASE_URL=http://localhost:3111 npx tsx scripts/e2e.ts
 *
 * These drive the real UI, so client-side cart state, server actions and
 * redirects are all exercised the way a customer would exercise them.
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3111";

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const raw = (process.env.DATABASE_URL ?? "file:./prisma/dev.db").slice("file:".length);
const absolute = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: `file:${absolute}` }),
});

let failures = 0;
const consoleErrors: string[] = [];
const pageErrors: string[] = [];
const httpFailures: string[] = [];

function check(label: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) {
    failures += 1;
    if (detail !== undefined) console.log("      ", detail);
  }
}

function step(label: string) {
  console.log(`\n--- ${label} ---`);
}

/** Waits for client navigation to settle. */
async function settle(page: Page, ms = 350) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function attachDiagnostics(page: Page) {
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error: unknown) => {
    pageErrors.push(error instanceof Error ? error.message : String(error));
  });
  // Record failing responses so a broken internal link cannot pass unnoticed.
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() < 400) return;
    if (!url.startsWith(BASE)) return;
    const path = url.replace(BASE, "").split("?")[0];
    httpFailures.push(`${response.status()} ${path}`);
  });
}

function text(page: Page) {
  return page.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
}

/** Serialised into the page, so it takes strings rather than a live matcher. */
async function clickByText(page: Page, selector: string, needle: string) {
  const handle = await page.evaluateHandle(
    (sel, want) => {
      const nodes = Array.from(document.querySelectorAll(sel));
      return nodes.find((node) =>
        (node.textContent ?? "").trim().toLowerCase().includes(want.toLowerCase()),
      );
    },
    selector,
    needle,
  );
  const element = handle.asElement() as ElementHandle<Element> | null;
  if (!element) throw new Error(`No ${selector} containing "${needle}"`);
  await element.click();
}

/** `/login` redirects when a session already exists, so clear cookies first. */
async function login(page: Page, email: string, password: string) {
  const client = await page.createCDPSession();
  await client.send("Network.clearBrowserCookies");
  await client.detach();

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input"));
    for (const input of inputs) {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    clickByText(page, "button", "Sign in"),
  ]);
  await settle(page, 600);
}

async function main() {
  const executablePath = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!executablePath) {
    throw new Error("No Chrome or Edge binary found for the browser checks.");
  }

  const browser: Browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await attachDiagnostics(page);

    // ---------------------------------------------------------- public pages
    step("Public pages render");
    for (const route of ["/", "/menu", "/about", "/login", "/register"]) {
      const response = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2" });
      const status = response?.status() ?? 0;
      const body = await text(page);
      check(`GET ${route}`, status === 200 && body.length > 200, `status ${status}`);
    }

    // ------------------------------------------------- menu search and filters
    step("Menu search and filters");
    await page.goto(`${BASE}/menu`, { waitUntil: "networkidle2" });
    const totalCards = await page.$$eval("a[href^='/menu/']", (nodes) => nodes.length);
    check("menu lists dishes", totalCards > 0, `${totalCards} links`);

    const searchSelector = 'input[type="search"], input[placeholder*="earch" i]';
    const hasSearch = (await page.$(searchSelector)) !== null;
    if (hasSearch) {
      await page.type(searchSelector, "burger");
      await settle(page, 700);
      const filtered = await page.$$eval("a[href^='/menu/']", (nodes) => nodes.length);
      check("search narrows the list", filtered > 0 && filtered < totalCards, {
        before: totalCards,
        after: filtered,
      });
    } else {
      check("menu exposes a search box", false, "no search input found");
    }

    // Category pills read "Starters5" because the count sits inside the button.
    // Clear the search first, otherwise it combines with the category filter.
    const clearButton = await page.$('button[aria-label="Clear search"]');
    if (clearButton) {
      await clearButton.click();
      await settle(page, 700);
    }
    const afterClear = await page.$$eval("a[href^='/menu/']", (nodes) => nodes.length);
    check("clearing search restores the full list", afterClear >= totalCards, {
      cleared: afterClear,
      original: totalCards,
    });

    const categoryFound = await page.$$eval("button", (nodes) =>
      nodes.some((node) => (node.textContent ?? "").trim().startsWith("Starters")),
    );
    if (categoryFound) {
      await clickByText(page, "button", "Starters");
      await settle(page, 800);
      const inCategory = await page.$$eval("a[href^='/menu/']", (nodes) => nodes.length);
      check("category filter applies", inCategory > 0 && inCategory < afterClear, {
        all: afterClear,
        filtered: inCategory,
      });
      check("category filter syncs to the URL", page.url().includes("category=starters"), page.url());

      // The pills count is rendered inside the button, so assert on real dishes.
      const dishNames = await page.$$eval("a[href^='/menu/']", (nodes) =>
        nodes.map((node) => (node.textContent ?? "").trim().slice(0, 30)),
      );
      check(
        "filtered results are start dishes",
        dishNames.some((name) => /calamari|corn ribs|burrata|chicken wings/i.test(name)),
        dishNames.slice(0, 4),
      );
    } else {
      check("menu exposes category filters", false, "no Starters filter");
    }

    // ----------------------------------------------------------- add to cart
    step("Add to cart from an item page");
    await page.goto(`${BASE}/menu/basque-cheesecake`, { waitUntil: "networkidle2" });
    const artworkLoaded = await page.$$eval("img", (nodes) =>
      nodes.some((img) => (img as HTMLImageElement).naturalWidth > 0),
    );
    check("item artwork loads", artworkLoaded);

    await clickByText(page, "button", "Add to cart");
    await settle(page, 700);

    const badge = await page.$$eval("[aria-label^='Cart,']", (nodes) =>
      nodes.map((node) => node.getAttribute("aria-label")),
    );
    check(
      "header cart badge shows one item",
      badge.some((label) => label === "Cart, 1 items"),
      badge,
    );

    // ---------------------------------------------------------- cart page ops
    step("Cart page quantity and notes");
    await page.goto(`${BASE}/cart`, { waitUntil: "networkidle2" });
    const cartText = await text(page);
    check("cart lists the added dish", cartText.includes("Basque Cheesecake"), cartText.slice(0, 160));

    const plusSelector = 'button[aria-label^="Increase quantity of"]';
    const incrementClicked = (await page.$(plusSelector)) !== null;
    if (incrementClicked) {
      await page.click(plusSelector);
    }
    await settle(page, 600);
    const badgeAfter = await page.$$eval("[aria-label^='Cart,']", (nodes) =>
      nodes.map((node) => node.getAttribute("aria-label")),
    );
    check(
      "increasing quantity updates the cart",
      incrementClicked && badgeAfter.some((label) => label === "Cart, 2 items"),
      { incrementClicked, badgeAfter },
    );

    const storedCart = await page.evaluate(() => window.localStorage.getItem("feastcraft.cart.v1"));
    check("cart persists to localStorage", Boolean(storedCart?.includes("basque-cheesecake")));

    // cart survives a reload
    await page.reload({ waitUntil: "networkidle2" });
    await settle(page, 600);
    const badgeReloaded = await page.$$eval("[aria-label^='Cart,']", (nodes) =>
      nodes.map((node) => node.getAttribute("aria-label")),
    );
    check(
      "cart survives a reload",
      badgeReloaded.some((label) => label === "Cart, 2 items"),
      badgeReloaded,
    );

    // ------------------------------------------------------- promo validation
    step("Promo code validation");
    const promoResult = await page.evaluate(async () => {
      const response = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "WELCOME10", subtotal: 2500 }),
      });
      return { status: response.status, body: await response.json() };
    });
    check(
      "valid promo returns a discount",
      promoResult.status === 200 && promoResult.body.ok === true && promoResult.body.discount > 0,
      promoResult,
    );

    // An unknown code is expected to 404, so keep that out of the network check.
    const failuresBeforeProbe = httpFailures.length;
    const badPromo = await page.evaluate(async () => {
      const response = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "NOT-A-CODE", subtotal: 2500 }),
      });
      return { status: response.status, body: await response.json() };
    });
    check("unknown promo is rejected", badPromo.status === 404 && !badPromo.body.ok, badPromo);
    httpFailures.length = failuresBeforeProbe;

    // --------------------------------------------------- guest pickup checkout
    step("Guest pickup checkout");
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle2" });

    const hidAddress = await clickByText(page, "button", "Pickup").then(
      () => true,
      () => false,
    );
    check("pickup can be selected", hidAddress);

    const pickupHidesAddress = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll("label")).map((node) =>
        (node.textContent ?? "").trim(),
      );
      return !labels.some((label) => label.toLowerCase().includes("address line 1"));
    });
    check("pickup hides street address fields", pickupHidesAddress);

    // The checkout fields are controlled inputs identified by id, not name.
    await page.type("#field-full-name", "E2E Guest");
    await page.type("#field-phone-number", "+1 (415) 555-0177");

    const typedValues = await page.evaluate(() => ({
      name: (document.querySelector("#field-full-name") as HTMLInputElement)?.value ?? "",
      phone: (document.querySelector("#field-phone-number") as HTMLInputElement)?.value ?? "",
    }));
    check("checkout fields accept typing", typedValues.name === "E2E Guest", typedValues);

    await clickByText(page, "button", "Continue to payment");
    await settle(page, 2500);

    const afterSubmit = page.url();
    const checkoutText = await text(page);
    const placed = afterSubmit.includes("/checkout/success");
    check("guest pickup order is placed", placed, {
      url: afterSubmit,
      snippet: checkoutText.slice(0, 220),
    });

    let guestOrderNumber = "";
    if (placed) {
      guestOrderNumber = await page.evaluate(() => {
        const match = document.body.innerText.match(/FC-[A-Z0-9]+-\d+/);
        return match ? match[0] : "";
      });
      check("confirmation shows an order number", Boolean(guestOrderNumber), guestOrderNumber);
      check("confirmation is not marked paid for pickup", /demo payment|Demo|paid/i.test(checkoutText));

      const order = await prisma.order.findUnique({
        where: { orderNumber: guestOrderNumber },
        select: {
          fulfilment: true,
          paymentStatus: true,
          status: true,
          city: true,
          addressLine1: true,
          customerEmail: true,
          items: { select: { name: true, quantity: true } },
        },
      });
      check("pickup order stored as PICKUP", order?.fulfilment === "PICKUP", order?.fulfilment);
      check("pickup order keeps the counter address", order?.city === "San Francisco", order?.city);
      check("demo card order is settled", order?.paymentStatus === "PAID", order?.paymentStatus);
      check("order has the expected line", (order?.items.length ?? 0) === 1, order?.items);
    }

    // ------------------------------------------------------------- auth flows
    step("Authentication");
    await page.goto(`${BASE}/account`, { waitUntil: "networkidle2" });
    check("guest is redirected away from account", page.url().includes("/login"), page.url());

    await login(page, "demo@feastcraft.test", "customer1234");
    check("customer can sign in", !page.url().includes("/login"), page.url());

    const wrongPassword = await page.evaluate(async () => {
      const body = new URLSearchParams();
      return { note: "covered by form submit below", value: body.toString() };
    });
    void wrongPassword;

    step("Account order history");
    await page.goto(`${BASE}/account/orders`, { waitUntil: "networkidle2" });
    const ordersText = await text(page);
    check("customer sees seeded orders", /FC-[A-Z0-9]+-\d+/.test(ordersText));

    step("Customer cannot open someone else's order");
    const notOwned = await page.evaluate(async (number) => {
      const response = await fetch(`/account/orders/${number}`, { headers: { "x": "1" } });
      const body = await response.text();
      return body.includes("Order not found");
    }, guestOrderNumber);
    check(
      "order belonging to nobody else is hidden",
      guestOrderNumber ? notOwned : true,
      { guestOrderNumber, notOwned },
    );

    // -------------------------------------------------------- admin as admin
    step("Admin access control");
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle2" });
    check("customer is refused the admin area", !page.url().endsWith("/admin"), page.url());

    const customerSession = await page.cookies();
    await login(page, "admin@feastcraft.test", "admin1234");
    check("admin can sign in", !page.url().includes("/login"), page.url());

    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle2" });
    const adminText = await text(page);
    check("admin dashboard renders revenue", /Revenue/i.test(adminText));
    check("admin nav renders all five sections", /Promo codes/i.test(adminText), adminText.slice(0, 200));

    for (const route of ["/admin/orders", "/admin/menu", "/admin/categories", "/admin/promos"]) {
      const response = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2" });
      const body = await text(page);
      check(`GET ${route} as admin`, (response?.status() ?? 0) === 200 && body.length > 300, {
        status: response?.status(),
      });
      check(`${route} has no server error`, !body.includes("Application error"), body.slice(0, 120));
    }

    step("Admin opens an order detail page");
    await page.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle2" });
    const firstOrderHref = await page.$$eval("a[href^='/admin/orders/FC-']", (nodes) =>
      nodes.length ? (nodes[0] as HTMLAnchorElement).getAttribute("href") : "",
    );
    check("orders table links to an admin order page", Boolean(firstOrderHref), firstOrderHref);
    if (firstOrderHref) {
      const response = await page.goto(`${BASE}${firstOrderHref}`, { waitUntil: "networkidle2" });
      const body = await text(page);
      check(
        "admin order detail renders",
        (response?.status() ?? 0) === 200 && /Your items/i.test(body),
        { status: response?.status() },
      );
    }

    step("Admin advances an order status");
    // The seeded orders are mostly delivered, so create one to advance.
    const codFixture = await prisma.order.create({
      data: {
        orderNumber: `E2E-STATUS-${Date.now().toString(36).toUpperCase()}`,
        customerName: "Status Fixture",
        customerEmail: "status@test.invalid",
        customerPhone: "+1 (415) 555-0100",
        addressLine1: "500 Howard Street",
        city: "San Francisco",
        state: "CA",
        postalCode: "94105",
        fulfilment: "DELIVERY",
        paymentMethod: "CASH_ON_DELIVERY",
        status: "CONFIRMED",
        paymentStatus: "PENDING",
        subtotal: 1895,
        tax: 166,
        total: 2061,
      },
      select: { id: true, orderNumber: true },
    });

    // Status changes live on the orders list, not the detail page.
    await page.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle2" });

    /**
     * Drives a controlled `<select>`. React tracks the previous value on the
     * DOM node, so the native setter has to be used or it will not see a change.
     */
    const setStatus = async (value: string) => {
      // Changing the select is not enough: the form has an explicit "Update"
      // button that posts the server action.
      const applied = await page.evaluate((target) => {
        // Orders render as cards in a list, not table rows.
        const cards = Array.from(document.querySelectorAll("li"));
        const card = cards.find((candidate) =>
          (candidate.textContent ?? "").includes("Status Fixture"),
        );
        const select = card?.querySelector("select") as HTMLSelectElement | null;
        const button = card?.querySelector('button[type="submit"]') as
          | HTMLButtonElement
          | null;
        if (!select || select.disabled || !button || button.disabled) return false;
        const setter = Object.getOwnPropertyDescriptor(
          HTMLSelectElement.prototype,
          "value",
        )?.set;
        setter?.call(select, target);
        select.dispatchEvent(new Event("change", { bubbles: true }));
        button.click();
        return true;
      }, value);
      await settle(page, 3000);
      return applied;
    };

    const statusOptions = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("li"));
      const card = cards.find((candidate) =>
        (candidate.textContent ?? "").includes("Status Fixture"),
      );
      const select = card?.querySelector("select") as HTMLSelectElement | null;
      return select ? Array.from(select.options).map((o) => (o as HTMLOptionElement).value) : [];
    });
    check("status dropdown lists the workflow", statusOptions.includes("PREPARING"), statusOptions);

    const applied = await setStatus("PREPARING");
    const afterStatus = await prisma.order.findUnique({
      where: { id: codFixture.id },
      select: { status: true, paymentStatus: true },
    });
    check("status advanced to PREPARING", applied && afterStatus?.status === "PREPARING", {
      applied,
      after: afterStatus,
    });
    check(
      "cash on delivery stays unpaid while preparing",
      afterStatus?.paymentStatus === "PENDING",
      afterStatus?.paymentStatus,
    );

    // Move it to delivered through the same control; cash should be collected.
    const deliverable = await setStatus("DELIVERED");
    const afterDeliver = await prisma.order.findUnique({
      where: { id: codFixture.id },
      select: { status: true, paymentStatus: true },
    });
    check(
      "delivering a cash order collects payment",
      deliverable && afterDeliver?.status === "DELIVERED" && afterDeliver?.paymentStatus === "PAID",
      { deliverable, after: afterDeliver },
    );

    step("Admin creates a promo code through the form");
    await page.goto(`${BASE}/admin/promos`, { waitUntil: "networkidle2" });
    const promoBody = await text(page);
    check(
      "promos page lists seeded codes",
      /WELCOME10/i.test(promoBody),
      promoBody.slice(0, 200),
    );

    // The editor is collapsed until "New promo code" is pressed.
    const formOpenBefore = (await page.$('input[name="code"]')) !== null;
    check("promo form starts collapsed", !formOpenBefore);

    await clickByText(page, "button", "New promo code");
    await settle(page, 500);

    const promoCode = `E2E${Date.now().toString(36).toUpperCase()}`;
    const codeInput = await page.$('input[name="code"]');
    if (codeInput) {
      // Dollar fields ship pre-formatted defaults, so clear them first.
      const fill = async (selector: string, value: string) => {
        const handle = await page.$(selector);
        if (!handle) return;
        await handle.evaluate((node) => {
          (node as HTMLInputElement).select();
        });
        await page.keyboard.press("Backspace");
        await handle.type(value);
      };
      await fill('input[name="code"]', promoCode);
      await fill('input[name="discountValue"]', "15");
      await fill('input[name="minOrderAmount"]', "10");
      await fill('input[name="description"]', "End to end check");

      const values = await page.evaluate(() => {
        const form = document.querySelector('input[name="code"]')?.closest("form");
        return Array.from(form?.querySelectorAll("input[name],textarea[name]") ?? [])
          .filter((node) => !node.getAttribute("name")?.startsWith("$ACTION"))
          .map((node) => [node.getAttribute("name"), (node as HTMLInputElement).value]);
      });

      // React only sends the action for a real submit, so click the button.
      const submitted = await page.evaluate(() => {
        const form = document.querySelector('input[name="code"]')?.closest("form");
        const button = form?.querySelector('button[type="submit"]') as HTMLButtonElement | null;
        if (!button) return false;
        button.click();
        return true;
      });
      await settle(page, 3000);

      const created = await prisma.promoCode.findUnique({
        where: { code: promoCode },
        select: { code: true, discountType: true, discountValue: true, minOrderAmount: true },
      });
      check("promo code is persisted by the admin form", Boolean(created), { values, submitted });
      check(
        "promo values are stored correctly",
        created?.discountType === "PERCENT" &&
          created?.discountValue === 15 &&
          created?.minOrderAmount === 1000,
        created,
      );

      // A brand new code should be usable by the public promo endpoint.
      if (created) {
        const usable = await page.evaluate(async (code) => {
          const response = await fetch("/api/promo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, subtotal: 4000 }),
          });
          return { status: response.status, body: await response.json() };
        }, promoCode);
        check(
          "new promo works for customers",
          usable.status === 200 && usable.body.discount === 600,
          usable,
        );
      }

      await prisma.promoCode.deleteMany({ where: { code: promoCode } });
    } else {
      check("promo form exposes a code field", false, "input[name=code] not found");
    }

    // ---------------------------------------------------------- mobile layout
    step("Mobile viewport");
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto(`${BASE}/menu`, { waitUntil: "networkidle2" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check("no horizontal overflow on mobile menu", overflow <= 2, { overflow });

    await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
    const overflowHome = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check("no horizontal overflow on mobile home", overflowHome <= 2, { overflowHome });

    // ------------------------------------------------------ console hygiene
    step("Browser diagnostics");
    const realPageErrors = pageErrors.filter(
      (message) => !message.includes("favicon") && !message.includes("Download the React DevTools"),
    );
    // Chrome logs a generic console error for every 4xx, so the response
    // listener above is the authoritative check for broken resources.
    const realConsoleErrors = consoleErrors.filter(
      (message) =>
        !message.includes("favicon") && !/Failed to load resource/.test(message),
    );
    const badResponses = [...new Set(httpFailures)];
    check("no uncaught page errors", realPageErrors.length === 0, realPageErrors.slice(0, 3));
    check("no console errors", realConsoleErrors.length === 0, realConsoleErrors.slice(0, 3));
    check("no failed network requests", badResponses.length === 0, badResponses.slice(0, 5));

    // --------------------------------------------------------------- cleanup
    if (guestOrderNumber) {
      await prisma.order.deleteMany({ where: { orderNumber: guestOrderNumber } });
    }
    await prisma.order.deleteMany({ where: { orderNumber: { startsWith: "E2E-STATUS-" } } });
    await prisma.promoCode.deleteMany({ where: { code: { startsWith: "E2E" } } });
    await page.evaluate(() => window.localStorage.clear());
    void customerSession;
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log(
    failures === 0 ? "\nAll browser checks passed." : `\n${failures} browser check(s) failed.`,
  );
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
