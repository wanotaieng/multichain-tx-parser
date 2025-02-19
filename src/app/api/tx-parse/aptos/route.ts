import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { Aptos } from "@aptos-labs/ts-sdk";

const requiredEnvVars = ["ELYN_API_KEY", "ELYN_API_ENDPOINT"] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const openai = new OpenAI({
  apiKey: process.env.ELYN_API_KEY,
  baseURL: process.env.ELYN_API_ENDPOINT,
});

const aptos = new Aptos({
  nodeUrl: "https://fullnode.mainnet.aptoslabs.com/v1",
});

interface ApiResponse {
  transaction?: any;
  explanation: string;
  error?: string;
}

async function fetchAptosTransaction(hash: string) {
  return aptos.restClient.transactionByHash(hash);
}

async function analyzeTransaction(tx: any): Promise<string> {
  const c = await openai.chat.completions.create({
    model: "elyn/2.0-flash",
    messages: [
      {
        role: "system",
        content: `You are an Aptos blockchain transaction analyzer. Your role is to provide clear, single-line summaries of transactions in this format:

[Type] | [From] → [To] | [Action] ([Amount] if applicable)

Rules:
- Always use a single line
- Use '|' to separate sections and '→' for direction
- Be extremely concise
- Include amount only if it's a transfer
- Remove technical jargon
- Focus on the main action

Examples:
"Transfer | alice.apt → bob.apt | Sent 100 APT"
"NFT | creator.apt → buyer.apt | Minted Bored Ape #123"
"Stake | validator.apt → pool.apt | Delegated 5000 APT"`,
      },
      {
        role: "user",
        content: `Analyze and provide a one-line summary: ${JSON.stringify(tx)}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 100,
    presence_penalty: -0.1,
  });
  if (!c.choices[0]?.message?.content) {
    throw new Error("Invalid response from AI model");
  }
  return c.choices[0].message.content.trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get("hash");
    if (!hash) {
      return NextResponse.json({ error: "Transaction hash is required" }, { status: 400 });
    }
    const tx = await fetchAptosTransaction(hash);
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    const explanation = await analyzeTransaction(tx);
    const response: ApiResponse = { transaction: tx, explanation };
    return NextResponse.json(response);
  } catch (error) {
    const m = error instanceof Error ? error.message : "An unexpected error occurred while fetching the transaction";
    return NextResponse.json({ error: m }, { status: error instanceof Error ? 400 : 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!req.body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }
    const { transaction } = await req.json();
    if (!transaction) {
      return NextResponse.json({ error: "Transaction data is required" }, { status: 400 });
    }
    const explanation = await analyzeTransaction(transaction);
    const response: ApiResponse = { explanation };
    return NextResponse.json(response);
  } catch (error) {
    const m = error instanceof Error ? error.message : "An unexpected error occurred while parsing the transaction";
    return NextResponse.json({ error: m }, { status: error instanceof Error ? 400 : 500 });
  }
}
