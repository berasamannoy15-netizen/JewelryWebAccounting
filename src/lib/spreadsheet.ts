import * as XLSX from "xlsx";
import type { LedgerEntry } from "@/lib/types";

const HEADERS = [
  "Date",
  "Customer / Artisan Name",
  "Transaction Type",
  "Metal Type",
  "Purity",
  "Gross Weight (g)",
  "Melting %",
  "Wastage / Ghat (g)",
  "Fine Weight (g)",
  "Jama / Receipt (g)",
  "Issue / Khata (g)",
  "Financial Year",
  "Notes",
] as const;

function toNumber(value: string): number | string {
  if (!value) return 0;
  const cleaned = String(value).replace(/[,₹]/g, "").trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : value;
}

function buildSheetForEntries(title: string, entries: LedgerEntry[]): XLSX.WorkSheet {
  let totalJama = 0;
  let totalIssue = 0;

  const rows = entries.map((entry) => {
    const jama = entry.transactionType === "Jama" ? (Number(toNumber(entry.jamaWeight)) || 0) : 0;
    const issue = entry.transactionType === "Issue" ? (Number(toNumber(entry.issueWeight)) || 0) : 0;
    totalJama += jama;
    totalIssue += issue;

    return [
      entry.date,
      entry.customerName,
      entry.transactionType,
      entry.metalType,
      entry.purity,
      toNumber(entry.grossWeight),
      toNumber(entry.melting),
      toNumber(entry.wastageGhat),
      toNumber(entry.fineWeight),
      jama > 0 ? jama : 0,
      issue > 0 ? issue : 0,
      entry.financialYear,
      entry.notes,
    ];
  });

  const summaryRow1 = ["TOTALS", "", "", "", "", "", "", "", "", totalJama, totalIssue, "", ""];
  const summaryRow2 = ["NET BALANCE (Jama - Issue)", "", "", "", "", "", "", "", "", (totalJama - totalIssue), "", "", ""];

  const sheet = XLSX.utils.aoa_to_sheet([
    [title],
    ["Generated", new Date().toLocaleString("en-IN")],
    [],
    [...HEADERS],
    ...rows,
    [],
    summaryRow1,
    summaryRow2,
  ]);

  sheet["!cols"] = [
    { wch: 14 }, // Date
    { wch: 28 }, // Customer
    { wch: 16 }, // Type
    { wch: 12 }, // Metal
    { wch: 10 }, // Purity
    { wch: 16 }, // Gross
    { wch: 14 }, // Melting
    { wch: 18 }, // Wastage
    { wch: 16 }, // Fine Wt
    { wch: 18 }, // Jama
    { wch: 18 }, // Issue
    { wch: 14 }, // FY
    { wch: 28 }, // Notes
  ];

  return sheet;
}

export function buildLedgerWorkbook(entries: LedgerEntry[]): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Combined Sheet
  const combinedSheet = buildSheetForEntries("Gold Showroom Combined Ledger", entries);
  XLSX.utils.book_append_sheet(workbook, combinedSheet, "All Transactions");

  // Group by Financial Year
  const fyMap = new Map<string, LedgerEntry[]>();
  entries.forEach((entry) => {
    const fy = entry.financialYear || "FY General";
    if (!fyMap.has(fy)) fyMap.set(fy, []);
    fyMap.get(fy)!.push(entry);
  });

  // Create separate sheet per FY
  Array.from(fyMap.keys()).sort().reverse().forEach((fy) => {
    const fyEntries = fyMap.get(fy)!;
    const fySheet = buildSheetForEntries(`Gold Showroom Ledger - ${fy}`, fyEntries);
    // Sheet names in Excel cannot exceed 31 chars
    const sheetName = fy.substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, fySheet, sheetName);
  });

  return workbook;
}

export function workbookToBuffer(workbook: XLSX.WorkBook): Buffer {
  const bytes = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    cellStyles: true,
  }) as Buffer;
  return Buffer.from(bytes);
}

export function defaultExportFileName(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `gold-showroom-ledger-${stamp}.xlsx`;
}
