"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AccountsDirectory } from "@/components/AccountsDirectory";
import { AccountLedgerView } from "@/components/AccountLedgerView";
import { TransactionModal } from "@/components/TransactionModal";
import { BlockDateModal } from "@/components/BlockDateModal";
import {
  calculateEntry,
  INITIAL_SAMPLE_ACCOUNTS,
  INITIAL_SAMPLE_TRANSACTIONS,
  type Account,
  type LedgerEntry,
  type ScanResponse,
} from "@/lib/types";
import { buildAccountLedgerWorkbook, workbookToBuffer } from "@/lib/spreadsheet";

function downloadBase64File(fileName: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function Dashboard() {
  const { data: session } = useSession();
  const user = session?.user;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [blockDate, setBlockDate] = useState<string | null>("02-08-2026");

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [showScan, setShowScan] = useState(false);
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showBlockDateModal, setShowBlockDateModal] = useState(false);
  const [editingTx, setEditingTx] = useState<LedgerEntry | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedAccounts = localStorage.getItem("jewelry_accounts");
      if (savedAccounts) {
        setAccounts(JSON.parse(savedAccounts));
      } else {
        setAccounts(INITIAL_SAMPLE_ACCOUNTS);
      }

      const savedTxs = localStorage.getItem("jewelry_transactions");
      if (savedTxs) {
        setTransactions(JSON.parse(savedTxs));
      } else {
        setTransactions(INITIAL_SAMPLE_TRANSACTIONS);
      }

      const savedKey = localStorage.getItem("gemini_api_key");
      if (savedKey) setApiKey(savedKey);
    } catch {
      setAccounts(INITIAL_SAMPLE_ACCOUNTS);
      setTransactions(INITIAL_SAMPLE_TRANSACTIONS);
    }
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    if (accounts.length > 0) {
      localStorage.setItem("jewelry_accounts", JSON.stringify(accounts));
    }
  }, [accounts]);

  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem("jewelry_transactions", JSON.stringify(transactions));
    }
  }, [transactions]);

  function handleApiKeyChange(newKey: string) {
    setApiKey(newKey);
    if (newKey.trim()) {
      localStorage.setItem("gemini_api_key", newKey.trim());
    } else {
      localStorage.removeItem("gemini_api_key");
    }
  }

  const activeAccount = useMemo(() => {
    return accounts.find((a) => a.id === activeAccountId) || null;
  }, [accounts, activeAccountId]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  function handleCreateAccount(data: Omit<Account, "id" | "createdAt">) {
    const newAcc: Account = {
      ...data,
      id: `acc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAccounts((prev) => [...prev, newAcc]);
    setActiveAccountId(newAcc.id);
  }

  function handleDeleteAccount(id: string) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setTransactions((prev) => prev.filter((t) => t.accountId !== id));
    if (activeAccountId === id) setActiveAccountId(null);
  }

  function handleSaveTransaction(entryData: Partial<LedgerEntry>) {
    if (!activeAccountId) return;

    if (entryData.id) {
      // Edit existing transaction
      setTransactions((prev) =>
        prev.map((t, idx) => (t.id === entryData.id ? calculateEntry(entryData, activeAccountId, idx) : t)),
      );
    } else {
      // Add new transaction
      const newTx = calculateEntry(entryData, activeAccountId, transactions.length);
      setTransactions((prev) => [...prev, newTx]);
    }
    setEditingTx(null);
  }

  function handleDeleteTransaction(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setEditingTx(null);
  }

  async function scanImagesForActiveAccount(files: File[]) {
    if (!activeAccountId || files.length === 0) return;
    setError("");
    setBusy(true);
    setStatus(`Scanning ${files.length} ledger photo${files.length > 1 ? "s" : ""} into ${activeAccount?.name}...`);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });

      const headers: Record<string, string> = {};
      if (apiKey.trim()) {
        headers["x-gemini-api-key"] = apiKey.trim();
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        headers,
        body: formData,
      });
      const payload = (await response.json()) as ScanResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Scan failed.");
      }

      const extracted = payload.entries ?? [];
      const newEntries = extracted.map((item, idx) =>
        calculateEntry(item, activeAccountId, transactions.length + idx),
      );

      // Stack newly scanned entries onto active account
      setTransactions((prev) => [...prev, ...newEntries]);
      setStatus(
        newEntries.length
          ? `Extracted ${newEntries.length} transaction${newEntries.length === 1 ? "" : "s"} into ${activeAccount?.name}. Added to Jama & Issue ledger!`
          : "Scan finished, but no rows were found. Try a clearer photo.",
      );
      setShowScan(false);
    } catch (scanErr) {
      setError(
        scanErr instanceof Error ? scanErr.message : "Could not scan photos.",
      );
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  function exportActiveAccountExcel() {
    if (!activeAccount) return;
    try {
      const accountTxs = transactions.filter((t) => t.accountId === activeAccount.id);
      const workbook = buildAccountLedgerWorkbook(activeAccount, accountTxs);
      const buffer = workbookToBuffer(workbook);
      const base64 = buffer.toString("base64");
      downloadBase64File(`${activeAccount.code}_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`, base64);
    } catch (expErr) {
      setError("Failed to export Excel file.");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      {/* Header */}
      <header className="flex flex-col gap-6 border-b border-gold/20 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-gold">
            Gold showroom · Goldsmith accounts
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-stone-50 sm:text-5xl">
            Ledger Atelier
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400 sm:text-base">
            Manage customer & artisan accounts. View 2-column split Jama & Issue ledgers, snap photo transactions, apply Block Dates, and export Financial Year Excel reports.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:min-w-[280px]">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gold/20 bg-panel px-4 py-3">
              <p className="text-[11px] uppercase tracking-widest text-stone-500">
                Today
              </p>
              <p className="mt-1 text-sm text-stone-200">{today}</p>
            </div>
            <div className="rounded-2xl border border-gold/20 bg-panel px-4 py-3">
              <p className="text-[11px] uppercase tracking-widest text-stone-500">
                Accounts
              </p>
              <p className="mt-1 font-serif text-2xl text-gold">{accounts.length}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center justify-between rounded-xl border border-gold/20 bg-panel/50 px-4 py-2.5 text-xs font-medium text-stone-300 transition hover:bg-gold/10 hover:text-gold"
          >
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${apiKey ? "bg-emerald-400" : "bg-amber-400"}`} />
              Gemini API Key Settings
            </span>
            <span>{showSettings ? "▲ Hide" : "▼ Change Key"}</span>
          </button>

          {/* Google User Info + Sign Out */}
          {user && (
            <div className="flex items-center justify-between rounded-xl border border-gold/20 bg-panel/50 px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name ?? "User"}
                    width={28}
                    height={28}
                    className="rounded-full ring-1 ring-gold/30"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                    {user.name?.[0] ?? "U"}
                  </div>
                )}
                <div className="leading-tight">
                  <p className="text-[11px] font-medium text-stone-200">{user.name}</p>
                  <p className="text-[10px] text-stone-500">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-[10px] uppercase tracking-wider text-stone-500 transition hover:text-red-400"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Gemini API Key Panel */}
      {showSettings && (
        <div className="rounded-2xl border border-gold/30 bg-panel p-5 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label htmlFor="gemini-key-input" className="font-serif text-base font-medium text-stone-100">
                Gemini API Key
              </label>
              <p className="text-xs text-stone-400">
                Enter your key below to use it directly in the browser, or leave empty to default to server environment variable.
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <input
                  id="gemini-key-input"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="Paste your AIzaSy... API key"
                  className="w-full rounded-xl border border-gold/20 bg-stone-900/90 px-3.5 py-2 text-xs text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-gold hover:text-gold-soft"
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
              </div>
              {apiKey && (
                <button
                  type="button"
                  onClick={() => handleApiKeyChange("")}
                  className="rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-900/40"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status & Error Notification Bar */}
      {(status || error) && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm ${
            error
              ? "border-red-400/30 bg-red-950/40 text-red-100"
              : "border-gold/20 bg-gold/5 text-stone-200"
          }`}
        >
          {error || status}
        </div>
      )}

      {/* MAIN VIEW CONTROLLER */}
      {!activeAccount ? (
        /* View 1: Master Cash Book Account Directory */
        <AccountsDirectory
          accounts={accounts}
          transactions={transactions}
          onSelectAccount={(acc) => setActiveAccountId(acc.id)}
          onScanForAccount={(acc) => {
            setActiveAccountId(acc.id);
            setShowScan(true);
          }}
          onCreateAccount={handleCreateAccount}
          onDeleteAccount={handleDeleteAccount}
        />
      ) : (
        /* View 2: Split 2-Column Jama vs Issue Ledger View */
        <AccountLedgerView
          account={activeAccount}
          transactions={transactions}
          blockDate={blockDate}
          showScan={showScan}
          busy={busy}
          onBack={() => {
            setActiveAccountId(null);
            setShowScan(false);
          }}
          onToggleScan={() => setShowScan(!showScan)}
          onScanImages={scanImagesForActiveAccount}
          onOpenAddTransaction={() => {
            setEditingTx(null);
            setShowAddTxModal(true);
          }}
          onEditTransaction={(tx) => {
            setEditingTx(tx);
            setShowAddTxModal(true);
          }}
          onOpenBlockDate={() => setShowBlockDateModal(true)}
          onExportExcel={exportActiveAccountExcel}
        />
      )}

      {/* Transaction Modal (Add or Edit) */}
      {showAddTxModal && activeAccountId && (
        <TransactionModal
          isOpen={showAddTxModal}
          initialData={editingTx}
          accountId={activeAccountId}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
          onClose={() => {
            setShowAddTxModal(false);
            setEditingTx(null);
          }}
        />
      )}

      {/* Block Date Modal */}
      {showBlockDateModal && (
        <BlockDateModal
          isOpen={showBlockDateModal}
          currentBlockDate={blockDate}
          onSetBlockDate={(date) => setBlockDate(date)}
          onClose={() => setShowBlockDateModal(false)}
        />
      )}
    </div>
  );
}
