"use client";

import { useMemo, useState } from "react";
import { calculateEntry, type LedgerEntry, type TransactionType } from "@/lib/types";

type LedgerTableProps = {
  entries: LedgerEntry[];
  onChange: (entries: LedgerEntry[]) => void;
  onClear: () => void;
};

export function LedgerTable({ entries, onChange, onClear }: LedgerTableProps) {
  const [selectedFY, setSelectedFY] = useState<string>("ALL");

  // Get unique financial years present in entries
  const financialYears = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.financialYear) set.add(e.financialYear);
    });
    return Array.from(set).sort().reverse();
  }, [entries]);

  // Filter entries by selected FY
  const filteredEntries = useMemo(() => {
    if (selectedFY === "ALL") return entries;
    return entries.filter((e) => e.financialYear === selectedFY);
  }, [entries, selectedFY]);

  // Calculate total Jama, Issue, and Net Balance for filtered entries
  const totals = useMemo(() => {
    let jamaTotal = 0;
    let issueTotal = 0;
    filteredEntries.forEach((e) => {
      const jama = parseFloat(e.jamaWeight || "0") || 0;
      const issue = parseFloat(e.issueWeight || "0") || 0;
      jamaTotal += jama;
      issueTotal += issue;
    });
    return {
      jama: jamaTotal.toFixed(2),
      issue: issueTotal.toFixed(2),
      net: (jamaTotal - issueTotal).toFixed(2),
    };
  }, [filteredEntries]);

  function updateCell(id: string, key: keyof LedgerEntry, value: string) {
    onChange(
      entries.map((entry, idx) => {
        if (entry.id !== id) return entry;
        const updatedPartial = { ...entry, [key]: value };
        // Recalculate formulas (fine weight, Jama/Issue weights, FY)
        return calculateEntry(updatedPartial, idx);
      }),
    );
  }

  function addEmptyRow() {
    const newRow = calculateEntry(
      {
        id: `row-${Date.now()}`,
        date: new Date().toLocaleDateString("en-GB"),
        customerName: "",
        transactionType: "Jama",
        metalType: "Gold",
        purity: "22k",
        grossWeight: "0.00",
        melting: "100.00",
        wastageGhat: "0.00",
        notes: "",
      },
      entries.length,
    );
    onChange([...entries, newRow]);
  }

  function removeRow(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-white/5 bg-panel/60 px-6 py-16 text-center">
        <p className="font-serif text-2xl text-stone-200">No transactions recorded yet</p>
        <p className="mt-2 text-sm text-stone-400">
          Upload and scan handwritten ledger photos above. The extracted Jama & Issue rows will stack here.
        </p>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6 overflow-hidden rounded-3xl border border-gold/20 bg-panel/80 p-5 sm:p-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gold/15 pb-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">
            Transaction Ledger
          </p>
          <h2 className="font-serif text-2xl text-stone-100 sm:text-3xl">
            Extracted Ledger Table ({entries.length} total rows)
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Edit cells to update formulas (`Gross × Melting % = Fine Wt`). All entries are organized by Financial Year.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Financial Year Filter */}
          <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-stone-900/90 px-3 py-1.5 text-xs text-stone-200">
            <span className="text-gold font-medium">Financial Year:</span>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="bg-transparent text-stone-100 outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-stone-900 text-stone-100">All FY ({entries.length})</option>
              {financialYears.map((fy) => (
                <option key={fy} value={fy} className="bg-stone-900 text-stone-100">
                  {fy}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={addEmptyRow}
            className="rounded-xl border border-gold/30 bg-gold/10 px-3.5 py-2 text-xs font-medium text-gold transition hover:bg-gold hover:text-ink"
          >
            + Add Row
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-red-500/30 bg-red-950/30 px-3.5 py-2 text-xs font-medium text-red-300 transition hover:bg-red-900/50"
          >
            Clear Table
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Total Jama / Receipt (Fine Gold)
          </p>
          <p className="mt-1 font-serif text-2xl text-stone-100">{totals.jama} g</p>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
            Total Issue / Khata (Fine Gold)
          </p>
          <p className="mt-1 font-serif text-2xl text-stone-100">{totals.issue} g</p>
        </div>
        <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
            Net Fine Weight Balance (Jama - Issue)
          </p>
          <p className="mt-1 font-serif text-2xl text-gold">{totals.net} g</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-ink-soft/40">
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead className="bg-stone-900 text-gold text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Customer / Artisan</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Metal</th>
              <th className="px-3 py-3 text-right">Gross (g)</th>
              <th className="px-3 py-3 text-right">Melting %</th>
              <th className="px-3 py-3 text-right">Wastage (g)</th>
              <th className="px-3 py-3 text-right">Fine Wt (g)</th>
              <th className="px-3 py-3 text-right text-emerald-400">Jama (g)</th>
              <th className="px-3 py-3 text-right text-amber-400">Issue (g)</th>
              <th className="px-3 py-3">FY</th>
              <th className="px-3 py-3">Notes</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="transition hover:bg-white/5">
                {/* Date */}
                <td className="px-2 py-2">
                  <input
                    value={entry.date}
                    onChange={(e) => updateCell(entry.id, "date", e.target.value)}
                    className="w-24 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-stone-100 focus:border-gold/50 focus:bg-stone-900 focus:outline-none"
                  />
                </td>

                {/* Customer/Artisan */}
                <td className="px-2 py-2">
                  <input
                    value={entry.customerName}
                    onChange={(e) => updateCell(entry.id, "customerName", e.target.value)}
                    className="w-36 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-stone-100 focus:border-gold/50 focus:bg-stone-900 focus:outline-none"
                  />
                </td>

                {/* Type (Jama / Issue) */}
                <td className="px-2 py-2">
                  <select
                    value={entry.transactionType}
                    onChange={(e) => updateCell(entry.id, "transactionType", e.target.value as TransactionType)}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-semibold cursor-pointer focus:outline-none ${
                      entry.transactionType === "Jama"
                        ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                        : "border-amber-500/40 bg-amber-950/40 text-amber-300"
                    }`}
                  >
                    <option value="Jama" className="bg-stone-900 text-emerald-400">Jama (Receipt)</option>
                    <option value="Issue" className="bg-stone-900 text-amber-400">Issue (Khata)</option>
                  </select>
                </td>

                {/* Metal */}
                <td className="px-2 py-2">
                  <input
                    value={entry.metalType}
                    onChange={(e) => updateCell(entry.id, "metalType", e.target.value)}
                    className="w-16 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-stone-100 focus:border-gold/50 focus:bg-stone-900 focus:outline-none"
                  />
                </td>

                {/* Gross Weight */}
                <td className="px-2 py-2 text-right">
                  <input
                    value={entry.grossWeight}
                    onChange={(e) => updateCell(entry.id, "grossWeight", e.target.value)}
                    className="w-20 text-right rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-stone-100 focus:border-gold/50 focus:bg-stone-900 focus:outline-none font-mono"
                  />
                </td>

                {/* Melting % */}
                <td className="px-2 py-2 text-right">
                  <input
                    value={entry.melting}
                    onChange={(e) => updateCell(entry.id, "melting", e.target.value)}
                    className="w-20 text-right rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-stone-100 focus:border-gold/50 focus:bg-stone-900 focus:outline-none font-mono"
                  />
                </td>

                {/* Wastage */}
                <td className="px-2 py-2 text-right">
                  <input
                    value={entry.wastageGhat}
                    onChange={(e) => updateCell(entry.id, "wastageGhat", e.target.value)}
                    className="w-16 text-right rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-stone-400 focus:border-gold/50 focus:bg-stone-900 focus:outline-none font-mono"
                  />
                </td>

                {/* Fine Weight (Calculated) */}
                <td className="px-2 py-2 text-right font-mono font-semibold text-gold">
                  {entry.fineWeight}
                </td>

                {/* Jama (g) */}
                <td className="px-2 py-2 text-right font-mono font-semibold text-emerald-400">
                  {entry.transactionType === "Jama" ? entry.jamaWeight : "0.00"}
                </td>

                {/* Issue (g) */}
                <td className="px-2 py-2 text-right font-mono font-semibold text-amber-400">
                  {entry.transactionType === "Issue" ? entry.issueWeight : "0.00"}
                </td>

                {/* Financial Year */}
                <td className="px-2 py-2 text-xs text-stone-400 font-mono">
                  {entry.financialYear}
                </td>

                {/* Notes */}
                <td className="px-2 py-2">
                  <input
                    value={entry.notes}
                    onChange={(e) => updateCell(entry.id, "notes", e.target.value)}
                    className="w-28 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-stone-300 focus:border-gold/50 focus:bg-stone-900 focus:outline-none"
                  />
                </td>

                {/* Remove Row */}
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(entry.id)}
                    className="rounded-lg px-2.5 py-1 text-xs text-stone-500 transition hover:bg-red-950/40 hover:text-red-300"
                    title="Delete row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
