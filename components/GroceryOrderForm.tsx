"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { GroceryItem, ActiveOrder } from "@/app/[playerId]/grocery/page";
import type { DeliveryOption } from "@/lib/groceryDeliveryDates";

type Cart = Record<string, number>; // itemId → quantity

const CATEGORY_LABELS: Record<string, string> = {
  produce: "Produce",
  meat: "Meat & Eggs",
  dairy: "Dairy",
  carbs: "Carbs",
  drinks: "Drinks",
  spices: "Spices",
  frozen: "Frozen",
  household: "Household",
};

const CATEGORY_ORDER = [
  "produce",
  "meat",
  "dairy",
  "carbs",
  "frozen",
  "drinks",
  "spices",
  "household",
];

const fmtPrice = (n: number) =>
  n === 0 ? "Free" : `€${n.toFixed(2).replace(".", ",")}`;

export const GroceryOrderForm = ({
  playerId,
  catalog,
  deliveryOptions,
  activeOrder,
  budget,
}: {
  playerId: string;
  catalog: GroceryItem[];
  deliveryOptions: DeliveryOption[];
  activeOrder: ActiveOrder | null;
  budget: number;
}) => {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>({});
  const [deliveryDate, setDeliveryDate] = useState<string>(
    deliveryOptions.find((d) => !d.expired)?.date ?? ""
  );
  const [category, setCategory] = useState<string>("all");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemById = useMemo(() => {
    const m = new Map<string, GroceryItem>();
    for (const i of catalog) m.set(i.id, i);
    return m;
  }, [catalog]);

  const total = useMemo(
    () =>
      Object.entries(cart).reduce((sum, [id, qty]) => {
        const it = itemById.get(id);
        return sum + (it ? it.price * qty : 0);
      }, 0),
    [cart, itemById]
  );

  const overBudget = total > budget;
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  // Group catalog by category, filtered
  const itemsByCat = useMemo(() => {
    const map: Record<string, GroceryItem[]> = {};
    for (const it of catalog) {
      if (category !== "all" && it.category !== category) continue;
      if (!map[it.category]) map[it.category] = [];
      map[it.category].push(it);
    }
    return map;
  }, [catalog, category]);

  const addItem = (id: string) =>
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));

  const removeItem = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      const current = next[id] ?? 0;
      if (current <= 1) delete next[id];
      else next[id] = current - 1;
      return next;
    });

  const submit = async () => {
    if (overBudget || cartCount === 0 || !deliveryDate) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/grocery/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: playerId,
          delivery_date: deliveryDate,
          items: Object.entries(cart).map(([item_id, quantity]) => ({
            item_id,
            quantity,
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to submit order");
      }
      setCart({});
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  // If there's an active order, show it prominently
  if (activeOrder) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-700/30 bg-green-900/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-green-400" />
            <h2 className="text-base font-bold text-green-300">
              Order confirmed
            </h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            Delivery{" "}
            <span className="font-semibold text-[var(--color-text)]">
              {new Date(activeOrder.delivery_date + "T00:00:00").toLocaleDateString(
                "en-US",
                { weekday: "long", month: "short", day: "numeric" }
              )}
            </span>{" "}
            between 6–8 PM.
          </p>
          <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3 space-y-1.5">
            {activeOrder.items.map((it, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-[var(--color-text)]">
                  {it.quantity}× {it.name}
                </span>
                <span className="text-[var(--color-text-secondary)]">
                  {fmtPrice(it.price_at_order * it.quantity)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 border-t border-[var(--color-border)] font-bold">
              <span>Total</span>
              <span>{fmtPrice(activeOrder.total_amount)}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Need changes? Message Thomas on WhatsApp — one active order per player.
        </p>
      </div>
    );
  }

  if (deliveryOptions.every((d) => d.expired)) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <Clock size={24} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          No upcoming order windows available. Next one opens soon — check back.
        </p>
      </div>
    );
  }

  const activeCats = Object.keys(itemsByCat).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  );

  return (
    <div className="pb-24">
      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-4">
        {["all", ...CATEGORY_ORDER].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              category === cat
                ? "bg-[var(--color-brand)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
            }`}
          >
            {cat === "all" ? "All" : CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Items grouped by category */}
      <div className="space-y-5">
        {activeCats.map((cat) => (
          <section key={cat}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              {CATEGORY_LABELS[cat] ?? cat}
            </h2>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
              {itemsByCat[cat].map((item) => {
                const qty = cart[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {fmtPrice(item.price)}
                      </p>
                    </div>
                    {qty > 0 ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-8 h-8 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center text-[var(--color-text)]"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold w-6 text-center text-[var(--color-text)]">
                          {qty}
                        </span>
                        <button
                          onClick={() => addItem(item.id)}
                          className="w-8 h-8 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addItem(item.id)}
                        className="w-8 h-8 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Delivery date + submit — sticky bottom bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[540px] bg-[var(--color-bg)] border-t border-[var(--color-border)] px-4 py-3 space-y-2 z-20">
        {/* Budget progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--color-text-secondary)]">
              <ShoppingCart size={12} className="inline mr-1" />
              {cartCount} {cartCount === 1 ? "item" : "items"} · {fmtPrice(total)}
            </span>
            <span
              className={`font-semibold ${
                overBudget ? "text-red-400" : "text-[var(--color-text-muted)]"
              }`}
            >
              {fmtPrice(budget - total)} {overBudget ? "over" : "left"}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
            <div
              className={`h-full transition-all ${
                overBudget ? "bg-red-500" : "bg-[var(--color-brand)]"
              }`}
              style={{ width: `${Math.min(100, (total / budget) * 100)}%` }}
            />
          </div>
        </div>

        {/* Delivery date select */}
        <select
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-lg px-3 py-2 text-sm"
        >
          {deliveryOptions.map((d) => (
            <option key={d.date} value={d.date} disabled={d.expired}>
              {d.expired
                ? `${d.dayName}, ${d.formattedDate} — deadline passed`
                : `${d.dayName}, ${d.formattedDate} — order by ${d.deadlineText}`}
            </option>
          ))}
        </select>

        {error && (
          <p className="flex items-center gap-1 text-xs text-red-400">
            <AlertCircle size={12} /> {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={overBudget || cartCount === 0 || !deliveryDate || submitting}
          className="w-full py-2.5 rounded-xl font-semibold text-white bg-[var(--color-brand)] disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_16px_var(--color-brand-glow)] transition-shadow flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Submitting…
            </>
          ) : overBudget ? (
            "Over budget"
          ) : cartCount === 0 ? (
            "Add items to submit"
          ) : (
            `Submit order · ${fmtPrice(total)}`
          )}
        </button>
      </div>
    </div>
  );
};
