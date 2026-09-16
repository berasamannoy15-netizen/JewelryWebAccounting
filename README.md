# Gold Showroom Ledger Atelier

A beginner-friendly Next.js website for a gold showroom and goldsmith workshop. Photograph a handwritten ledger page, let Gemini AI extract jewelry entries, review them in a table, then export a formatted Excel file (and optionally upload it to Google Drive).

## What you need

1. Node.js installed on this computer (https://nodejs.org — choose the LTS version).
2. A Google Gemini API key (`GEMINI_API_KEY`).
3. Optional: a Google Cloud service account if you want automatic Drive upload.

## How to start the website locally

1. Open a terminal in this folder: `C:\Users\beras\OneDrive\Documents\JewelryWebAccounting`
2. Copy `.env.example` to a new file named `.env.local`
3. Put your real Gemini API key in `.env.local`
4. Run:

```bash
npm run dev
```

5. In your browser, open: **http://localhost:3000**

If that port is already used, Next.js will print another address such as `http://localhost:3001`.

## Google Drive (optional)

1. Create a Google Cloud project and enable the Google Drive API.
2. Create a service account and download its JSON key.
3. Share a Drive folder with the service account email (Editor access).
4. Paste the JSON into `GOOGLE_SERVICE_ACCOUNT_JSON` in `.env.local` as a single line.
5. Put the folder ID in `GOOGLE_DRIVE_FOLDER_ID` (the long id in the folder URL).

Without Drive credentials, Excel files still download to this computer.

## Project map

- `src/app/page.tsx` — home screen
- `src/components/DropZone.tsx` — drag-and-drop + camera
- `src/components/LedgerTable.tsx` — review table
- `src/app/api/scan/route.ts` — Gemini AI vision scan
- `src/lib/gemini-scan.ts` — Gemini AI integration
- `src/app/api/export/route.ts` — xlsx workbook + Drive upload
