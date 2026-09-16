"use client";

import { useMemo, useState } from "react";
import type { Account, LedgerEntry } from "@/lib/types";

type AccountsDirectoryProps = {
  accounts: Account[];
  transactions: LedgerEntry[];
  onSelectAccount: (account: Account) => void;
  onScanForAccount: (account: Account) => void;
  onCreateAccount: (account: Omit<Account, "id" | "createdAt">) => void;
  onDeleteAccount: (id: string) => void;
};

export function AccountsDirectory({
  accounts,
  transactions,
  onSelectAccount,
  onScanForAccount,
  onCreateAccount,
  onDeleteAccount,
}: AccountsDirectoryProps) {
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newInitialBalance, setNewInitialBalance] = useState("0");

  // Compute Net Wt Balance for each account: initialBalance + Jama Net Wt - Issue Net Wt
  const accountsWithBalances = useMemo(() => {
    return accounts.map((acc) => {
      const accTxs = transactions.filter((t) => t.accountId === acc.id);
      let jamaNet = 0;
      let issueNet = 0;

      accTxs.forEach((t) => {
        if (t.transactionType === "Jama") {
          jamaNet += t.netWeight || 0;
        } else {
          issueNet += t.netWeight || 0;
        }
      });

      // Net Wt = initialBalance + Jama - Issue
      const netWtBalance = (acc.initialBalance || 0) + (jamaNet - issueNet);

      return {
        ...acc,
        jamaTotal: jamaNet,
        issueTotal: issueNet,
        netWtBalance: Math.round(netWtBalance * 1000) / 1000,
      };
    });
  }, [accounts, transactions]);

  // Filter accounts by search string
  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accountsWithBalances;
    const query = search.toLowerCase();
    return accountsWithBalances.filter(
      (acc) =>
        acc.code.toLowerCase().includes(query) ||
        acc.name.toLowerCase().includes(query) ||
        (acc.area && acc.area.toLowerCase().includes(query)),
    );
  }, [accountsWithBalances, search]);

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;
    onCreateAccount({
      code: newCode.trim().toUpperCase(),
      name: newName.trim().toUpperCase(),
      area: newArea.trim().toUpperCase(),
      initialBalance: parseFloat(newInitialBalance) || 0,
    });
    setNewCode("");
    setNewName("");
    setNewArea("");
    setNewInitialBalance("0");
    setShowCreateModal(false);
  }

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-gold/25 bg-panel/80 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
      {/* CASH BOOK Master Header matching Screenshot 1 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gold/20 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            CASH BOOK · ACCOUNTS DIRECTORY
          </p>
          <h2 className="font-serif text-3xl text-stone-50 sm:text-4xl">
            Account Ledger Directory
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Select an account to view or upload transactions, or create a new party account.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink shadow-lg transition hover:bg-gold-soft"
        >
          + Create New Account
        </button>
      </div>

      {/* Search Bar matching Screenshot 1 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Account Code or Name (e.g. MDN, DILIP BHAI, BIKAS)..."
            className="w-full rounded-2xl border border-gold/30 bg-stone-900/90 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 focus:border-gold focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-100"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Master Accounts Table matching Screenshot 1 */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-soft/40 shadow-inner">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-stone-900 font-mono text-xs uppercase tracking-wider text-gold border-b border-gold/20">
            <tr>
              <th className="px-4 py-3.5">A/c Code &gt;</th>
              <th className="px-4 py-3.5">A/c Name &gt;</th>
              <th className="px-4 py-3.5">Area</th>
              <th className="px-4 py-3.5 text-right">Net Wt. (g)</th>
              <th className="px-4 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {filteredAccounts.map((acc) => {
              const isNegative = acc.netWtBalance < 0;
              return (
                <tr
                  key={acc.id}
                  onClick={() => onSelectAccount(acc)}
                  className="cursor-pointer transition hover:bg-gold/10 group"
                >
                  <td className="px-4 py-3.5 font-bold text-gold">
                    {acc.code}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-stone-100 group-hover:text-gold">
                    {acc.name}
                  </td>
                  <td className="px-4 py-3.5 text-stone-400">
                    {acc.area || "-"}
                  </td>
                  <td
                    className={`px-4 py-3.5 text-right font-bold text-base ${
                      isNegative ? "text-amber-400" : acc.netWtBalance > 0 ? "text-emerald-400" : "text-stone-400"
                    }`}
                  >
                    {acc.netWtBalance.toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectAccount(acc)}
                        className="rounded-lg bg-gold/20 px-3 py-1 text-xs font-semibold text-gold transition hover:bg-gold hover:text-ink"
                      >
                        Open Ledger
                      </button>
                      <button
                        type="button"
                        onClick={() => onScanForAccount(acc)}
                        className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold transition hover:bg-gold hover:text-ink"
                      >
                        📷 Upload Photos
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAccount(acc.id)}
                        className="rounded-lg px-2 py-1 text-xs text-stone-500 hover:bg-red-950/40 hover:text-red-300"
                        title="Delete Account"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gold/30 bg-stone-900 p-6 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between border-b border-gold/20 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                  New Master Account
                </p>
                <h3 className="font-serif text-2xl text-stone-50">Create Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-2 text-stone-400 hover:bg-stone-800 hover:text-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-400">A/c Code (e.g. MDN, DB, BK)</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. MDN"
                  required
                  className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950 px-3.5 py-2.5 text-sm uppercase text-stone-100 font-mono focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400">A/c Name (e.g. MDN JEWELS)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. MDN JEWELS"
                  required
                  className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950 px-3.5 py-2.5 text-sm uppercase text-stone-100 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400">Area / Location (Optional)</label>
                <input
                  type="text"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="e.g. SURAT or MUMBAI"
                  className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950 px-3.5 py-2.5 text-sm text-stone-100 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400">Initial Opening Balance (Fine Wt. g)</label>
                <input
                  type="number"
                  step="any"
                  value={newInitialBalance}
                  onChange={(e) => setNewInitialBalance(e.target.value)}
                  placeholder="0.000"
                  className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950 px-3.5 py-2.5 text-sm font-mono text-stone-100 focus:border-gold focus:outline-none"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full border border-stone-700 px-5 py-2.5 text-xs font-semibold text-stone-300 hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gold px-6 py-2.5 text-xs font-semibold text-ink hover:bg-gold-soft"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
