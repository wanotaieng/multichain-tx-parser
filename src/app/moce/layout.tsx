import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MOCE - Mixture of Chain Experts",
  description:
    "Advanced multi-chain transaction parser powered by AI. Automatically detect and analyze transactions from Aptos, Ripple, and Polkadot networks. A tool by zombcat.",
  keywords: [
    "blockchain",
    "transaction parser",
    "multi-chain",
    "Aptos",
    "Ripple",
    "Polkadot",
    "MOCE",
    "blockchain explorer",
    "crypto",
    "web3",
    "DeFi",
    "LayerOne",
    "cross-chain",
    "blockchain analysis",
  ],
  authors: [
    {
      name: "zombcat",
      url: "https://github.com/pumpkinzomb",
    },
  ],
  creator: "zombcat",
  publisher: "zombcat",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "MOCE - Multi-Chain Transaction Parser",
    description:
      "AI-powered multi-chain transaction parser supporting Aptos, Ripple, and Polkadot networks",
    type: "website",
    siteName: "MOCE - Mixture of Chain Experts",
  },
  twitter: {
    card: "summary_large_image",
    title: "MOCE - Multi-Chain Transaction Parser",
    description:
      "AI-powered multi-chain transaction parser supporting Aptos, Ripple, and Polkadot networks",
    creator: "@zombcat",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  category: "Technology",
  applicationName: "MOCE - Mixture of Chain Experts",
};

export default function MOCELayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
