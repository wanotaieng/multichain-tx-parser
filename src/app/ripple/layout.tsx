import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ripple Transaction Parser",
  description:
    "Easily parse and understand Ripple (XRP) blockchain transactions with AI-powered explanations. A tool by zombcat.",
  keywords: [
    "Ripple",
    "XRP",
    "XRPL",
    "blockchain",
    "transaction parser",
    "crypto",
    "blockchain explorer",
    "web3",
    "DeFi",
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
    title: "Ripple Transaction Parser",
    description:
      "AI-powered Ripple (XRP) transaction parser for better blockchain understanding",
    type: "website",
    siteName: "Ripple Transaction Parser",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ripple Transaction Parser",
    description:
      "AI-powered Ripple (XRP) transaction parser for better blockchain understanding",
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
  applicationName: "Ripple Transaction Parser",
};

export default function RippleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
