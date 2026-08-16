import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";
import { BackgroundLayer } from "@/components/BackgroundLayer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Live Crypto — Non-Custodial Web3 Donation Gateway for Streamers",
  description: "Accept crypto donations in real-time with sub-second OBS overlays, multi-chain support (Solana, SUI, Polygon, Base, Ethereum, Bitcoin Lightning), and zero middleman fees.",
  keywords: ["Crypto Donations", "OBS Overlay", "Streamer Crypto", "Web3 Live Streaming", "Solana Pay", "SUI Donation", "Twitch Crypto", "YouTube Streamer"],
  icons: {
    icon: '/brand/logo-png.png',
    apple: '/brand/logo-png.png',
  },
  openGraph: {
    title: "Live Crypto — Decentralized Streamer Donations",
    description: "Receive instant P2P crypto payments directly to your self-custody wallet with animated on-screen OBS alerts & Text-to-Speech.",
    images: ['/brand/logo.png'],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${spaceGrotesk.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-black text-slate-100 font-sans selection:bg-cyan-400 selection:text-black relative overflow-x-hidden">
        {/* Web3 Ambient Background & Subtle Video Layer */}
        <BackgroundLayer />

        {/* Dynamic App Content */}
        <div className="relative z-10 min-h-full flex flex-col">
          <Web3Provider>
            {children}
          </Web3Provider>
        </div>
      </body>
    </html>
  );
}
