"use client";

import { useState } from "react";

type BlockDateModalProps = {
  isOpen: boolean;
  currentBlockDate: string | null;
  onSetBlockDate: (date: string | null) => void;
  onClose: () => void;
};

export function BlockDateModal({
  isOpen,
  currentBlockDate,
  onSetBlockDate,
  onClose,
}: BlockDateModalProps) {
  const [blockDateInput, setBlockDateInput] = useState(currentBlockDate || "02-08-2026");

  if (!isOpen) return null;

  function handleSave() {
    onSetBlockDate(blockDateInput.trim() || null);
    onClose();
  }

  function handleClear() {
    onSetBlockDate(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-gold/30 bg-stone-900 p-6 shadow-2xl text-stone-100">
        <div className="flex items-center justify-between border-b border-gold/20 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">
              Block Date Configuration
            </p>
            <h3 className="font-serif text-2xl text-stone-50">
              Set Cutoff / Block Date
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

        <div className="mt-4 flex flex-col gap-4 text-sm">
          <p className="text-xs text-stone-300 leading-relaxed">
            Transactions prior to the Block Date will be hidden from the detailed view and consolidated into the opening balance (<span className="font-bold text-red-400">Bal. B/f</span>). Transactions remain safely stored in memory and can be unblocked anytime.
          </p>

          <div>
            <label className="block text-xs font-medium text-stone-400">Block Cutoff Date</label>
            <input
              type="text"
              value={blockDateInput}
              onChange={(e) => setBlockDateInput(e.target.value)}
              placeholder="DD-MM-YYYY (e.g. 02-08-2026)"
              className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950 px-3.5 py-2.5 text-sm text-stone-100 focus:border-gold focus:outline-none font-mono"
            />
          </div>

          {currentBlockDate && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
              Current active block date: <span className="font-bold font-mono text-amber-400">{currentBlockDate}</span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            {currentBlockDate ? (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full border border-red-500/40 bg-red-950/30 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/50"
              >
                Unblock Date
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-stone-700 px-4 py-2 text-xs font-semibold text-stone-300 hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full bg-gold px-5 py-2 text-xs font-semibold text-ink hover:bg-gold-soft"
              >
                Apply Block Date
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
