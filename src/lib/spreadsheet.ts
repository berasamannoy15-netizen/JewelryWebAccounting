import * as XLSX from "xlsx";
import type { Account, LedgerEntry } from "@/lib/types";

export function buildAccountLedgerWorkbook(
  account: Account,
  entries: LedgerEntry[],
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const jamaRows = entries.filter((e) => e.transactionType === "Jama");
  const issueRows = entries.filter((e) => e.transactionType === "Issue");

  let totalJamaGr = 0;
  let totalJamaNet = 0;
  jamaRows.forEach((e) => {
    totalJamaGr += e.grossWeight || 0;
    totalJamaNet += e.netWeight || 0;
  });

  let totalIssueGr = 0;
  let totalIssueNet = 0;
  issueRows.forEach((e) => {
    totalIssueGr += e.grossWeight || 0;
    totalIssueNet += e.netWeight || 0;
  });

  const netBalance = (account.initialBalance || 0) + totalJamaNet - totalIssueNet;

  const dataRows: any[] = [];
  dataRows.push([`CASH BOOK LEDGER: ${account.code} - ${account.name}`]);
  dataRows.push([`Area: ${account.area || "All"}`]);
  dataRows.push([`Exported Date: ${new Date().toLocaleString("en-IN")}`]);
  dataRows.push([]);
  dataRows.push([`Opening Balance (Bal. B/f)`, account.initialBalance]);
  dataRows.push([]);

  // Jama Section
  dataRows.push(["--- RECEIPT / JAMA (CREDIT INWARD) ---"]);
  dataRows.push(["Date", "Narration / Description", "Gross Weight (g)", "Melting %", "Net Weight (g)", "Financial Year", "Notes"]);
  jamaRows.forEach((e) => {
    dataRows.push([e.date, e.narration, e.grossWeight, e.melting, e.netWeight, e.financialYear, e.notes]);
  });
  dataRows.push(["JAMA TOTAL", "", totalJamaGr, "", totalJamaNet, "", ""]);
  dataRows.push([]);

  // Issue Section
  dataRows.push(["--- ISSUE / NAME (DEBIT OUTWARD) ---"]);
  dataRows.push(["Date", "Narration / Description", "Gross Weight (g)", "Melting %", "Net Weight (g)", "Financial Year", "Notes"]);
  issueRows.forEach((e) => {
    dataRows.push([e.date, e.narration, e.grossWeight, e.melting, e.netWeight, e.financialYear, e.notes]);
  });
  dataRows.push(["ISSUE TOTAL", "", totalIssueGr, "", totalIssueNet, "", ""]);
  dataRows.push([]);
  dataRows.push(["CLOSING NET BALANCE (Bal. C/f)", netBalance]);

  const sheet = XLSX.utils.aoa_to_sheet(dataRows);
  sheet["!cols"] = [
    { wch: 14 },
    { wch: 30 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 28 },
  ];

  const sheetName = `${account.code} Ledger`.substring(0, 31);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);

  return workbook;
}

export function buildLedgerWorkbook(entries: LedgerEntry[]): XLSX.WorkBook {
  const dummyAcc: Account = {
    id: "export",
    code: "ALL",
    name: "ALL ACCOUNTS COMBINED",
    area: "ALL",
    initialBalance: 0,
    createdAt: "",
  };
  return buildAccountLedgerWorkbook(dummyAcc, entries);
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
