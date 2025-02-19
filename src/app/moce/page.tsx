"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { JsonViewer } from "@textea/json-viewer";
import {
  Loader2,
  RotateCcw,
  ExternalLink,
  FileJson,
  Hash,
  Code2,
} from "lucide-react";

const EXPLORER_URLS = {
  aptos: "https://explorer.aptoslabs.com/txn",
  ripple: "https://xrpscan.com/tx",
  polkadot: "https://polkadot.subscan.io/extrinsic",
};

interface Transaction {
  hash: string;
  chain?: string;
  [key: string]: any;
}

interface ApiResponse {
  transaction?: Transaction;
  explanation: string;
  chain?: string;
  error?: string;
}

export default function MOCEParser() {
  const [inputType, setInputType] = useState<"json" | "hash">("json");
  const [input, setInput] = useState<string>("");
  const [parsedTransaction, setParsedTransaction] =
    useState<Transaction | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [detectedChain, setDetectedChain] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      let response: Response;
      let data: ApiResponse;

      const judgeResponse = await fetch("/api/chain-judge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: inputType,
          input: input,
        }),
      });

      const judgeData = await judgeResponse.json();

      if (!judgeResponse.ok || !judgeData.chain) {
        throw new Error("Unable to determine blockchain type");
      }

      setDetectedChain(judgeData.chain);

      if (inputType === "json") {
        const parsedJson = JSON.parse(input);
        setParsedTransaction(parsedJson);

        response = await fetch(`/api/tx-parse/${judgeData.chain}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transaction: parsedJson }),
        });
      } else {
        response = await fetch(
          `/api/tx-parse/${judgeData.chain}?hash=${input}`
        );
      }

      data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse transaction");
      }

      if (data.transaction) {
        setParsedTransaction(data.transaction);
      }
      setExplanation(data.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setParsedTransaction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setParsedTransaction(null);
    setExplanation("");
    setError("");
    setInput("");
    setDetectedChain("");
  };

  const getExplorerUrl = (chain: string, transaction: Transaction): string => {
    const baseUrl = EXPLORER_URLS[chain as keyof typeof EXPLORER_URLS];
    const hash =
      chain === "polkadot"
        ? transaction.transaction?.extrinsic_hash
        : transaction.hash;

    return `${baseUrl}/${hash}`;
  };

  const SkeletonCard = () => (
    <div className="h-full flex flex-col">
      <div className="space-y-3 flex-1">
        <div className="h-4 bg-slate-100 rounded w-1/4"></div>
        <div className="space-y-2 mt-4">
          <div className="h-3 bg-slate-100 rounded"></div>
          <div className="h-3 bg-slate-100 rounded w-5/6"></div>
          <div className="h-3 bg-slate-100 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="h-screen flex flex-col relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,120,120,0.1),rgba(0,0,0,0.15))]" />
      <div
        className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100"
        style={{ mixBlendMode: "overlay" }}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 via-white to-gray-50" />

      <div className="max-w-7xl mx-auto w-full h-full flex flex-col p-8 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-br from-gray-800 to-black rounded-xl">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 text-transparent bg-clip-text">
                MOCE Transaction Parser
              </h1>
              <p className="text-sm text-gray-600">
                Mixture of Chain Experts (MOCE) - Unified blockchain transaction
                analysis across multiple chains
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="mb-6 rounded-xl border-red-200 bg-red-50"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-8 flex-1 min-h-0">
          {/* Left Column */}
          <div className="h-full">
            <Card className="h-full flex flex-col rounded-xl border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden backdrop-blur-sm bg-white/80">
              <CardHeader className="flex flex-col space-y-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {parsedTransaction ? (
                      <FileJson className="h-5 w-5 text-gray-700" />
                    ) : (
                      <Hash className="h-5 w-5 text-gray-700" />
                    )}
                    <h2 className="text-xl font-semibold text-gray-800">
                      {parsedTransaction
                        ? `Transaction Data${
                            detectedChain
                              ? ` (${detectedChain.toUpperCase()})`
                              : ""
                          }`
                        : "Input Transaction"}
                    </h2>
                  </div>
                  <Button
                    onClick={parsedTransaction ? handleReset : handleSubmit}
                    disabled={loading || (!input && !parsedTransaction)}
                    variant={parsedTransaction ? "outline" : "default"}
                    className={`min-w-32 rounded-lg transition-all duration-200 ${
                      parsedTransaction
                        ? "hover:bg-gray-100"
                        : "bg-gradient-to-r from-gray-800 to-gray-900 hover:opacity-90 text-white"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : parsedTransaction ? (
                      <>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                      </>
                    ) : (
                      "Analyze Transaction"
                    )}
                  </Button>
                </div>
                {!parsedTransaction && (
                  <div className="flex flex-col space-y-2">
                    <RadioGroup
                      defaultValue="json"
                      value={inputType}
                      onValueChange={(value) => {
                        setInputType(value as "json" | "hash");
                        setInput(""); // input 값 초기화
                      }}
                      className="flex space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="json"
                          id="json"
                          className="text-gray-700"
                        />
                        <Label
                          htmlFor="json"
                          className="font-medium cursor-pointer text-gray-800"
                        >
                          JSON Input
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="hash"
                          id="hash"
                          className="text-gray-700"
                        />
                        <Label
                          htmlFor="hash"
                          className="font-medium cursor-pointer text-gray-800"
                        >
                          Transaction Hash
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0">
                {parsedTransaction ? (
                  <div className="h-full overflow-auto p-4 bg-gray-50/80">
                    <JsonViewer
                      value={parsedTransaction}
                      defaultInspectDepth={2}
                      rootName={false}
                      enableClipboard
                      theme="light"
                    />
                  </div>
                ) : inputType === "json" ? (
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste your blockchain transaction JSON here..."
                    className="h-full resize-none rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-white/90"
                  />
                ) : (
                  <div className="p-4">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Enter transaction hash..."
                      className="w-full rounded-lg border-gray-200 focus:border-gray-700 bg-white/90"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="h-full">
            <Card className="h-full flex flex-col rounded-xl border-gray-200 shadow-xl shadow-gray-200/50 backdrop-blur-sm bg-white/80">
              <CardHeader className="bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800">
                  Analysis
                </h2>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 overflow-auto">
                <div className="space-y-6">
                  {explanation ? (
                    <>
                      <div className="whitespace-pre-wrap text-gray-700">
                        {explanation}
                      </div>
                      {parsedTransaction && detectedChain && (
                        <div className="pt-4 border-t border-gray-200">
                          <a
                            href={getExplorerUrl(
                              detectedChain,
                              parsedTransaction
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors group"
                          >
                            <ExternalLink className="h-4 w-4 transition-transform group-hover:scale-110" />
                            View on{" "}
                            {detectedChain.charAt(0).toUpperCase() +
                              detectedChain.slice(1)}{" "}
                            Explorer
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <SkeletonCard />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
