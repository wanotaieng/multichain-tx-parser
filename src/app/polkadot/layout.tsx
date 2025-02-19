import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polkadot Transaction Parser",
  description:
    "Easily parse and understand Polkadot blockchain transactions with AI-powered explanations. A tool by zombcat.",
  keywords: [
    "Polkadot",
    "DOT",
    "Substrate",
    "blockchain",
    "transaction parser",
    "crypto",
    "blockchain explorer",
    "web3",
    "DeFi",
    "Parachain",
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
    title: "Polkadot Transaction Parser",
    description:
      "AI-powered Polkadot transaction parser for better blockchain understanding",
    type: "website",
    siteName: "Polkadot Transaction Parser",
  },
  twitter: {
    card: "summary_large_image",
    title: "Polkadot Transaction Parser",
    description:
      "AI-powered Polkadot transaction parser for better blockchain understanding",
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
  applicationName: "Polkadot Transaction Parser",
};

export default function PolkadotLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
