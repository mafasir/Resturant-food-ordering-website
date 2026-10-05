import "server-only";
import { prisma } from "@/lib/db";
import type { CategoryWithCount, MenuItemView, OrderView } from "@/lib/types";

type MenuItemWithCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isSpicy: boolean;
  isVeg: boolean;
  calories: number | null;
  prepMinutes: number;
  rating: number;
  tags: string;
  category: { name: string; slug: string; icon: string };
};

/** Maps a raw Prisma row into a plain object safe to send to the client. */
export function toMenuItemView(row: MenuItemWithCategory): MenuItemView {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    image: row.image,
    categoryId: row.categoryId,
    isAvailable: row.isAvailable,
    isFeatured: row.isFeatured,
    isSpicy: row.isSpicy,
    isVeg: row.isVeg,
    calories: row.calories,
    prepMinutes: row.prepMinutes,
    rating: row.rating,
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    category: row.category,
  };
}

const menuItemInclude = {
  category: { select: { name: true, slug: true, icon: true } },
} as const;

export async function getCategories(): Promise<CategoryWithCount[]> {
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { items: true } } },
  });
}

export async function getMenuItems(options?: {
  categorySlug?: string;
  search?: string;
  featuredOnly?: boolean;
  availableOnly?: boolean;
  limit?: number;
}): Promise<MenuItemView[]> {
  const rows = await prisma.menuItem.findMany({
    where: {
      ...(options?.categorySlug
        ? { category: { slug: options.categorySlug } }
        : {}),
      ...(options?.featuredOnly ? { isFeatured: true } : {}),
      ...(options?.availableOnly ? { isAvailable: true } : {}),
      ...(options?.search
        ? {
            OR: [
              { name: { contains: options.search } },
              { description: { contains: options.search } },
              { tags: { contains: options.search } },
            ],
          }
        : {}),
    },
    include: menuItemInclude,
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    ...(options?.limit ? { take: options.limit } : {}),
  });
  return rows.map(toMenuItemView);
}

export async function getMenuItemBySlug(
  slug: string,
): Promise<MenuItemView | null> {
  const row = await prisma.menuItem.findUnique({
    where: { slug },
    include: menuItemInclude,
  });
  return row ? toMenuItemView(row) : null;
}

export async function getRelatedItems(
  categoryId: string,
  excludeId: string,
  take = 3,
): Promise<MenuItemView[]> {
  const rows = await prisma.menuItem.findMany({
    where: { categoryId, id: { not: excludeId }, isAvailable: true },
    include: menuItemInclude,
    orderBy: { rating: "desc" },
    take,
  });
  return rows.map(toMenuItemView);
}

export async function getPromoByCode(code: string) {
  return prisma.promoCode.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
}

const orderInclude = {
  items: {
    include: { menuItem: { select: { image: true } } },
    orderBy: { id: "asc" },
  },
} as const;

type OrderWithItems = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  fulfilment: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  promoCode: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  notes: string | null;
  placedAt: Date;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    notes: string | null;
    menuItem: { image: string | null } | null;
  }[];
};

export function toOrderView(row: OrderWithItems): OrderView {
  return {
    ...row,
    status: row.status as OrderView["status"],
    paymentStatus: row.paymentStatus as OrderView["paymentStatus"],
    items: row.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes,
      image: item.menuItem?.image ?? null,
    })),
  };
}

export async function getUserOrders(userId: string): Promise<OrderView[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { placedAt: "desc" },
  });
  return rows.map(toOrderView);
}

export async function getOrderByNumber(
  orderNumber: string,
  userId?: string,
): Promise<OrderView | null> {
  const row = await prisma.order.findFirst({
    where: {
      orderNumber,
      ...(userId ? { userId } : {}),
    },
    include: orderInclude,
  });
  return row ? toOrderView(row) : null;
}

export async function getAllOrders(status?: string): Promise<OrderView[]> {
  const rows = await prisma.order.findMany({
    where: status && status !== "ALL" ? { status } : undefined,
    include: orderInclude,
    orderBy: { placedAt: "desc" },
    take: 100,
  });
  return rows.map(toOrderView);
}

export async function getAllPromos() {
  return prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export type AdminStats = {
  revenue: number;
  orderCount: number;
  pendingCount: number;
  deliveredCount: number;
  averageOrderValue: number;
  menuItemCount: number;
  unavailableCount: number;
  customerCount: number;
  recentOrders: OrderView[];
  topItems: { name: string; quantity: number; revenue: number }[];
  revenueByDay: { day: string; revenue: number; orders: number }[];
};

export async function getAdminStats(): Promise<AdminStats> {
  const [
    paidAgg,
    orderCount,
    pendingCount,
    deliveredCount,
    menuItemCount,
    unavailableCount,
    customerCount,
    recent,
    lineItems,
    weekOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "PAID", status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.menuItem.count(),
    prisma.menuItem.count({ where: { isAvailable: false } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.findMany({
      include: orderInclude,
      orderBy: { placedAt: "desc" },
      take: 6,
    }),
    prisma.orderItem.findMany({
      where: { order: { paymentStatus: "PAID", status: { not: "CANCELLED" } } },
      select: { name: true, quantity: true, price: true },
    }),
    // Every order from the last seven days, not just the six most recent.
    prisma.order.findMany({
      where: { placedAt: { gte: startOfDay(new Date(Date.now() - 6 * 86_400_000)) } },
      select: { total: true, paymentStatus: true, status: true, placedAt: true },
    }),
  ]);

  const revenue = paidAgg._sum.total ?? 0;
  const paidOrders = paidAgg._count;

  const totals = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const line of lineItems) {
    const existing = totals.get(line.name);
    if (existing) {
      existing.quantity += line.quantity;
      existing.revenue += line.quantity * line.price;
    } else {
      totals.set(line.name, {
        name: line.name,
        quantity: line.quantity,
        revenue: line.quantity * line.price,
      });
    }
  }
  const topItems = [...totals.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  // Seven day revenue sparkline, oldest first.
  const days: { day: string; revenue: number; orders: number }[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const day = startOfDay(new Date(Date.now() - offset * 86_400_000));
    const next = new Date(day);
    next.setDate(next.getDate() + 1);

    const dayOrders = weekOrders.filter(
      (order) => order.placedAt >= day && order.placedAt < next,
    );
    days.push({
      day: day.toLocaleDateString("en-US", { weekday: "short" }),
      revenue: dayOrders
        .filter(
          (order) => order.paymentStatus === "PAID" && order.status !== "CANCELLED",
        )
        .reduce((sum, order) => sum + order.total, 0),
      orders: dayOrders.length,
    });
  }

  return {
    revenue,
    orderCount,
    pendingCount,
    deliveredCount,
    averageOrderValue: paidOrders > 0 ? Math.round(revenue / paidOrders) : 0,
    menuItemCount,
    unavailableCount,
    customerCount,
    recentOrders: recent.map(toOrderView),
    topItems,
    revenueByDay: days,
  };
}
