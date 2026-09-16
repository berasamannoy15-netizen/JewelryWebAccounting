import { NextResponse } from "next/server";
import { scanLedgerImages } from "@/lib/gemini-scan";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files: File[] = [];

    const rawFiles = formData.getAll("images").concat(formData.getAll("image"));
    for (const item of rawFiles) {
      if (item instanceof File) {
        files.push(item);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Please attach at least one ledger photo." },
        { status: 400 },
      );
    }

    const customApiKey = request.headers.get("x-gemini-api-key") || (formData.get("apiKey") as string) || undefined;

    const imagesData = await Promise.all(
      files.map(async (file) => {
        const bytes = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type || "image/jpeg";
        return { base64: bytes.toString("base64"), mimeType };
      }),
    );

    const result = await scanLedgerImages(imagesData, customApiKey);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to scan the ledger photo.";
    console.error("Scan failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
