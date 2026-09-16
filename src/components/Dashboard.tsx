"use client";

import { useEffect, useMemo, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { LedgerTable } from "@/components/LedgerTable";
import type { ExportResponse, LedgerEntry, ScanResponse } from "@/lib/types";

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
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  function handleApiKeyChange(newKey: string) {
    setApiKey(newKey);
    if (newKey.trim()) {
      localStorage.setItem("gemini_api_key", newKey.trim());
    } else {
      localStorage.removeItem("gemini_api_key");
    }
  }

  const rowCount = entries.length;
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

  async function scanImages(files: File[]) {
    if (files.length === 0) return;
    setError("");
    setDriveLink("");
    setBusy(true);
    setStatus(`Sending ${files.length} ledger photo${files.length > 1 ? "s" : ""} to Gemini AI...`);

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

      const newEntries = payload.entries ?? [];
      // Stack new entries onto existing entries
      setEntries((prev) => [...prev, ...newEntries]);
      setSummary(payload.summary ?? "");
      setStatus(
        newEntries.length
          ? `Extracted ${newEntries.length} transaction ${newEntries.length === 1 ? "row" : "rows"} from ${files.length} page${files.length > 1 ? "s" : ""}. Staked onto table below.`
          : "Scan finished, but no rows were found. Try a clearer photo.",
      );
    } catch (scanError) {
      setError(
        scanError instanceof Error
          ? scanError.message
          : "Could not read photo(s).",
      );
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function exportSpreadsheet() {
    setError("");
    setExporting(true);
    setStatus("Building multi-tab Financial Year Excel workbook and syncing...");
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      const payload = (await response.json()) as ExportResponse & {
        error?: string;
        fileBase64?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Export failed.");
      }
      if (payload.fileBase64) {
        downloadBase64File(payload.fileName, payload.fileBase64);
      }
      setDriveLink(payload.drive.webViewLink ?? "");
      setStatus(payload.drive.message);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Could not export the spreadsheet.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-6 border-b border-gold/20 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-gold">
            Gold showroom · Goldsmith accounts
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-stone-50 sm:text-5xl">
            Ledger Atelier
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400 sm:text-base">
            Photograph handwritten khata pages. Organise multi-page scans, stack Jama & Issue transactions, compute fine weights (`Gross × Melting %`), and export Financial Year Excel workbooks.
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
                Total Rows
              </p>
              <p className="mt-1 font-serif text-2xl text-gold">{rowCount}</p>
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
        </div>
      </header>

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

      <DropZone busy={busy} onImagesReady={scanImages} />

      {(status || error) && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm ${
            error
              ? "border-red-400/30 bg-red-950/40 text-red-100"
              : "border-gold/20 bg-gold/5 text-stone-200"
          }`}
        >
          {error || status}
          {summary && !error ? (
            <p className="mt-2 text-stone-400">{summary}</p>
          ) : null}
          {driveLink ? (
            <a
              href={driveLink}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-gold underline"
            >
              Open in Google Drive
            </a>
          ) : null}
        </div>
      )}

      <LedgerTable entries={entries} onChange={setEntries} onClear={() => setEntries([])} />

      <div className="flex flex-col gap-3 rounded-3xl border border-gold/20 bg-panel/80 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-xl text-stone-100">Financial Year Excel Export & Cloud Sync</p>
          <p className="text-sm text-stone-400">
            Generates a formatted multi-sheet .xlsx workbook (separate tabs for each Financial Year + Combined Ledger) with Jama & Issue fine weight totals.
          </p>
        </div>
        <button
          type="button"
          disabled={exporting || entries.length === 0}
          onClick={exportSpreadsheet}
          className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {exporting ? "Exporting Excel..." : "Export Excel & Sync"}
        </button>
      </div>
    </div>
  );
}
