import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";

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
        {/* Unified Cyber Background Ambient Layer */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Animated Cyber Grid */}
          <div className="absolute inset-0 bg-cyber-grid opacity-25"></div>

          {/* Glowing Ambient Light Orbs with Floating Animation */}
          <div className="absolute -top-[15%] -left-[10%] w-[650px] h-[650px] rounded-full bg-cyan-500/12 blur-[150px] animate-float-slow"></div>
          <div className="absolute top-[35%] -right-[15%] w-[700px] h-[700px] rounded-full bg-purple-600/12 blur-[170px] animate-float-reverse"></div>
          <div className="absolute -bottom-[20%] left-[25%] w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[180px] animate-pulse-slow"></div>
          <div className="absolute top-[60%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[140px]"></div>
        </div>

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
