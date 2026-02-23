import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prospectId, step, submit, data } = body;

    if (!prospectId) {
      return NextResponse.json({ error: "Missing prospectId" }, { status: 400 });
    }

    // Verify prospect exists
    const { data: prospect, error: fetchError } = await supabase
      .from("trial_prospects")
      .select("id")
      .eq("id", prospectId)
      .single();

    if (fetchError || !prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    // Build update payload - only include non-undefined fields
    const updateData: Record<string, unknown> = {
      onboarding_step: step,
    };

    const fields = [
      "arrival_date", "arrival_time", "flight_number", "arrival_airport",
      "needs_pickup", "whatsapp_number", "equipment_size",
      "schengen_last_180_days", "is_under_18",
      "passport_file_path", "parent1_passport_file_path",
      "parent2_passport_file_path", "vollmacht_file_path",
      "wellpass_consent_file_path",
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (submit) {
      updateData.onboarding_completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("trial_prospects")
      .update(updateData)
      .eq("id", prospectId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
