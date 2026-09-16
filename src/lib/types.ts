export type TransactionType = "Jama" | "Issue";
export type MetalType = "Gold" | "Silver" | "Other" | "";
export type Purity = "24k" | "22k" | "18k" | "14k" | "925" | "";

export type LedgerEntry = {
  id: string;
  date: string;
  customerName: string;
  transactionType: TransactionType;
  metalType: MetalType | string;
  purity: Purity | string;
  grossWeight: string;
  melting: string;
  wastageGhat: string;
  fineWeight: string;
  jamaWeight: string;
  issueWeight: string;
  financialYear: string;
  notes: string;
};

export type ScanResponse = {
  entries: LedgerEntry[];
  summary: string;
};

export type ExportResponse = {
  fileName: string;
  drive: {
    uploaded: boolean;
    fileId?: string;
    webViewLink?: string;
    message: string;
  };
};

export function getFinancialYear(dateStr: string): string {
  if (!dateStr) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const startYr = currentMonth >= 4 ? currentYear : currentYear - 1;
    return `FY ${startYr}-${(startYr + 1) % 100}`;
  }

  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;

  // Handle DD/MM/YY or DD/MM/YYYY or YYYY-MM-DD
  const parts = dateStr.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    } else {
      // DD-MM-YY or DD-MM-YYYY
      month = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      year = y;
    }
  }

  if (isNaN(year) || isNaN(month)) {
    year = new Date().getFullYear();
    month = new Date().getMonth() + 1;
  }

  const startYr = month >= 4 ? year : year - 1;
  const endYrShort = String((startYr + 1) % 100).padStart(2, "0");
  return `FY ${startYr}-${endYrShort}`;
}

export function calculateEntry(entry: Partial<LedgerEntry>, index: number): LedgerEntry {
  const gross = parseFloat(String(entry.grossWeight || "0").replace(/,/g, "")) || 0;
  const melting = parseFloat(String(entry.melting || "0").replace(/,/g, "")) || 0;
  
  let fine = 0;
  if (gross > 0 && melting > 0) {
    fine = gross * (melting / 100);
  } else if (entry.fineWeight) {
    fine = parseFloat(String(entry.fineWeight).replace(/,/g, "")) || 0;
  }

  const fineStr = fine > 0 ? fine.toFixed(2) : (entry.fineWeight ? String(entry.fineWeight) : "0.00");

  const rawType = String(entry.transactionType || "").toLowerCase();
  const type: TransactionType = (rawType.includes("jama") || rawType.includes("receipt") || rawType.includes("credit") || rawType.includes("in")) ? "Jama" : (rawType.includes("issue") || rawType.includes("khata") || rawType.includes("debit") || rawType.includes("out")) ? "Issue" : "Jama";

  const dateVal = String(entry.date || "");
  const fy = entry.financialYear || getFinancialYear(dateVal);

  return {
    id: entry.id || `row-${Date.now()}-${index}`,
    date: dateVal,
    customerName: String(entry.customerName || ""),
    transactionType: type,
    metalType: String(entry.metalType || "Gold"),
    purity: String(entry.purity || ""),
    grossWeight: gross > 0 ? gross.toFixed(2) : String(entry.grossWeight || ""),
    melting: melting > 0 ? melting.toFixed(2) : String(entry.melting || ""),
    wastageGhat: String(entry.wastageGhat || "0.00"),
    fineWeight: fineStr,
    jamaWeight: type === "Jama" ? fineStr : "0.00",
    issueWeight: type === "Issue" ? fineStr : "0.00",
    financialYear: fy,
    notes: String(entry.notes || ""),
  };
}
