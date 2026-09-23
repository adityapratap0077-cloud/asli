import type { Metadata } from "next";
import {
  Archivo_Black,
  Inter,
  Tiro_Devanagari_Hindi,
  Space_Mono,
} from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const devanagari = Tiro_Devanagari_Hindi({
  weight: "400",
  subsets: ["latin", "devanagari"],
  variable: "--font-devanagari",
});
const spacemono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-spacemono",
});

export const metadata: Metadata = {
  title: "ASLI — Wear the Real You | AI Custom Streetwear",
  description:
    "ASLI (असली): AI custom streetwear made in India. Design your own graphic with AI, preview it on the garment, and order your one-of-one piece.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${devanagari.variable} ${spacemono.variable} h-full antialiased`}
    >
      <body className="font-body flex min-h-full flex-col bg-[#0b0b0d] text-[#f2f2f0]">
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo-mark.png"
                alt="ASLI logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="font-display text-lg tracking-wide">
                {BRAND.name}
                <span className="font-devanagari ml-2 text-sm font-normal text-[#8f8f96]">
                  {BRAND.devanagari}
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-3 text-sm sm:gap-6">
              <Link href="/studio" className="hidden text-[#c9c9ce] hover:text-white min-[420px]:inline">
                Studio
              </Link>
              <Link href="/gallery" className="hidden text-[#c9c9ce] hover:text-white min-[420px]:inline">
                Gallery
              </Link>
              <Link
                href="/studio"
                className="btn-3d rounded-full px-4 py-2 text-sm font-bold"
              >
                Start designing
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-[#8f8f96] sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display tracking-wide text-[#c9c9ce]">
              {BRAND.name}{" "}
              <span className="font-devanagari font-normal text-[#8f8f96]">
                {BRAND.devanagari}
              </span>{" "}
              — {BRAND.tagline}
            </p>
            <div className="flex items-center gap-5">
              <Link href="/policies" className="hover:text-white">
                Shipping & returns
              </Link>
              <p>
                AI custom streetwear — payments verified by hand, printed on
                demand.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
