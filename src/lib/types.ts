export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const USER_ROLES = ["CUSTOMER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  tagline: string | null;
  sortOrder: number;
  _count: { items: number };
};

/** Menu item shape safe to pass from a Server Component to a Client Component. */
export type MenuItemView = {
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
  tags: string[];
  category: { name: string; slug: string; icon: string };
};

export type CartLine = {
  itemId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  categoryName: string;
  quantity: number;
  notes: string;
  isAvailable: boolean;
};

export type OrderView = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
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
    image: string | null;
  }[];
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Awaiting payment",
  CONFIRMED: "Order confirmed",
  PREPARING: "In the kitchen",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** Ordered progression used for the customer-facing tracking timeline. */
export const ORDER_TRACKING_STEPS: OrderStatus[] = [
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];
