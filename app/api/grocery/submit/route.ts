import { supabase } from "@/lib/supabase";
import { GROCERY_BUDGET } from "@/lib/groceryDeliveryDates";
import { NextResponse } from "next/server";

type CartLine = { item_id: string; quantity: number };

export async function POST(request: Request) {
  const body = await request.json();
  const { player_id, delivery_date, items } = body as {
    player_id?: string;
    delivery_date?: string;
    items?: CartLine[];
  };

  if (!player_id || !delivery_date || !items || items.length === 0) {
    return NextResponse.json(
      { error: "player_id, delivery_date, and items are required" },
      { status: 400 }
    );
  }

  // Defense-in-depth — the UI gates pre-program-start players out of the
  // grocery page, but a bookmarked POST could otherwise sneak through and
  // put a phantom order in the kitchen's pipeline.
  const { data: player } = await supabase
    .from("players")
    .select("program_start_date")
    .eq("id", player_id)
    .maybeSingle();

  if (player?.program_start_date) {
    const today = new Date().toISOString().split("T")[0];
    if (today < player.program_start_date) {
      return NextResponse.json(
        { error: "Grocery ordering opens when your program begins." },
        { status: 403 }
      );
    }
  }

  // Enforce "one active order per player" (keeps parity with the Vite app's
  // "keep 1 per player" rule). Cancel any existing active orders first —
  // safer than blocking because the player clearly intended the new one.
  await supabase
    .from("grocery_orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("player_id", player_id)
    .in("status", ["pending", "submitted"]);

  // Verify items exist and compute total from DB prices (don't trust client).
  const itemIds = items.map((i) => i.item_id);
  const { data: catalogItems, error: catalogError } = await supabase
    .from("grocery_items")
    .select("id, price, in_stock")
    .in("id", itemIds);

  if (catalogError || !catalogItems) {
    return NextResponse.json(
      { error: "Failed to verify cart items" },
      { status: 500 }
    );
  }

  const catalogMap = new Map(catalogItems.map((c) => [c.id as string, c]));
  let total = 0;
  for (const line of items) {
    const cat = catalogMap.get(line.item_id);
    if (!cat || !cat.in_stock) {
      return NextResponse.json(
        { error: "One or more items are out of stock. Please review your cart." },
        { status: 400 }
      );
    }
    if (line.quantity < 1) {
      return NextResponse.json(
        { error: "Quantities must be at least 1" },
        { status: 400 }
      );
    }
    total += (cat.price as number) * line.quantity;
  }

  if (total > GROCERY_BUDGET) {
    return NextResponse.json(
      { error: `Total €${total.toFixed(2)} exceeds €${GROCERY_BUDGET} budget` },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("grocery_orders")
    .insert({
      player_id,
      delivery_date,
      total_amount: total,
      status: "submitted",
      submitted_at: nowIso,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message || "Failed to create order" },
      { status: 500 }
    );
  }

  // Insert items with price_at_order snapshot
  const rows = items.map((line) => ({
    order_id: order.id,
    item_id: line.item_id,
    quantity: line.quantity,
    price_at_order: (catalogMap.get(line.item_id)!.price as number),
  }));

  const { error: itemsError } = await supabase
    .from("grocery_order_items")
    .insert(rows);

  if (itemsError) {
    // Best-effort rollback
    await supabase.from("grocery_orders").delete().eq("id", order.id);
    return NextResponse.json(
      { error: itemsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, order_id: order.id });
}
