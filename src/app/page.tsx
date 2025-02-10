"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  RotateCcw,
  ExternalLink,
  Code2,
  FileJson,
  Hash,
} from "lucide-react";
import { JsonViewer } from "@textea/json-viewer";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const APTOS_EXPLORER_URL = "https://explorer.aptoslabs.com/txn";

interface Transaction {
  hash: string;
  [key: string]: any;
}

interface ApiResponse {
  transaction?: Transaction;
  explanation: string;
  error?: string;
}

export default function TransactionParser() {
  const [inputType, setInputType] = useState<"json" | "hash">("json");
  const [transaction, setTransaction] = useState<string>("");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [parsedTransaction, setParsedTransaction] =
    useState<Transaction | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      let response: Response;
      let data: ApiResponse;

      if (inputType === "json") {
        const parsedJson = JSON.parse(transaction);
        setParsedTransaction(parsedJson);

        response = await fetch("/api/tx-parse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transaction: parsedJson }),
        });

        data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to parse transaction");
        }

        setExplanation(data.explanation);
      } else {
        response = await fetch(`/api/tx-parse?hash=${transactionHash}`, {
          method: "GET",
        });

        data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch transaction");
        }

        if (data.transaction) {
          setParsedTransaction(data.transaction);
        }
        setExplanation(data.explanation);
      }
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
    setTransaction("");
    setTransactionHash("");
  };

  const getExplorerUrl = (hash: string): string => {
    return `${APTOS_EXPLORER_URL}/${hash}`;
  };

  const ExplorerLink = ({ hash }: { hash: string }) => (
    <a
      href={getExplorerUrl(hash)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
    >
      <ExternalLink className="h-4 w-4" />
      View on Aptos Explorer
    </a>
  );

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
    <main className="min-h-[85vh] flex flex-col py-8 px-4 bg-gradient-to-b from-purple-50 to-white">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Code2 className="h-6 w-6 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
            Aptos Transaction Parser
          </h1>
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

      <div className="grid grid-cols-2 gap-8 flex-1 min-h-0 max-h-[70vh]">
        {/* Left Column */}
        <div className="h-full">
          <Card className="h-full flex flex-col rounded-xl border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden">
            <CardHeader className="flex flex-col space-y-4 bg-slate-50/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {parsedTransaction ? (
                    <FileJson className="h-5 w-5 text-slate-600" />
                  ) : (
                    <Hash className="h-5 w-5 text-slate-600" />
                  )}
                  <h2 className="text-xl font-semibold text-slate-700">
                    {parsedTransaction
                      ? "Transaction Data"
                      : "Input Transaction"}
                  </h2>
                </div>
                <Button
                  onClick={parsedTransaction ? handleReset : handleSubmit}
                  disabled={
                    loading ||
                    (!transaction && !transactionHash && !parsedTransaction)
                  }
                  variant={parsedTransaction ? "outline" : "default"}
                  className={`min-w-32 rounded-lg transition-all duration-200 ${
                    parsedTransaction
                      ? "hover:bg-slate-100"
                      : "bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Parsing...
                    </>
                  ) : parsedTransaction ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </>
                  ) : (
                    "Parse Transaction"
                  )}
                </Button>
              </div>
              {!parsedTransaction && (
                <div className="flex flex-col space-y-2">
                  <RadioGroup
                    defaultValue="json"
                    value={inputType}
                    onValueChange={(value) =>
                      setInputType(value as "json" | "hash")
                    }
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="json"
                        id="json"
                        className="text-purple-600"
                      />
                      <Label
                        htmlFor="json"
                        className="font-medium cursor-pointer"
                      >
                        JSON Input
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="hash"
                        id="hash"
                        className="text-purple-600"
                      />
                      <Label
                        htmlFor="hash"
                        className="font-medium cursor-pointer"
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
                <div className="h-full overflow-auto p-4 bg-slate-50">
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
                  value={transaction}
                  onChange={(e) => setTransaction(e.target.value)}
                  placeholder="Paste your Aptos transaction JSON here..."
                  className="h-full resize-none rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-white"
                />
              ) : (
                <div className="p-4">
                  <Input
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                    placeholder="Enter transaction hash..."
                    className="w-full rounded-lg border-slate-200 focus:border-purple-500"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="h-full">
          <Card className="h-full flex flex-col rounded-xl border-slate-200 shadow-lg shadow-slate-200/50">
            <CardHeader className="bg-slate-50/50">
              <h2 className="text-xl font-semibold text-slate-700">
                Explanation
              </h2>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-auto">
              <div className="space-y-6">
                {explanation ? (
                  <>
                    <div className="whitespace-pre-wrap text-slate-600">
                      {explanation}
                    </div>
                    {parsedTransaction?.hash && (
                      <div className="pt-4 border-t border-slate-200">
                        <a
                          href={getExplorerUrl(parsedTransaction.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors group"
                        >
                          <ExternalLink className="h-4 w-4 transition-transform group-hover:scale-110" />
                          View on Aptos Explorer
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
    </main>
  );
}
