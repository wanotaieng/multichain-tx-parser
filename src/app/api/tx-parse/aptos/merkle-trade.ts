import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { MerkleClient, MerkleClientConfig } from "@merkletrade/ts-sdk";
import { HfInference } from "@huggingface/inference";
import { QdrantClient } from "@qdrant/js-client-rest";
import {
  AgentRuntime,
  CacheManager,
  CacheStore,
  elizaLogger,
  FsCacheAdapter,
  ICacheManager,
  IAgentRuntime,
  type Character,
  Clients,
  defaultCharacter,
  type IDatabaseAdapter,
  parseBooleanFromText,
  settings
} from "@elizaos/core";
import { merklePlugin } from "@elizaos/plugin-merkle";
import { aptosPlugin } from "@elizaos/plugin-aptos";
import { DirectClient } from "@elizaos/client-direct";
import { RedisClient } from "@elizaos/adapter-redis";
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import { PGLiteDatabaseAdapter } from "@elizaos/adapter-pglite";
import { PostgresDatabaseAdapter } from "@elizaos/adapter-postgres";
import { QdrantDatabaseAdapter } from "@elizaos/adapter-qdrant";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";


interface TxRequestBody {
  transaction?: any;
  chain?: string;
  userAddress?: string;
  privateKey?: string;
  userId?: string;
}


interface ApiResponse {
  transaction?: any;
  chain?: string;
  explanation?: string;
  error?: string;
  finalTx?: any;
  orderPayload?: any;
  signedTx?: any;
}

const envVars = [
  "ELYN_API_KEY",
  "ELYN_API_ENDPOINT",
  "HF_API_KEY",
  "QDRANT_URL",
  "QDRANT_API_KEY"
] as const;

for (const envVar of envVars) {
  if (!process.env[envVar]) throw new Error(`Missing env var: ${envVar}`);
}

const openai = new OpenAI({
  apiKey: process.env.ELYN_API_KEY,
  baseURL: process.env.ELYN_API_ENDPOINT
});
const hf = new HfInference(process.env.HF_API_KEY!);
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!
});

async function classifyChain(rawTx: any): Promise<string> {
  try {
    const text = JSON.stringify(rawTx).slice(0, 3000);
    const embeddings = await hf.featureExtraction({
      model: "answerdotai/ModernBERT-base",
      inputs: text
    });
    const resp = await qdrant.search("chain_router", {
      vector: embeddings[0],
      top: 1,
      scoreThreshold: 0.3
    });
    if (resp?.length && resp[0].payload?.chain) {
      return resp[0].payload.chain;
    }
    return "aptos";
  } catch {
    // default fallback
    return "aptos";
  }
}

async function fetchAptosTransaction(hash: string) {
    // Initialize the Aptos client with the desired network configuration
    const config = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(config);
  
    try {
      // Fetch the transaction details by hash
      const transaction = await aptos.getTransactionByHash({ transactionHash: hash });
      return transaction;
    } catch (error) {
      console.error("Error fetching transaction:", error);
      throw error;
    }
  }

async function retrieveDocs(query: string): Promise<string> {
  const embeddings = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: query
  });
  const docs = await qdrant.search("merkle_docs", { vector: embeddings[0], top: 3 });
  const contents = docs.map((d) => d.payload?.text ?? "").join("\n\n");
  return contents || "";
}

async function buildMermaidDiagram(tx: any): Promise<string> {
  const ledger = tx.version ?? "unknown_ledger";
  const fromAddr = tx.sender ?? "unknown_sender";
  // This example shows a typical coin transfer pattern
  const recAddr = tx.payload?.arguments?.[0] ?? "unknown_recipient";
  const amount = tx.payload?.arguments?.[1] ?? "unknown_amount";
  return [
    "```mermaid",
    "sequenceDiagram",
    `participant Sender as ${fromAddr}`,
    "participant MoveRuntime as 0x1::coin",
    `Sender->>MoveRuntime: coin::transfer<APT>(recipient=${recAddr}, amount=${amount})`,
    `MoveRuntime-->>Sender: Transaction Receipt @ ledger ${ledger}`,
    "```"
  ].join("\n");
}

