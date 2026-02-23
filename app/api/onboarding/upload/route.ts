import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const prospectId = formData.get("prospectId") as string;
    const documentType = formData.get("documentType") as string;

    if (!file || !prospectId || !documentType) {
      return NextResponse.json(
        { error: "Missing file, prospectId, or documentType" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be under 10 MB" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only images and PDFs are allowed" },
        { status: 400 }
      );
    }

    // Verify prospect exists
    const { data: prospect, error: fetchError } = await supabase
      .from("trial_prospects")
      .select("id")
      .eq("id", prospectId)
      .single();

    if (fetchError || !prospect) {
      return NextResponse.json(
        { error: "Prospect not found" },
        { status: 404 }
      );
    }

    const ext = file.name.split(".").pop() || "bin";
    const timestamp = Date.now();
    const filePath = `${prospectId}/${documentType}_${timestamp}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("prospect-onboarding")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ path: filePath });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
