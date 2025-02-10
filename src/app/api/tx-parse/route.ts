import { OpenAI } from "openai";
import { NextResponse } from "next/server";

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

const APTOS_NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";

interface ApiResponse {
  transaction?: any;
  explanation: string;
  error?: string;
}

async function fetchAptosTransaction(hash: string) {
  const response = await fetch(
    `${APTOS_NODE_URL}/transactions/by_hash/${hash}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch transaction: ${response.status} ${error}`);
  }

  return response.json();
}

async function analyzeTransaction(transaction: any): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "elyn/2.0-flash-exp",
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
        content: `Analyze and provide a one-line summary: ${JSON.stringify(
          transaction
        )}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 100,
    presence_penalty: -0.1,
  });

  if (!completion.choices[0]?.message?.content) {
    throw new Error("Invalid response from AI model");
  }

  return completion.choices[0].message.content.trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get("hash");

    if (!hash) {
      return NextResponse.json(
        { error: "Transaction hash is required" },
        { status: 400 }
      );
    }

    const transaction = await fetchAptosTransaction(hash);

    const explanation = await analyzeTransaction(transaction);

    const response: ApiResponse = {
      transaction,
      explanation,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing transaction:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while fetching the transaction";

    return NextResponse.json(
      { error: errorMessage },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!req.body) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const { transaction } = await req.json();

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction data is required" },
        { status: 400 }
      );
    }

    const explanation = await analyzeTransaction(transaction);

    const response: ApiResponse = {
      explanation,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing transaction:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while parsing the transaction";

    return NextResponse.json(
      { error: errorMessage },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}