async function analyzeTxWithContext(tx: any, docs: string, userId: string): Promise<string> {
  const chainInfo = await classifyChain(tx);
  const mermaid = await buildMermaidDiagram(tx);
  const c = await openai.chat.completions.create({
    model: "elyn/2.0-flash",
    messages: [
      {
        role: "system",
        content: [
          "You are an LLM specialized in multichain transaction analysis (Aptos, Polkadot, Ripple).",
          "You have knowledge of Merkle Trade, a gamified perpetual DEX on Aptos.",
          "You have the following relevant docs from Qdrant that may clarify the transaction:",
          docs,
          "Please produce a thorough explanation and summary, followed by a mermaid diagram."
        ].join("\n")
      },
      {
        role: "user",
        content: JSON.stringify({
          chain: chainInfo,
          user_id: userId || "unknown_user",
          raw_transaction_data: tx,
          retrieved_docs: docs
        })
      }
    ],
    temperature: 0.4,
    max_tokens: 400
  });

  const output = c.choices[0]?.message?.content || "";
  return `${output}\n\nMermaid:\n${mermaid}`;
}

async function routeAndAnalyze(tx: any, userId: string): Promise<{ explanation: string; chain: string }> {
  const chainType = await classifyChain(tx);
  const docText = await retrieveDocs(`transaction on chain: ${chainType}`);
  const explanation = await analyzeTxWithContext(tx, await docText, userId);
  return { explanation, chain: chainType };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get("hash");
    const userId = searchParams.get("userId") || "unknown_user";
    if (!hash) {
      return NextResponse.json({ error: "Transaction hash is required" }, { status: 400 });
    }
    const tx = await fetchAptosTransaction(hash);
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    const { explanation, chain } = await routeAndAnalyze(tx, userId);
    return NextResponse.json({
      transaction: tx,
      chain,
      explanation
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!req.body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    const body: TxRequestBody = await req.json();

    // If a transaction is given, we simply analyze it.
    if (body.transaction) {
      const { explanation, chain } = await routeAndAnalyze(body.transaction, body.userId || "anonymous");
      return NextResponse.json({ explanation, chain });
    }

    // Otherwise, if user wants to place a Merkle Trade order:
    if (!body.userAddress || !body.privateKey) {
      return NextResponse.json({ error: "userAddress and privateKey required" }, { status: 400 });
    }

    // Initialize Merkle + Aptos for placing an order
    const merkle = new MerkleClient(await MerkleClientConfig.mainnet());
    const aptosClient = new Aptos(merkle.config.aptosConfig);

    // Example: Place a BTC_USD market order
    const orderPayload = await merkle.payloads.placeMarketOrder({
      pair: "BTC_USD",
      userAddress: body.userAddress,
      sizeDelta: BigInt(100000000),   // e.g. 100 USDC
      collateralDelta: BigInt(5000000), // 5 USDC
      isLong: true,
      isIncrease: true
    });

    // Build transaction for Aptos
    const builtTx = await aptosClient.transaction.build.simple({
      sender: body.userAddress,
      data: orderPayload
    });

    // Sign + submit
    const submittedTx = await aptosClient.signAndSubmitTransaction({
      signer: { type: "raw", privateKey: body.privateKey },
      transaction: builtTx
    });

    // Wait for finalization
    const finalTx = await aptosClient.waitForTransaction({ transactionHash: submittedTx.hash });

    // Retrieve from Aptos
    const onChainData = await fetchAptosTransaction(submittedTx.hash);

    // Analyze final on-chain data
    const { explanation, chain } = await routeAndAnalyze(onChainData, body.userId || "anonymous");

    return NextResponse.json({
      orderPayload,
      signedTx: submittedTx,
      finalTx,
      chain,
      explanation
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

export const transactionAnalyzerPlugin = {
  name: "transactionAnalyzerPlugin",
  commands: [
    {
      name: "analyzeTx",
      description: "Analyze an Aptos transaction with Qdrant + HF + Merkle context.",
      exec: async (runtime: IAgentRuntime, params: { hash: string; userId?: string }) => {
        if (!params.hash) {
          return "Error: no transaction hash provided.";
        }
        const tx = await fetchAptosTransaction(params.hash);
        if (!tx) {
          return `Transaction ${params.hash} not found.`;
        }
        const { explanation } = await routeAndAnalyze(tx, params.userId || "anonymous");
        return explanation;
      }
    }
  ]
};
