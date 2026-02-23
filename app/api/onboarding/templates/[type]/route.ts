import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type Props = {
  params: Promise<{ type: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { type } = await params;
  const { searchParams } = new URL(request.url);
  const prospectId = searchParams.get("prospectId");

  if (!prospectId) {
    return NextResponse.json({ error: "Missing prospectId" }, { status: 400 });
  }

  const { data: prospect, error } = await supabase
    .from("trial_prospects")
    .select("first_name, last_name, date_of_birth, parent_name")
    .eq("id", prospectId)
    .single();

  if (error || !prospect) {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }

  const playerName = `${prospect.first_name} ${prospect.last_name}`;
  const dob = prospect.date_of_birth;
  const parentName = prospect.parent_name || "________________________";

  let pdfBytes: Uint8Array;

  if (type === "vollmacht") {
    pdfBytes = await generateVollmacht(playerName, dob, parentName);
  } else if (type === "wellpass") {
    pdfBytes = await generateWellpassConsent(playerName, dob, parentName);
  } else {
    return NextResponse.json({ error: "Unknown template type" }, { status: 400 });
  }

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${type}_${prospect.last_name}.pdf"`,
    },
  });
}

async function generateVollmacht(
  playerName: string,
  dob: string,
  parentName: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);

  let y = 780;
  const left = 50;

  // Header
  page.drawText("VOLLMACHT", { x: left, y, font: bold, size: 20, color: black });
  y -= 15;
  page.drawText("Power of Attorney", { x: left, y, font, size: 11, color: gray });
  y -= 30;
  page.drawText("1. FC Köln — International Talent Program", { x: left, y, font: bold, size: 12, color: black });
  y -= 30;

  // Pre-filled fields
  const lines = [
    `I, ${parentName}`,
    `(parent/legal guardian of ${playerName}, born ${dob}),`,
    "",
    "hereby authorize Warubi Sports UG (haftungsbeschränkt),",
    "represented by Max Bisinger, to act on my behalf in the following matters",
    "during my child's participation in the International Talent Program (ITP)",
    "at 1. FC Köln:",
    "",
    "1. Medical decisions in case of emergency",
    "2. Administrative matters related to housing and daily life",
    "3. Travel and transportation within Germany",
    "4. Communication with educational institutions",
    "5. Communication with football training facilities",
    "",
    "This authorization is valid from the date of signing until the end",
    "of the player's participation in the ITP program.",
    "",
    "",
    "Date: _______________________",
    "",
    "",
    "Signature of Parent/Guardian: _______________________________",
    "",
    `Name (printed): ${parentName}`,
    "",
    "",
    "Signature of Player: _______________________________",
    "",
    `Name (printed): ${playerName}`,
  ];

  for (const line of lines) {
    page.drawText(line, { x: left, y, font, size: 11, color: black });
    y -= 18;
  }

  return doc.save();
}

async function generateWellpassConsent(
  playerName: string,
  dob: string,
  parentName: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);

  let y = 780;
  const left = 50;

  page.drawText("WELLPASS GYM MEMBERSHIP", { x: left, y, font: bold, size: 18, color: black });
  y -= 15;
  page.drawText("Parental Consent for Minor", { x: left, y, font, size: 11, color: gray });
  y -= 30;
  page.drawText("1. FC Köln — International Talent Program", { x: left, y, font: bold, size: 12, color: black });
  y -= 30;

  const lines = [
    `I, ${parentName}`,
    `(parent/legal guardian of ${playerName}, born ${dob}),`,
    "",
    "hereby give consent for my child to use gym facilities through the",
    "Wellpass program as part of their training during the International",
    "Talent Program (ITP) at 1. FC Köln.",
    "",
    "I acknowledge that:",
    "",
    "1. My child will use gym equipment under supervision of ITP staff",
    "2. The gym membership is provided through the Wellpass corporate",
    "   fitness program",
    "3. I have been informed about the risks associated with physical",
    "   training and gym usage",
    "4. I will inform the ITP staff of any medical conditions that may",
    "   affect my child's ability to participate in gym activities",
    "",
    "",
    "Date: _______________________",
    "",
    "",
    "Signature of Parent/Guardian: _______________________________",
    "",
    `Name (printed): ${parentName}`,
    "",
    "",
    "Signature of Player: _______________________________",
    "",
    `Name (printed): ${playerName}`,
  ];

  for (const line of lines) {
    page.drawText(line, { x: left, y, font, size: 11, color: black });
    y -= 18;
  }

  return doc.save();
}
