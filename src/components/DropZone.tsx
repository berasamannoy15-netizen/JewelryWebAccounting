"use client";

import { useRef, useState } from "react";

export type StagedFile = {
  id: string;
  file: File;
  previewUrl: string;
};

type DropZoneProps = {
  busy: boolean;
  onImagesReady: (files: File[]) => void;
};

export function DropZone({ busy, onImagesReady }: DropZoneProps) {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dragging, setDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const streamRef = useRef<MediaStream | null>(null);

  function addFiles(newFiles: FileList | File[] | null) {
    if (!newFiles) return;
    const added: StagedFile[] = [];
    Array.from(newFiles).forEach((file) => {
      if (file.type.startsWith("image/")) {
        added.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
    });
    setStagedFiles((prev) => [...prev, ...added]);
  }

  function removeFile(id: string) {
    setStagedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  function moveFile(index: number, direction: -1 | 1) {
    setStagedFiles((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[nextIndex];
      updated[nextIndex] = temp;
      return updated;
    });
  }

  function clearAll() {
    stagedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setStagedFiles([]);
  }

  function handleScan() {
    if (stagedFiles.length === 0) return;
    onImagesReady(stagedFiles.map((item) => item.file));
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      cameraRef.current?.click();
      setCameraError(
        "Live camera was blocked. Your phone camera picker was opened instead.",
      );
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  function snapPhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const snappedFile = new File([blob], `ledger-page-${Date.now()}.jpg`, { type: "image/jpeg" });
        addFiles([snappedFile]);
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <section className="rounded-3xl border border-gold/25 bg-panel/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-8">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">
            Ledger Capture & Organizer
          </p>
          <h2 className="font-serif text-2xl text-stone-100 sm:text-3xl">
            Photograph & Organize Ledger Pages
          </h2>
        </div>
        <p className="max-w-sm text-sm text-stone-400">
          Upload one or multiple ledger photos. Reorder or remove pages before sending to Gemini AI.
        </p>
      </div>

      {stagedFiles.length === 0 ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          className={`relative min-h-[260px] overflow-hidden rounded-2xl border-2 border-dashed transition ${
            dragging
              ? "border-gold bg-gold/10"
              : "border-gold/30 bg-ink-soft/70 hover:border-gold/70"
          }`}
        >
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[260px] w-full flex-col items-center justify-center gap-4 px-6 py-10 text-center"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 text-2xl text-gold">
              +
            </span>
            <span className="font-serif text-xl text-stone-100">
              Drag & drop one or multiple ledger photos here
            </span>
            <span className="text-sm text-stone-400">
              or click to choose images from this device
            </span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gold/20 pb-3">
            <p className="text-xs font-medium uppercase tracking-wider text-gold">
              Staged Photos ({stagedFiles.length} page{stagedFiles.length > 1 ? "s" : ""})
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="rounded-lg border border-gold/30 px-3 py-1.5 text-xs text-stone-200 hover:border-gold hover:text-gold"
              >
                + Add More
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={busy}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/40"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {stagedFiles.map((item, index) => (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-gold/25 bg-stone-900/90"
              >
                <div className="relative h-44 w-full bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={`Ledger Page ${index + 1}`}
                    className="h-full w-full object-contain p-2"
                  />
                  <span className="absolute left-2 top-2 rounded-md bg-stone-950/80 px-2 py-0.5 text-[10px] font-semibold text-gold border border-gold/20">
                    Page {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    disabled={busy}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-900/80 text-xs font-bold text-white transition hover:bg-red-600"
                    title="Remove Photo"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center justify-between border-t border-gold/15 bg-panel/90 px-3 py-2">
                  <span className="truncate text-[11px] text-stone-400 max-w-[90px]">
                    {item.file.name}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0 || busy}
                      onClick={() => moveFile(index, -1)}
                      className="rounded border border-stone-700 px-1.5 py-0.5 text-[10px] text-stone-300 hover:border-gold hover:text-gold disabled:opacity-30"
                      title="Move Left"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      disabled={index === stagedFiles.length - 1 || busy}
                      onClick={() => moveFile(index, 1)}
                      className="rounded border border-stone-700 px-1.5 py-0.5 text-[10px] text-stone-300 hover:border-gold hover:text-gold disabled:opacity-30"
                      title="Move Right"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={handleScan}
              className="rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-ink shadow-lg transition hover:bg-gold-soft disabled:opacity-50"
            >
              {busy ? "Scanning Photos..." : `Scan ${stagedFiles.length} Photo${stagedFiles.length > 1 ? "s" : ""} with Gemini AI`}
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="flex-1 rounded-full border border-gold/30 px-5 py-3 text-sm font-medium text-stone-100 transition hover:border-gold hover:text-gold disabled:opacity-50"
        >
          Select Photos
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={startCamera}
          className="flex-1 rounded-full bg-gold/15 border border-gold/30 px-5 py-3 text-sm font-semibold text-gold transition hover:bg-gold/30 disabled:opacity-50"
        >
          Open Camera
        </button>
      </div>

      {cameraError ? (
        <p className="mt-3 text-sm text-amber-200/90">{cameraError}</p>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {cameraOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-gold/30 bg-ink p-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="max-h-[70vh] w-full rounded-2xl bg-black object-contain"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 rounded-full border border-stone-600 px-4 py-3 text-sm text-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={snapPhoto}
                className="flex-1 rounded-full bg-gold px-4 py-3 text-sm font-semibold text-ink"
              >
                Snap Photo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
