import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateEntry, type LedgerEntry, type ScanResponse } from "@/lib/types";

const SYSTEM_PROMPT = `You are an expert Indian gold showroom and goldsmith workshop ledger accountant (khata / bahi viewer).
You read handwritten ledger pages and extract every transaction entry.

In handwritten pages, the typical sequence on a line is:
1. Date (e.g. 12/07/26 or DD/MM/YY or YYYY-MM-DD)
2. Customer or Karigar (Artisan) Name
3. Transaction Type: "Jama" (Receipt / Credit / Inward) vs "Issue" (Khata / Debit / Outward)
4. Metal Type: "Gold" or "Silver"
5. Gross Weight in grams (e.g. 100.00)
6. Melting % / Purity % (e.g. 93.20 or 92.0 or 22k/91.6)
7. Wastage / Ghat in grams (e.g. 0.00 or 1.50)
8. Fine Weight in grams (e.g. 93.20, calculated as Gross Weight * (Melting / 100))
9. Remarks / Notes

Return ONLY valid JSON with this shape:
{
  "summary": "one short sentence describing the page(s)",
  "entries": [
    {
      "date": "DD/MM/YY or YYYY-MM-DD",
      "customerName": "customer or artisan name",
      "transactionType": "Jama or Issue",
      "metalType": "Gold or Silver",
      "purity": "22k, 24k, 18k, 925, etc.",
      "grossWeight": "100.00",
      "melting": "93.20",
      "wastageGhat": "0.00",
      "fineWeight": "93.20",
      "notes": "any remarks"
    }
  ]
}

Rules:
- Jama means metal received / credited to account. Issue means metal given / debited from account.
- Gross weight is the starting scale weight in grams.
- Melting is the purity percentage (e.g. 93.20 for 93.20% touch/fine gold).
- Fine weight is calculated as Gross Weight * (Melting / 100).
- Do NOT extract making charges or cash amounts.
- Transliterate Hindi, Gujarati, or Marathi names into Latin script.`;

export async function scanLedgerImages(
  images: { base64: string; mimeType: string }[],
  customApiKey?: string,
): Promise<ScanResponse> {
  const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    throw new Error(
      "Gemini API key is missing or invalid. Please enter your Gemini API key in the UI setting or set GEMINI_API_KEY in .env.local file.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,
    },
    systemInstruction: SYSTEM_PROMPT,
  });

  const contentParts: any[] = [];
  for (const img of images) {
    contentParts.push({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType,
      },
    });
  }
  contentParts.push("Analyze these handwritten jewelry ledger pages and extract all transaction rows.");

  const result = await model.generateContent(contentParts);
  const raw = result.response.text();
  if (!raw) {
    throw new Error("The Gemini vision model returned an empty response.");
  }

  const parsed = JSON.parse(raw) as {
    summary?: string;
    entries?: Partial<LedgerEntry>[];
  };

  const entries = (parsed.entries ?? []).map((entry, index) =>
    calculateEntry(entry, index),
  );

  return {
    summary: parsed.summary ?? `Scanned ${images.length} ledger page(s).`,
    entries,
  };
}

export async function scanLedgerImage(
  imageBase64: string,
  mimeType: string,
  customApiKey?: string,
): Promise<ScanResponse> {
  return scanLedgerImages([{ base64: imageBase64, mimeType }], customApiKey);
}
