import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { chore_id, player_id } = body as {
    chore_id?: string;
    player_id?: string;
  };

  if (!chore_id || !player_id) {
    return NextResponse.json(
      { error: "chore_id and player_id required" },
      { status: 400 }
    );
  }

  // Verify the chore belongs to this player and isn't already complete / photo-required.
  const { data: chore, error: fetchErr } = await supabase
    .from("chores")
    .select("id, assigned_to, status, requires_photo, points, house_id")
    .eq("id", chore_id)
    .maybeSingle();

  if (fetchErr || !chore) {
    return NextResponse.json({ error: "Chore not found" }, { status: 404 });
  }

  if (chore.assigned_to !== player_id) {
    return NextResponse.json(
      { error: "Chore not assigned to this player" },
      { status: 403 }
    );
  }

  if (chore.requires_photo) {
    return NextResponse.json(
      {
        error:
          "This chore requires a photo — please complete it in the Player App for now.",
      },
      { status: 400 }
    );
  }

  if (chore.status === "completed" || chore.status === "approved") {
    return NextResponse.json({ success: true, alreadyDone: true });
  }

  const nowIso = new Date().toISOString();

  // Mark chore as approved (same as Vite flow for no-photo chores: instant completion).
  const { error: updateErr } = await supabase
    .from("chores")
    .update({
      status: "approved",
      completed_at: nowIso,
      approved_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", chore_id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Bump house total_points. Best-effort — we don't fail the request if this doesn't land.
  if (chore.house_id && chore.points) {
    const { data: house } = await supabase
      .from("houses")
      .select("total_points")
      .eq("id", chore.house_id)
      .maybeSingle();

    const newTotal = (house?.total_points ?? 0) + chore.points;
    await supabase
      .from("houses")
      .update({ total_points: newTotal, updated_at: nowIso })
      .eq("id", chore.house_id);
  }

  return NextResponse.json({ success: true });
}
