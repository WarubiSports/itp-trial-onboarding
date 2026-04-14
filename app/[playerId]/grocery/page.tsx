import { supabase } from "@/lib/supabase";
import { resolvePlayer } from "@/lib/resolvePlayer";
import { GroceryOrderForm } from "@/components/GroceryOrderForm";
import { getDeliveryDates, GROCERY_BUDGET } from "@/lib/groceryDeliveryDates";
import { CalendarClock } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ playerId: string }>;
};

export type GroceryItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  in_stock: boolean;
};

export type ActiveOrder = {
  id: string;
  delivery_date: string;
  total_amount: number;
  status: string;
  submitted_at: string;
  items: { name: string; quantity: number; price_at_order: number }[];
};

export default async function GroceryPage({ params }: Props) {
  const { playerId: urlId } = await params;
  const resolved = await resolvePlayer(urlId);

  if (!resolved) notFound();

  if (resolved.source !== "player") {
    return (
      <div className="py-12 px-4 text-center">
        <CalendarClock size={40} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">
          Grocery ordering is available once you&apos;re in the program.
        </p>
        <Link
          href={`/${urlId}`}
          className="text-sm font-semibold text-[var(--color-brand)] hover:underline"
        >
          Back to your info →
        </Link>
      </div>
    );
  }

  const playerId = resolved.data.id;

  // Catalog — in-stock items
  const { data: catalogData } = await supabase
    .from("grocery_items")
    .select("id, name, category, price, in_stock")
    .eq("in_stock", true)
    .order("category")
    .order("name");

  const catalog = (catalogData || []) as GroceryItem[];

  // Most recent order for this player (pending/submitted/approved — not delivered/cancelled)
  const { data: activeOrderData } = await supabase
    .from("grocery_orders")
    .select("id, delivery_date, total_amount, status, submitted_at")
    .eq("player_id", playerId)
    .in("status", ["pending", "submitted", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let activeOrder: ActiveOrder | null = null;
  if (activeOrderData) {
    const { data: itemsData } = await supabase
      .from("grocery_order_items")
      .select("quantity, price_at_order, grocery_items!inner(name)")
      .eq("order_id", activeOrderData.id);

    activeOrder = {
      ...activeOrderData,
      items: (itemsData || []).map(
        (r: {
          quantity: number;
          price_at_order: number;
          grocery_items: { name: string } | { name: string }[];
        }) => ({
          name: Array.isArray(r.grocery_items)
            ? r.grocery_items[0]?.name ?? ""
            : r.grocery_items?.name ?? "",
          quantity: r.quantity,
          price_at_order: r.price_at_order,
        })
      ),
    };
  }

  const deliveryOptions = getDeliveryDates();

  return (
    <div className="py-4 px-4">
      <GroceryOrderForm
        playerId={playerId}
        catalog={catalog}
        deliveryOptions={deliveryOptions}
        activeOrder={activeOrder}
        budget={GROCERY_BUDGET}
      />
    </div>
  );
}
