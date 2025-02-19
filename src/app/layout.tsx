import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Blockchain Transaction Parser",
  description:
    "AI-powered blockchain transaction parser for Aptos, Ripple, and Polkadot networks. A tool by zombcat.",
  keywords: [
    "blockchain",
    "transaction parser",
    "Aptos",
    "Ripple",
    "Polkadot",
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
    title: "Blockchain Transaction Parser",
    description:
      "AI-powered blockchain transaction parser for multiple networks",
    type: "website",
    siteName: "Blockchain Transaction Parser",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blockchain Transaction Parser",
    description:
      "AI-powered blockchain transaction parser for multiple networks",
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
  applicationName: "Blockchain Transaction Parser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
