import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";
import { BackgroundLayer } from "@/components/BackgroundLayer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Live Crypto — Non-Custodial Donation Gateway for Streamers",
  description: "Accept crypto donations in real-time with OBS overlays, multi-chain support (SUI, Solana, Ethereum, Polygon, Base, Arbitrum, BSC), and smart-contract fee splitting.",
  icons: {
    icon: '/brand/logo-png.png',
    apple: '/brand/logo-png.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${outfit.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#08090d] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
        {/* Web3 Video & Ambient Glow Background Layer */}
        <BackgroundLayer />

        {/* App Content */}
        <div className="relative z-10 min-h-full flex flex-col">
          <Web3Provider>
            {children}
          </Web3Provider>
        </div>
      </body>
    </html>
  );
}
