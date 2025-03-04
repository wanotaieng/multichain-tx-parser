/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */

import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { MerkleClient, MerkleClientConfig } from "@merkletrade/ts-sdk";
import { HfInference } from "@huggingface/inference";
import { QdrantClient } from "@qdrant/js-client-rest";
import fetch from "node-fetch";
import DKG from "dkg.js";

const {
  DKG_NODE_HOSTNAME = "http://localhost",
  DKG_NODE_PORT = "8900",
  DKG_ENVIRONMENT = "testnet",
  DKG_BLOCKCHAIN_ID = "base:84532",
  DKG_PUBLIC_KEY = "",
  DKG_PRIVATE_KEY = ""
} = process.env;

const requiredEnvVars = [
  "ELYN_API_KEY",
  "ELYN_API_ENDPOINT",
  "HF_API_KEY",
  "QDRANT_URL",
  "QDRANT_API_KEY"
] as const;

for (const v of requiredEnvVars) {
  if (!process.env[v]) {
    throw new Error(`Missing environment variable: ${v}`);
  }
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

const dkgClient = new DKG({
  environment: DKG_ENVIRONMENT,
  endpoint: DKG_NODE_HOSTNAME,
  port: Number(DKG_NODE_PORT),
  blockchain: {
    name: DKG_BLOCKCHAIN_ID,
    publicKey: DKG_PUBLIC_KEY,
    privateKey: DKG_PRIVATE_KEY
  }
});

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
  dkgAssetUAL?: string; // The universal asset locator for a DKG knowledge asset
}

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
    return "aptos";
  }
}

async function fetchAptosTransaction(hash: string) {
  const config = new AptosConfig({ network: Network.MAINNET });
  const aptos = new Aptos(config);

  try {
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
  const docs = await qdrant.search("merkle_docs", {
    vector: embeddings[0],
    top: 2
  });
  return docs.map((d: { payload: { text: any; }; }) => d.payload?.text ?? "").join("\n");
}

async function buildMermaidDiagram(tx: any): Promise<string> {
  const ledger = tx.version ?? "unknown_ledger";
  const fromAddr = tx.sender ?? "unknown_sender";
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
  const chain = await classifyChain(tx);
  const mermaid = await buildMermaidDiagram(tx);

  const c = await openai.chat.completions.create({
    model: "elyn/2.0-flash",
    messages: [
      {
        role: "system",
        content: [
          "You are an AI specialized in analyzing transactions across multiple blockchains, especially Aptos.",
          "You also leverage the OriginTrail Decentralized Knowledge Graph (DKG) to store and retrieve data about these transactions.",
          "Below are some relevant docs from Qdrant:",
          docs,
          "Produce a thorough explanation and then append a mermaid diagram for clarity."
        ].join("\n")
      },
      {
        role: "user",
        content: JSON.stringify({
          chain,
          user_id: userId || "unknown_user",
          raw_transaction_data: tx
        })
      }
    ],
    temperature: 0.4,
    max_tokens: 400
  });

  const answer = c.choices[0]?.message?.content || "";
  return `${answer}\n\nMermaid:\n${mermaid}`;
}

async function storeAnalysisInDKG(
  txData: any,
  chain: string,
  explanation: string,
  userId: string
): Promise<string | null> {
  try {
    // We store the analysis as public data for demonstration.
    // Private data is also possible if you prefer to keep it local on your node.
    const content = {
      public: {
        "@context": "http://schema.org",
        "@id": `urn:tx-analysis:${txData.hash || Date.now()}`,
        "@type": "TransactionAnalysis",
        chain,
        userId,
        explanation,
        rawTransaction: txData
      }
    };

    /* 
      epochsNum = 3 means the data is kept for 3 months on the DKG
      This can be adjusted. 
    */
    const result = await dkgClient.asset.create(content, { epochsNum: 3 });
    // Returns a "UAL" (universal asset locator), e.g. did:dkg:base:84532/0xabcd1234...
    return result.UAL;
  } catch (err) {
    console.error("DKG store error:", err);
    return null;
  }
}

async function routeAndAnalyze(
  tx: any,
  userId: string
): Promise<{ explanation: string; chain: string; dkgAssetUAL?: string }> {
  const chain = await classifyChain(tx);
  const docText = await retrieveDocs(`transaction on chain: ${chain}`);
  const explanation = await analyzeTxWithContext(tx, await docText, userId);

  const ual = await storeAnalysisInDKG(tx, chain, explanation, userId);
  return { explanation, chain, dkgAssetUAL: ual || undefined };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get("hash");
    const userId = searchParams.get("userId") || "anonymous_user";

    if (!hash) {
      return NextResponse.json({ error: "Transaction hash is required" }, { status: 400 });
    }

    const txData = await fetchAptosTransaction(hash);
    if (!txData) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const { explanation, chain, dkgAssetUAL } = await routeAndAnalyze(txData, userId);
    return NextResponse.json({
      transaction: txData,
      chain,
      explanation,
      dkgAssetUAL
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unexpected error while GET analyzing TX";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: TxRequestBody = await req.json();

    // 1) Analyze a transaction object
    if (body.transaction) {
      const { explanation, chain, dkgAssetUAL } = await routeAndAnalyze(
        body.transaction,
        body.userId || "anonymous"
      );
      return NextResponse.json({ explanation, chain, dkgAssetUAL });
    }

    // 2) If user wants to place a Merkle order on Aptos
    if (!body.userAddress || !body.privateKey) {
      return NextResponse.json(
        { error: "userAddress and privateKey required for Merkle trade submission" },
        { status: 400 }
      );
    }

    // (A) Build & place the order
    const merkle = new MerkleClient(await MerkleClientConfig.mainnet());
    const aptosSdk = new Aptos(merkle.config.aptosConfig);

    const orderPayload = await merkle.payloads.placeMarketOrder({
      pair: "BTC_USD",
      userAddress: body.userAddress,
      sizeDelta: BigInt(100000000),
      collateralDelta: BigInt(5000000),
      isLong: true,
      isIncrease: true
    });

    const builtTx = await aptosSdk.transaction.build.simple({
      sender: body.userAddress,
      data: orderPayload
    });

    const submitted = await aptosSdk.signAndSubmitTransaction({
      signer: { type: "raw", privateKey: body.privateKey },
      transaction: builtTx
    });

    const finalTx = await aptosSdk.waitForTransaction({ transactionHash: submitted.hash });

    // (B) Retrieve final on-chain data
    const onChainData = await fetchAptosTransaction(submitted.hash);

    // (C) Analyze + store in DKG
    const { explanation, chain, dkgAssetUAL } = await routeAndAnalyze(
      onChainData,
      body.userId || "anonymous"
    );

    return NextResponse.json({
      orderPayload,
      signedTx: submitted,
      finalTx,
      chain,
      explanation,
      dkgAssetUAL
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unexpected error while POST analyzing or placing Merkle order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const txAnalyzerPlugin = {
  name: "txAnalyzerPlugin",
  commands: [
    {
      name: "analyzeAptosTx",
      description: "Analyze an Aptos transaction, store result in the DKG, returns a summary + UAL",
      exec: async (runtime: any, params: { hash: string; userId?: string }) => {
        const { hash, userId = "anonymous_user" } = params;
        if (!hash) return "No hash provided";
        const txData = await fetchAptosTransaction(hash);
        if (!txData) return "Transaction not found";
        const { explanation, chain, dkgAssetUAL } = await routeAndAnalyze(txData, userId);
        return `Chain: ${chain}\nUAL: ${dkgAssetUAL}\nExplanation:\n${explanation}`;
      }
    }
  ]
};
