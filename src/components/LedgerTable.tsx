"use client";

import type { LedgerEntry } from "@/lib/types";

type LedgerTableProps = {
  entries: LedgerEntry[];
  onChange: (entries: LedgerEntry[]) => void;
  onClear: () => void;
};

export function LedgerTable({ entries }: LedgerTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-white/5 bg-panel/60 px-6 py-16 text-center text-stone-400">
        No entries
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-stone-900/60 p-4">
      <table className="w-full text-left text-xs font-mono text-stone-200">
        <thead>
          <tr className="border-b border-white/10 text-gold">
            <th className="py-2">Date</th>
            <th className="py-2">Narration</th>
            <th className="py-2">Type</th>
            <th className="py-2 text-right">Gross (g)</th>
            <th className="py-2 text-right">Melting %</th>
            <th className="py-2 text-right">Net Wt. (g)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {entries.map((item) => (
            <tr key={item.id}>
              <td className="py-2">{item.date}</td>
              <td className="py-2">{item.narration}</td>
              <td className="py-2">{item.transactionType}</td>
              <td className="py-2 text-right">{item.grossWeight.toFixed(3)}</td>
              <td className="py-2 text-right">{item.melting.toFixed(2)}</td>
              <td className="py-2 text-right font-bold text-gold">{item.netWeight.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
