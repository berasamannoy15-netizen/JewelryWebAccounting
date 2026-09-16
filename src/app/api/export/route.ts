import { NextResponse } from "next/server";
import { uploadWorkbookToDrive } from "@/lib/google-drive";
import {
  buildLedgerWorkbook,
  defaultExportFileName,
  workbookToBuffer,
} from "@/lib/spreadsheet";
import type { LedgerEntry } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { entries?: LedgerEntry[] };
    const entries = body.entries ?? [];

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "There are no ledger rows to export yet." },
        { status: 400 },
      );
    }

    const fileName = defaultExportFileName();
    const workbook = buildLedgerWorkbook(entries);
    const buffer = workbookToBuffer(workbook);
    const drive = await uploadWorkbookToDrive(fileName, buffer);

    return NextResponse.json({
      fileName,
      fileBase64: buffer.toString("base64"),
      drive,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create or upload the spreadsheet.";
    console.error("Export failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
