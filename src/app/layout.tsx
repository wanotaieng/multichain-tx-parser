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
  title: "Aptos Transaction Parser",
  description:
    "Easily parse and understand Aptos blockchain transactions with AI-powered explanations. A tool by zombcat.",
  keywords: [
    "Aptos",
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
