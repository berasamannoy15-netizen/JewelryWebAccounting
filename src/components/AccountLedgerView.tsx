"use client";

import { useMemo, useState } from "react";
import { DropZone } from "@/components/DropZone";
import type { Account, LedgerEntry } from "@/lib/types";

type AccountLedgerViewProps = {
  account: Account;
  transactions: LedgerEntry[];
  blockDate: string | null;
  showScan: boolean;
  busy: boolean;
  onBack: () => void;
  onToggleScan: () => void;
  onScanImages: (files: File[]) => void;
  onOpenAddTransaction: () => void;
  onEditTransaction: (entry: LedgerEntry) => void;
  onOpenBlockDate: () => void;
  onExportExcel: () => void;
};

export function AccountLedgerView({
  account,
  transactions,
  blockDate,
  showScan,
  busy,
  onBack,
  onToggleScan,
  onScanImages,
  onOpenAddTransaction,
  onEditTransaction,
  onOpenBlockDate,
  onExportExcel,
}: AccountLedgerViewProps) {
  const [selectedFY, setSelectedFY] = useState<string>("ALL");

  // Filter transactions for this specific account
  const accountTxs = useMemo(() => {
    return transactions.filter((t) => t.accountId === account.id);
  }, [transactions, account.id]);

  // Extract financial years
  const financialYears = useMemo(() => {
    const set = new Set<string>();
    accountTxs.forEach((t) => {
      if (t.financialYear) set.add(t.financialYear);
    });
    return Array.from(set).sort().reverse();
  }, [accountTxs]);

  // Filter by FY
  const fyFilteredTxs = useMemo(() => {
    if (selectedFY === "ALL") return accountTxs;
    return accountTxs.filter((t) => t.financialYear === selectedFY);
  }, [accountTxs, selectedFY]);

  // Separate Jama & Issue entries considering Block Date
  const { jamaEntries, issueEntries, openingBalance, closingBalance, totalJamaGr, totalJamaNet, totalIssueGr, totalIssueNet } =
    useMemo(() => {
      let initialBf = account.initialBalance || 0;
      let blockedJamaNet = 0;
      let blockedIssueNet = 0;

      const visibleJama: LedgerEntry[] = [];
      const visibleIssue: LedgerEntry[] = [];

      fyFilteredTxs.forEach((t) => {
        const isBlocked = blockDate && t.date <= blockDate;
        if (isBlocked) {
          if (t.transactionType === "Jama") {
            blockedJamaNet += t.netWeight || 0;
          } else {
            blockedIssueNet += t.netWeight || 0;
          }
        } else {
          if (t.transactionType === "Jama") {
            visibleJama.push(t);
          } else {
            visibleIssue.push(t);
          }
        }
      });

      const balBf = initialBf + (blockedJamaNet - blockedIssueNet);

      let tJamaGr = 0;
      let tJamaNet = 0;
      visibleJama.forEach((t) => {
        tJamaGr += t.grossWeight || 0;
        tJamaNet += t.netWeight || 0;
      });

      let tIssueGr = 0;
      let tIssueNet = 0;
      visibleIssue.forEach((t) => {
        tIssueGr += t.grossWeight || 0;
        tIssueNet += t.netWeight || 0;
      });

      const balCf = balBf + tJamaNet - tIssueNet;

      return {
        jamaEntries: visibleJama,
        issueEntries: visibleIssue,
        openingBalance: Math.round(balBf * 1000) / 1000,
        closingBalance: Math.round(balCf * 1000) / 1000,
        totalJamaGr: Math.round(tJamaGr * 1000) / 1000,
        totalJamaNet: Math.round(tJamaNet * 1000) / 1000,
        totalIssueGr: Math.round(tIssueGr * 1000) / 1000,
        totalIssueNet: Math.round(tIssueNet * 1000) / 1000,
      };
    }, [fyFilteredTxs, account.initialBalance, blockDate]);

  const maxRows = Math.max(jamaEntries.length, issueEntries.length, 10);

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-gold/30 bg-stone-950 p-4 shadow-2xl sm:p-6 text-stone-100 font-sans">
      {/* Title Bar matching Screenshot 2 */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gold/30 bg-stone-900/90 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold hover:text-ink"
          >
            ← Back to Accounts
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-red-900/80 px-2 py-0.5 text-xs font-mono font-bold text-red-100">
                A/c Code: {account.code}
              </span>
              <h2 className="font-serif text-2xl font-bold text-stone-50">
                {account.name}
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-stone-400">
              Split 2-Column Gold Ledger · {account.area || "All Areas"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* FY Selector */}
          <select
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value)}
            className="rounded-xl border border-gold/30 bg-stone-950 px-3 py-1.5 text-xs text-gold cursor-pointer font-mono"
          >
            <option value="ALL">All Financial Years</option>
            {financialYears.map((fy) => (
              <option key={fy} value={fy}>{fy}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenAddTransaction}
            className="rounded-xl bg-gold px-3.5 py-2 text-xs font-semibold text-ink transition hover:bg-gold-soft"
          >
            + Add Transaction
          </button>
          <button
            type="button"
            onClick={onToggleScan}
            className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
              showScan
                ? "border-gold bg-gold text-ink"
                : "border-gold/40 bg-gold/10 text-gold hover:bg-gold hover:text-ink"
            }`}
          >
            {showScan ? "✕ Hide Scanner" : "📷 Upload Photos"}
          </button>
          <button
            type="button"
            onClick={onOpenBlockDate}
            className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
              blockDate
                ? "border-amber-400 bg-amber-950/60 text-amber-300"
                : "border-stone-700 bg-stone-900 text-stone-300 hover:border-gold"
            }`}
          >
            {blockDate ? `Block Date (${blockDate})` : "Block Date"}
          </button>
          <button
            type="button"
            onClick={onExportExcel}
            className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Embedded Photo DropZone Scanner directly inside Account View */}
      {showScan && (
        <div className="relative rounded-3xl border border-gold/40 bg-stone-900 p-5 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-gold/20 pb-3 mb-4">
            <span className="font-serif text-lg text-gold font-bold">
              📷 Uploading & Scanning Photos into: {account.code} - {account.name}
            </span>
            <button
              type="button"
              onClick={onToggleScan}
              className="rounded-full px-3 py-1 text-xs text-stone-400 hover:text-stone-100"
            >
              ✕ Close
            </button>
          </div>
          <DropZone busy={busy} onImagesReady={onScanImages} />
        </div>
      )}

      {/* Split 2-Column View matching Screenshot 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* LEFT COLUMN: RECEIPT / JAMA */}
        <div className="flex flex-col rounded-2xl border border-gold/25 bg-stone-900/80 overflow-hidden shadow-lg">
          <div className="bg-stone-900 border-b border-gold/20 px-4 py-2.5 flex items-center justify-between text-gold font-mono text-xs font-bold uppercase tracking-wider">
            <span>RECEIPT / JAMA</span>
            <span>CREDIT (INWARD)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead className="bg-stone-950 text-stone-300 border-b border-white/10">
                <tr>
                  <th className="px-3 py-2">Date &gt;</th>
                  <th className="px-3 py-2">Narration</th>
                  <th className="px-3 py-2 text-right">Gr. Wt.</th>
                  <th className="px-3 py-2 text-right">Net Wt.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {/* Bal. B/f (Brought Forward) Red Bar matching Screenshot 2 */}
                <tr className="bg-red-700 font-bold text-white">
                  <td className="px-3 py-2 text-yellow-200">Bal. B/f</td>
                  <td className="px-3 py-2">Opening Balance</td>
                  <td className="px-3 py-2 text-right">-</td>
                  <td className="px-3 py-2 text-right font-mono text-yellow-200">
                    {openingBalance.toFixed(3)}
                  </td>
                </tr>

                {/* Visible Jama Rows */}
                {Array.from({ length: maxRows }).map((_, idx) => {
                  const entry = jamaEntries[idx];
                  if (!entry) {
                    return (
                      <tr key={`j-empty-${idx}`} className="h-8">
                        <td className="px-3 py-1.5 text-transparent">-</td>
                        <td className="px-3 py-1.5"></td>
                        <td className="px-3 py-1.5"></td>
                        <td className="px-3 py-1.5"></td>
                      </tr>
                    );
                  }
                  return (
                    <tr
                      key={entry.id}
                      onClick={() => onEditTransaction(entry)}
                      className="cursor-pointer transition hover:bg-gold/15 group"
                    >
                      <td className="px-3 py-1.5 text-stone-300">{entry.date}</td>
                      <td className="px-3 py-1.5 text-stone-100 group-hover:text-gold">{entry.narration}</td>
                      <td className="px-3 py-1.5 text-right text-stone-400">{entry.grossWeight.toFixed(3)}</td>
                      <td className="px-3 py-1.5 text-right font-bold text-emerald-400">{entry.netWeight.toFixed(3)}</td>
                    </tr>
                  );
                })}

                {/* Green Total Bar matching Screenshot 2 */}
                <tr className="bg-emerald-950/90 font-bold text-emerald-300 border-t-2 border-emerald-500/50">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2 text-right">{totalJamaGr.toFixed(3)}</td>
                  <td className="px-3 py-2 text-right text-emerald-300 font-mono text-sm">{totalJamaNet.toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: ISSUE / NAME */}
        <div className="flex flex-col rounded-2xl border border-gold/25 bg-stone-900/80 overflow-hidden shadow-lg">
          <div className="bg-stone-900 border-b border-gold/20 px-4 py-2.5 flex items-center justify-between text-gold font-mono text-xs font-bold uppercase tracking-wider">
            <span>ISSUE / NAME</span>
            <span>DEBIT (OUTWARD)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead className="bg-stone-950 text-stone-300 border-b border-white/10">
                <tr>
                  <th className="px-3 py-2">Date &gt;</th>
                  <th className="px-3 py-2">Narration</th>
                  <th className="px-3 py-2 text-right">Gr. Wt.</th>
                  <th className="px-3 py-2 text-right">Net Wt.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {/* Visible Issue Rows */}
                {Array.from({ length: maxRows }).map((_, idx) => {
                  const entry = issueEntries[idx];
                  if (!entry) {
                    return (
                      <tr key={`i-empty-${idx}`} className="h-8">
                        <td className="px-3 py-1.5 text-transparent">-</td>
                        <td className="px-3 py-1.5"></td>
                        <td className="px-3 py-1.5"></td>
                        <td className="px-3 py-1.5"></td>
                      </tr>
                    );
                  }
                  return (
                    <tr
                      key={entry.id}
                      onClick={() => onEditTransaction(entry)}
                      className="cursor-pointer transition hover:bg-gold/15 group"
                    >
                      <td className="px-3 py-1.5 text-stone-300">{entry.date}</td>
                      <td className="px-3 py-1.5 text-stone-100 group-hover:text-gold">{entry.narration}</td>
                      <td className="px-3 py-1.5 text-right text-stone-400">{entry.grossWeight.toFixed(3)}</td>
                      <td className="px-3 py-1.5 text-right font-bold text-amber-400">{entry.netWeight.toFixed(3)}</td>
                    </tr>
                  );
                })}

                {/* Green Total Bar matching Screenshot 2 */}
                <tr className="bg-emerald-950/90 font-bold text-emerald-300 border-t-2 border-emerald-500/50">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2 text-right">{totalIssueGr.toFixed(3)}</td>
                  <td className="px-3 py-2 text-right text-emerald-300 font-mono text-sm">{totalIssueNet.toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Red Bal. C/f (Carried Forward) Footer Bar matching Screenshot 2 */}
      <div className="flex items-center justify-between rounded-2xl bg-red-800 px-6 py-3 font-mono font-bold text-white shadow-md">
        <span className="text-yellow-300 text-sm">Bal. C/f (Closing Net Balance)</span>
        <span className="text-xl text-yellow-200">{closingBalance.toFixed(3)} g</span>
      </div>
    </div>
  );
}
