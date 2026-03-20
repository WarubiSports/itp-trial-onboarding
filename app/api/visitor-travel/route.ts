import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { visitorId, data } = body;

    if (!visitorId) {
      return NextResponse.json({ error: "Missing visitorId" }, { status: 400 });
    }

    const { data: visitor, error: fetchError } = await supabase
      .from("visitors")
      .select("id")
      .eq("id", visitorId)
      .single();

    if (fetchError || !visitor) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    const fields = [
      "arrival_date", "arrival_time", "flight_number", "arrival_airport",
      "needs_pickup", "pickup_location", "whatsapp_number", "travel_submitted_at",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of fields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const { error: updateError } = await supabase
      .from("visitors")
      .update(updateData)
      .eq("id", visitorId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
