"use client";

import { useEffect, useState } from "react";
import { computeNetWeight, getFinancialYear, type LedgerEntry, type TransactionType } from "@/lib/types";

type TransactionModalProps = {
  isOpen: boolean;
  initialData?: Partial<LedgerEntry> | null;
  accountId: string;
  onSave: (entry: Partial<LedgerEntry>) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
};

export function TransactionModal({
  isOpen,
  initialData,
  accountId,
  onSave,
  onClose,
  onDelete,
}: TransactionModalProps) {
  const [date, setDate] = useState("");
  const [narration, setNarration] = useState("");
  const [transactionType, setTransactionType] = useState<TransactionType>("Jama");
  const [metalType, setMetalType] = useState("Gold");
  const [grossWeight, setGrossWeight] = useState("");
  const [melting, setMelting] = useState("");
  const [wastageGhat, setWastageGhat] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date || new Date().toLocaleDateString("en-GB"));
      setNarration(initialData.narration || "");
      setTransactionType(initialData.transactionType || "Jama");
      setMetalType(initialData.metalType || "Gold");
      setGrossWeight(initialData.grossWeight ? String(initialData.grossWeight) : "");
      setMelting(initialData.melting ? String(initialData.melting) : "");
      setWastageGhat(initialData.wastageGhat ? String(initialData.wastageGhat) : "");
      setNotes(initialData.notes || "");
    } else {
      setDate(new Date().toLocaleDateString("en-GB"));
      setNarration("");
      setTransactionType("Jama");
      setMetalType("Gold");
      setGrossWeight("");
      setMelting("99.50");
      setWastageGhat("0");
      setNotes("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const grossNum = parseFloat(grossWeight) || 0;
  const meltNum = parseFloat(melting) || 0;
  const computedNet = computeNetWeight(grossNum, meltNum);
  const fy = getFinancialYear(date);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: initialData?.id,
      accountId,
      date: date || new Date().toLocaleDateString("en-GB"),
      narration: narration || "Transaction",
      transactionType,
      metalType,
      grossWeight: grossNum,
      melting: meltNum,
      wastageGhat: parseFloat(wastageGhat) || 0,
      netWeight: computedNet,
      financialYear: fy,
      notes,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-gold/30 bg-stone-900 p-6 shadow-2xl text-stone-100">
        <div className="flex items-center justify-between border-b border-gold/20 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">
              {initialData?.id ? "Edit Transaction Entry" : "New Transaction Entry"}
            </p>
            <h3 className="font-serif text-2xl text-stone-50">
              {initialData?.id ? `Edit ${initialData.narration}` : "Add Manual Transaction"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-800 hover:text-stone-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* Jama vs Issue Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTransactionType("Jama")}
              className={`rounded-2xl border py-3 text-sm font-semibold transition ${
                transactionType === "Jama"
                  ? "border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-md"
                  : "border-stone-800 bg-stone-950/40 text-stone-400 hover:border-stone-700"
              }`}
            >
              RECEIPT / JAMA (Inward)
            </button>
            <button
              type="button"
              onClick={() => setTransactionType("Issue")}
              className={`rounded-2xl border py-3 text-sm font-semibold transition ${
                transactionType === "Issue"
                  ? "border-amber-500 bg-amber-950/60 text-amber-300 shadow-md"
                  : "border-stone-800 bg-stone-950/40 text-stone-400 hover:border-stone-700"
              }`}
            >
              ISSUE / NAME (Outward)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-400">Date</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="DD-MM-YY"
                required
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950 px-3.5 py-2 text-sm text-stone-100 focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400">Financial Year</label>
              <input
                type="text"
                value={fy}
                disabled
                className="mt-1 w-full rounded-xl border border-stone-800 bg-stone-950/50 px-3.5 py-2 text-sm font-mono text-gold/80 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400">Narration / Item Description</label>
            <input
              type="text"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="e.g. S/1 MDN SONA or S/3 MDN VATI"
              required
              className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950 px-3.5 py-2 text-sm text-stone-100 focus:border-gold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-400">Gross Wt (g)</label>
              <input
                type="number"
                step="any"
                value={grossWeight}
                onChange={(e) => setGrossWeight(e.target.value)}
                placeholder="100.00"
                required
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950 px-3.5 py-2 text-sm text-stone-100 font-mono focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400">Melting %</label>
              <input
                type="number"
                step="any"
                value={melting}
                onChange={(e) => setMelting(e.target.value)}
                placeholder="99.50"
                required
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950 px-3.5 py-2 text-sm text-stone-100 font-mono focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400">Wastage %</label>
              <input
                type="number"
                step="any"
                value={wastageGhat}
                onChange={(e) => setWastageGhat(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950 px-3.5 py-2 text-sm text-stone-100 font-mono focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Computed Net Weight Preview */}
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-300">Calculated Net Fine Weight:</span>
            <span className="font-serif text-xl font-bold text-gold font-mono">{computedNet.toFixed(3)} g</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400">Notes / Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional remarks"
              className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950 px-3.5 py-2 text-sm text-stone-100 focus:border-gold focus:outline-none"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            {initialData?.id && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (initialData.id) onDelete(initialData.id);
                  onClose();
                }}
                className="rounded-full border border-red-500/40 bg-red-950/30 px-5 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-900/50"
              >
                Delete Row
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-stone-700 px-5 py-2.5 text-xs font-semibold text-stone-300 hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-gold px-6 py-2.5 text-xs font-semibold text-ink hover:bg-gold-soft"
              >
                Save Transaction
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
