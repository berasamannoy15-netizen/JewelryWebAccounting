"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4">
      {/* Decorative background rings */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/5" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/10" />
        <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/15" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        {/* Logo / Brand */}
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-gold">
            Gold Showroom · Goldsmith Accounts
          </p>
          <h1 className="mt-3 font-serif text-5xl text-stone-50">
            Ledger Atelier
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">
            Sign in to access your jewellery ledger, manage accounts, and track Jama &amp; Issue transactions.
          </p>
        </div>

        {/* Sign-in Card */}
        <div className="w-full rounded-2xl border border-gold/20 bg-panel p-8 shadow-2xl">
          <p className="mb-6 text-center text-sm font-medium text-stone-300">
            Sign in to continue
          </p>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-700 bg-stone-900 px-5 py-3.5 text-sm font-medium text-stone-100 transition hover:border-gold/40 hover:bg-stone-800 hover:text-gold active:scale-[0.98]"
          >
            {/* Google SVG Icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-stone-500">
            Secure authentication via Google OAuth 2.0.
            <br />
            Your ledger data stays in your browser.
          </p>
        </div>

        <p className="text-center text-[11px] text-stone-600">
          © {new Date().getFullYear()} Ledger Atelier
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
