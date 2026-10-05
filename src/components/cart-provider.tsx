"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { CartLine } from "@/lib/types";
import {
  calculateTotals,
  type Fulfilment,
  type Totals,
} from "@/lib/money";

const STORAGE_KEY = "feastcraft.cart.v1";
const EMPTY_FULFILMENT: Fulfilment = "DELIVERY";

type CartContextValue = {
  lines: CartLine[];
  /** False until localStorage has been read, so the UI can avoid a flash of an empty cart. */
  ready: boolean;
  fulfilment: Fulfilment;
  promo: PromoState;
  subtotal: number;
  totals: Totals;
  itemCount: number;
  addItem: (
    item: MenuItemLike,
    quantity?: number,
    notes?: string,
  ) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  setNotes: (itemId: string, notes: string) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  setFulfilment: (value: Fulfilment) => void;
  applyPromo: (code: string) => Promise<void>;
  clearPromo: () => void;
  promoChecking: boolean;
};

type PromoState = {
  code: string;
  description: string | null;
  discount: number;
} | null;

type MenuItemLike = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  isAvailable: boolean;
  category: { name: string };
};

/* ------------------------------------------------------------------ *
 * Cart storage — localStorage read through useSyncExternalStore so the
 * server and client snapshots are handled correctly during hydration.
 * ------------------------------------------------------------------ */

type StoredCart = { lines: CartLine[]; fulfilment: Fulfilment };

const EMPTY_CART: StoredCart = { lines: [], fulfilment: EMPTY_FULFILMENT };
const EMPTY_SNAPSHOT = "[]";

const listeners = new Set<() => void>();
let cache: string | null = null;

function parse(raw: string): StoredCart {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredCart>;
    return {
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
      fulfilment: parsed.fulfilment === "PICKUP" ? "PICKUP" : EMPTY_FULFILMENT,
    };
  } catch {
    return EMPTY_CART;
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): string {
  if (cache !== null) return cache;
  try {
    cache = window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
  } catch {
    // Storage can be blocked in private mode; fall back to an in-memory cart.
    cache = EMPTY_SNAPSHOT;
  }
  return cache;
}

function getServerSnapshot(): string {
  return EMPTY_SNAPSHOT;
}

function readCart(): StoredCart {
  return cache === null || cache === EMPTY_SNAPSHOT
    ? EMPTY_CART
    : parse(cache);
}

function writeCart(cart: StoredCart): void {
  const raw = JSON.stringify(cart);
  cache = raw;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Out of quota or blocked — the cart still works for this session.
  }
  for (const listener of listeners) listener();
}

/** `useSyncExternalStore` reads the server snapshot during hydration, then the
 * client one, so this reports false on the server and the first client render
 * and true afterwards — without a setState-in-effect. */
function subscribeNever(): () => void {
  return () => {};
}

function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useHydrated();

  const cart = useMemo(() => {
    if (!ready) return EMPTY_CART;
    try {
      return parse(snapshot);
    } catch {
      return EMPTY_CART;
    }
  }, [ready, snapshot]);

  const [promo, setPromo] = useState<PromoState>(null);
  const [promoChecking, setPromoChecking] = useState(false);

  // A promo only makes sense while there's something to discount, so derive
  // that instead of storing a "cleared" copy.
  const subtotal = useMemo(
    () => cart.lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [cart.lines],
  );
  const activePromo = subtotal > 0 ? promo : null;

  const addItem = useCallback<CartContextValue["addItem"]>(
    (item, quantity = 1, notes = "") => {
      if (!item.isAvailable) return;
      const current = readCart();
      const existing = current.lines.find((line) => line.itemId === item.id);

      const lines = existing
        ? current.lines.map((line) =>
            line.itemId === item.id
              ? {
                  ...line,
                  quantity: Math.min(20, line.quantity + quantity),
                  notes: notes.trim() ? notes.slice(0, 240) : line.notes,
                }
              : line,
          )
        : [
            ...current.lines,
            {
              itemId: item.id,
              slug: item.slug,
              name: item.name,
              price: item.price,
              image: item.image,
              categoryName: item.category.name,
              quantity: Math.min(20, Math.max(1, quantity)),
              notes,
              isAvailable: item.isAvailable,
            },
          ];

      writeCart({ lines, fulfilment: current.fulfilment });
    },
    [],
  );

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    const current = readCart();
    const lines =
      quantity <= 0
        ? current.lines.filter((line) => line.itemId !== itemId)
        : current.lines.map((line) =>
            line.itemId === itemId
              ? { ...line, quantity: Math.min(20, quantity) }
              : line,
          );
    writeCart({ lines, fulfilment: current.fulfilment });
  }, []);

  const setNotes = useCallback((itemId: string, notes: string) => {
    const current = readCart();
    writeCart({
      lines: current.lines.map((line) =>
        line.itemId === itemId ? { ...line, notes: notes.slice(0, 240) } : line,
      ),
      fulfilment: current.fulfilment,
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    const current = readCart();
    writeCart({
      lines: current.lines.filter((line) => line.itemId !== itemId),
      fulfilment: current.fulfilment,
    });
  }, []);

  const clearCart = useCallback(() => {
    setPromo(null);
    const current = readCart();
    writeCart({ lines: [], fulfilment: current.fulfilment });
  }, []);

  const setFulfilment = useCallback((value: Fulfilment) => {
    const current = readCart();
    writeCart({ lines: current.lines, fulfilment: value });
  }, []);

  const applyPromo = useCallback<CartContextValue["applyPromo"]>(
    async (code) => {
      setPromoChecking(true);
      try {
        const response = await fetch("/api/promo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, subtotal }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          reason?: string;
          discount?: number;
          description?: string | null;
        };
        if (!response.ok || !data.ok) {
          throw new Error(data.reason ?? "That promo code is not valid.");
        }
        setPromo({
          code: code.trim().toUpperCase(),
          description: data.description ?? null,
          discount: data.discount ?? 0,
        });
      } finally {
        setPromoChecking(false);
      }
    },
    [subtotal],
  );

  const clearPromo = useCallback(() => setPromo(null), []);

  const fulfilment = cart.fulfilment;

  const totals = useMemo(
    () =>
      calculateTotals({
        subtotal,
        fulfilment,
        discount: activePromo?.discount ?? 0,
      }),
    [subtotal, fulfilment, activePromo],
  );

  const itemCount = useMemo(
    () => cart.lines.reduce((sum, line) => sum + line.quantity, 0),
    [cart.lines],
  );

  

  const value = useMemo<CartContextValue>(
    () => ({
      lines: cart.lines,
      ready,
      fulfilment,
      promo: activePromo,
      subtotal,
      totals,
      itemCount,
      addItem,
      setQuantity,
      setNotes,
      removeItem,
      clearCart,
      setFulfilment,
      applyPromo,
      clearPromo,
      promoChecking,
    }),
    [
      cart.lines,
      ready,
      fulfilment,
      activePromo,
      subtotal,
      totals,
      itemCount,
      addItem,
      setQuantity,
      setNotes,
      removeItem,
      clearCart,
      setFulfilment,
      applyPromo,
      clearPromo,
      promoChecking,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return context;
}