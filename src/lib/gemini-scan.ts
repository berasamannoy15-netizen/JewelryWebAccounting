import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateEntry, type LedgerEntry, type ScanResponse } from "@/lib/types";

const SYSTEM_PROMPT = `You are an expert Indian gold showroom and goldsmith workshop ledger accountant (khata / bahi viewer).
You read handwritten ledger pages and extract every transaction entry.

In handwritten pages, the typical sequence on a line is:
1. Date (e.g. 03-08-26 or DD/MM/YY or YYYY-MM-DD)
2. Narration / Item Description (e.g. S/1 MDN SONA, S/2 MDN ACC, S/1 MDN DOKIYA)
3. Transaction Type: "Jama" (Receipt / Credit / Inward) vs "Issue" (Khata / Debit / Outward)
4. Metal Type: "Gold" or "Silver"
5. Gross Weight in grams (e.g. 100.000)
6. Melting % / Purity % (e.g. 99.50 or 93.20)
7. Wastage / Ghat in grams (e.g. 0.00 or 1.50)
8. Net Weight in grams (e.g. 99.500, calculated as Gross Weight * (Melting / 100))
9. Remarks / Notes

Return ONLY valid JSON with this shape:
{
  "summary": "one short sentence describing the page(s)",
  "entries": [
    {
      "date": "03-08-26",
      "narration": "S/1 MDN SONA",
      "transactionType": "Jama or Issue",
      "metalType": "Gold or Silver",
      "grossWeight": 100.000,
      "melting": 99.50,
      "wastageGhat": 0,
      "netWeight": 99.500,
      "notes": "any remarks"
    }
  ]
}

Rules:
- Jama means metal received / credited to account. Issue means metal given / debited from account.
- Gross weight is the starting scale weight in grams.
- Melting is the purity percentage (e.g. 99.50 for 99.50% touch/fine gold).
- Net weight is calculated as Gross Weight * (Melting / 100).
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

  return {
    summary: parsed.summary ?? `Scanned ${images.length} ledger page(s).`,
    entries: parsed.entries ?? [],
  };
}

export async function scanLedgerImage(
  imageBase64: string,
  mimeType: string,
  customApiKey?: string,
): Promise<ScanResponse> {
  return scanLedgerImages([{ base64: imageBase64, mimeType }], customApiKey);
}
