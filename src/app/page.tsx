"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Code2, ExternalLink } from "lucide-react";

const chains = [
  {
    name: "Aptos",
    description:
      "Decode Aptos blockchain transactions with AI-powered insights",
    path: "/aptos",
    gradient: "from-purple-600 to-blue-600",
    bgGradient: "from-purple-50 to-blue-50",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    hoverBg: "hover:bg-purple-50",
  },
  {
    name: "Ripple",
    description: "Understand XRP Ledger transactions with AI explanations",
    path: "/ripple",
    gradient: "from-blue-600 to-cyan-600",
    bgGradient: "from-blue-50 to-cyan-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    hoverBg: "hover:bg-blue-50",
  },
  {
    name: "Polkadot",
    description: "Parse Polkadot network transactions with AI assistance",
    path: "/polkadot",
    gradient: "from-pink-600 to-purple-600",
    bgGradient: "from-pink-50 to-purple-50",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    hoverBg: "hover:bg-pink-50",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-45">
          {/* 세 가지 색상의 큰 그라데이션 블롭 */}
          <div className="absolute -top-[60%] -left-[60%] w-[1200px] h-[1200px] bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute -top-[40%] -right-[40%] w-[1000px] h-[1000px] bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-[50%] left-[10%] w-[1100px] h-[1100px] bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>

          {/* 보조 그라데이션 블롭 */}
          <div className="absolute top-[30%] -left-[30%] w-[800px] h-[800px] bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-3000"></div>
          <div className="absolute bottom-[20%] right-[5%] w-[700px] h-[700px] bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-5000"></div>
          <div className="absolute top-[10%] right-[20%] w-[600px] h-[600px] bg-fuchsia-100 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-6000"></div>
        </div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
      </div>

      <main className="relative min-h-screen flex flex-col py-12 px-4">
        <div className="max-w-6xl mx-auto w-full text-center mb-16">
          <div className="mt-4 mb-6 inline-flex items-center justify-center gap-3 px-4 py-2 rounded-full backdrop-blur-sm bg-white/80 shadow-sm border border-slate-200">
            <Code2 className="h-5 w-5 text-slate-700" />
            <span className="text-slate-700 font-medium">
              Transaction Parser
            </span>
          </div>
          <h1 className="text-5xl font-bold mt-4 mb-6 leading-[1.1] bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-transparent bg-clip-text pb-1">
            Decode Blockchain Transactions
            <br />
            with AI-Powered Insights
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Select a blockchain network below to start parsing and understanding
            transactions with detailed AI explanations.
          </p>
        </div>
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">
          {chains.map((chain) => (
            <Link
              key={chain.name}
              href={chain.path}
              className="group transition-all duration-200"
            >
              <Card
                className={`h-full transition-all duration-200 hover:shadow-xl hover:shadow-slate-200/50 border-slate-200 backdrop-blur-sm bg-white/90 hover:bg-white`}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className={`p-3 rounded-xl ${chain.iconBg}`}>
                    <Code2 className={`h-6 w-6 ${chain.iconColor}`} />
                  </div>
                  <h2
                    className={`text-2xl font-bold bg-gradient-to-r ${chain.gradient} text-transparent bg-clip-text`}
                  >
                    {chain.name}
                  </h2>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-6">{chain.description}</p>
                  <div
                    className={`flex items-center gap-2 ${chain.iconColor} group-hover:opacity-80 transition-opacity`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="font-medium">Start Parsing</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-24 text-center text-slate-500">
          <p className="text-sm">
            Created by{" "}
            <a
              href="https://github.com/pumpkinzomb"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-slate-700 transition-colors"
            >
              zombcat
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
