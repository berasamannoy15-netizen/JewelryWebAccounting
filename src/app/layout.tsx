import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ledger Atelier | Gold Showroom Accounting",
  description:
    "Photograph handwritten jewelry ledgers, extract goldsmith entries with Gemini Vision, and sync Excel sheets to Google Drive.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ink text-stone-100">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
