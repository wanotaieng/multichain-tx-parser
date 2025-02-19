// app/aptos/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aptos Transaction Parser",
  description:
    "Easily parse and understand Aptos blockchain transactions with AI-powered explanations. A tool by zombcat.",
  keywords: [
    "Aptos",
    "APT",
    "Move",
    "blockchain",
    "transaction parser",
    "crypto",
    "blockchain explorer",
    "web3",
    "DeFi",
    "LayerOne",
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
    title: "Aptos Transaction Parser",
    description:
      "AI-powered Aptos transaction parser for better blockchain understanding",
    type: "website",
    siteName: "Aptos Transaction Parser",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aptos Transaction Parser",
    description:
      "AI-powered Aptos transaction parser for better blockchain understanding",
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
  applicationName: "Aptos Transaction Parser",
};

export default function AptosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
