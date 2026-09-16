export type TransactionType = "Jama" | "Issue";

export type Account = {
  id: string;
  code: string;        // e.g. "MDN"
  name: string;        // e.g. "MDN JEWELS"
  area: string;        // e.g. "SURAT" or "MUMBAI"
  initialBalance: number; // Opening balance in net fine weight (g)
  createdAt: string;
};

export type LedgerEntry = {
  id: string;
  accountId: string;          // Account ID reference
  date: string;              // e.g. "03-08-26" or "2026-08-03"
  narration: string;         // e.g. "S/1 MDN SONA" or "S/1 MDN DOKIYA"
  transactionType: TransactionType; // "Jama" (Receipt) or "Issue" (Khata)
  metalType: string;         // "Gold" or "Silver"
  grossWeight: number;       // Gross scale weight (g), e.g. 100.000
  melting: number;           // Melting/purity %, e.g. 99.50 or 91.80
  wastageGhat: number;       // Wastage %, e.g. 1.70
  netWeight: number;         // Fine/Net weight (g), calculated: Gross * (Melting / 100)
  financialYear: string;     // e.g. "FY 2026-27"
  notes?: string;
};

export type ScanResponse = {
  entries: Partial<LedgerEntry>[];
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

  const parts = dateStr.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    } else {
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

export function computeNetWeight(grossWeight: number, melting: number): number {
  if (grossWeight <= 0) return 0;
  const melt = melting > 0 ? melting : 100;
  const net = grossWeight * (melt / 100);
  return Math.round(net * 1000) / 1000;
}

export function calculateEntry(partial: Partial<LedgerEntry>, accountId: string, index: number): LedgerEntry {
  const gross = parseFloat(String(partial.grossWeight || "0").replace(/,/g, "")) || 0;
  const melting = parseFloat(String(partial.melting || "0").replace(/,/g, "")) || 0;
  const wastage = parseFloat(String(partial.wastageGhat || "0").replace(/,/g, "")) || 0;

  let net = 0;
  if (gross > 0 && melting > 0) {
    net = computeNetWeight(gross, melting);
  } else if (partial.netWeight) {
    net = parseFloat(String(partial.netWeight).replace(/,/g, "")) || 0;
  }

  const rawType = String(partial.transactionType || "").toLowerCase();
  const type: TransactionType = (rawType.includes("jama") || rawType.includes("receipt") || rawType.includes("credit") || rawType.includes("in"))
    ? "Jama"
    : "Issue";

  const dateVal = String(partial.date || new Date().toLocaleDateString("en-GB"));
  const fy = partial.financialYear || getFinancialYear(dateVal);

  return {
    id: partial.id || `row-${Date.now()}-${index}`,
    accountId,
    date: dateVal,
    narration: String(partial.narration || "Entry"),
    transactionType: type,
    metalType: String(partial.metalType || "Gold"),
    grossWeight: gross,
    melting: melting,
    wastageGhat: wastage,
    netWeight: net,
    financialYear: fy,
    notes: String(partial.notes || ""),
  };
}

// Sample Accounts matching screenshot 1 & screenshot 2
export const INITIAL_SAMPLE_ACCOUNTS: Account[] = [
  { id: "acc-mdn", code: "MDN", name: "MDN JEWELS", area: "SURAT", initialBalance: 384.281, createdAt: "2026-08-01" },
  { id: "acc-db", code: "DB", name: "DILIP BHAI", area: "AHMEDABAD", initialBalance: -5.75, createdAt: "2026-08-01" },
  { id: "acc-bk", code: "BK", name: "BIKAS", area: "MUMBAI", initialBalance: -196.38, createdAt: "2026-08-01" },
  { id: "acc-km", code: "KM", name: "KHAGENDRANATH MONDOL", area: "KOLKATA", initialBalance: -20.30, createdAt: "2026-08-01" },
  { id: "acc-nil", code: "NIL", name: "NILANJAN MONDOL", area: "RAJKOT", initialBalance: -18.00, createdAt: "2026-08-01" },
  { id: "acc-rm", code: "RM", name: "RM JEWELS", area: "SURAT", initialBalance: -16.77, createdAt: "2026-08-01" },
  { id: "acc-rr", code: "RR", name: "RR JEWELS", area: "MUMBAI", initialBalance: -237.88, createdAt: "2026-08-01" },
];

// Sample Transactions matching screenshot 2 (MDN JEWELS Ledger)
export const INITIAL_SAMPLE_TRANSACTIONS: LedgerEntry[] = [
  // Jama Entries
  { id: "t-j1", accountId: "acc-mdn", date: "03-08-26", narration: "S/1 MDN SONA", transactionType: "Jama", metalType: "Gold", grossWeight: 100.000, melting: 99.50, wastageGhat: 0, netWeight: 99.500, financialYear: "FY 2026-27" },
  { id: "t-j2", accountId: "acc-mdn", date: "03-08-26", narration: "S/2 MDN ACC", transactionType: "Jama", metalType: "Gold", grossWeight: 11.740, melting: 93.20, wastageGhat: 0, netWeight: 10.942, financialYear: "FY 2026-27" },
  { id: "t-j3", accountId: "acc-mdn", date: "03-08-26", narration: "S/2(1) MDN ACC", transactionType: "Jama", metalType: "Gold", grossWeight: 12.210, melting: 93.20, wastageGhat: 0, netWeight: 11.380, financialYear: "FY 2026-27" },
  { id: "t-j4", accountId: "acc-mdn", date: "03-08-26", narration: "S/3 MDN ACC", transactionType: "Jama", metalType: "Gold", grossWeight: 54.430, melting: 93.20, wastageGhat: 0, netWeight: 50.729, financialYear: "FY 2026-27" },
  { id: "t-j5", accountId: "acc-mdn", date: "03-08-26", narration: "S/4 MDN CHAIN", transactionType: "Jama", metalType: "Gold", grossWeight: 203.820, melting: 92.80, wastageGhat: 0, netWeight: 189.145, financialYear: "FY 2026-27" },
  { id: "t-j6", accountId: "acc-mdn", date: "03-08-26", narration: "S/5 MDN DOKIYA", transactionType: "Jama", metalType: "Gold", grossWeight: 33.150, melting: 93.50, wastageGhat: 0, netWeight: 30.995, financialYear: "FY 2026-27" },

  // Issue Entries
  { id: "t-i1", accountId: "acc-mdn", date: "02-08-26", narration: "S/1 MDN DOKIYA", transactionType: "Issue", metalType: "Gold", grossWeight: 506.980, melting: 93.50, wastageGhat: 0, netWeight: 474.026, financialYear: "FY 2026-27" },
  { id: "t-i2", accountId: "acc-mdn", date: "04-08-26", narration: "S/2 MDN DOKIYA", transactionType: "Issue", metalType: "Gold", grossWeight: 290.470, melting: 93.50, wastageGhat: 0, netWeight: 271.589, financialYear: "FY 2026-27" },
  { id: "t-i3", accountId: "acc-mdn", date: "04-08-26", narration: "S/3 MDN VATI", transactionType: "Issue", metalType: "Gold", grossWeight: 11.490, melting: 93.20, wastageGhat: 0, netWeight: 10.709, financialYear: "FY 2026-27" },
  { id: "t-i4", accountId: "acc-mdn", date: "05-08-26", narration: "S/4 MDN DOKIYA", transactionType: "Issue", metalType: "Gold", grossWeight: 9.020, melting: 93.50, wastageGhat: 0, netWeight: 8.434, financialYear: "FY 2026-27" },
  { id: "t-i5", accountId: "acc-mdn", date: "06-08-26", narration: "S/5 MDN DOKIYA", transactionType: "Issue", metalType: "Gold", grossWeight: 193.170, melting: 93.50, wastageGhat: 0, netWeight: 180.614, financialYear: "FY 2026-27" },
];
