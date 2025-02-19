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

const RIPPLE_NODE_URL = "https://xrplcluster.com";

interface ApiResponse {
  transaction?: any;
  explanation: string;
  error?: string;
}

async function fetchRippleTransaction(hash: string) {
  const response = await fetch(`${RIPPLE_NODE_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      method: "tx",
      params: [
        {
          transaction: hash,
          binary: false,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch transaction: ${response.status} ${error}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Failed to fetch transaction: ${data.error}`);
  }

  return data.result;
}

async function analyzeTransaction(transaction: any): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "elyn/2.0-flash",
    messages: [
      {
        role: "system",
        content: `You are a Ripple (XRP) blockchain transaction analyzer. Your role is to provide clear, single-line summaries of transactions in this format:

[Type] | [From] → [To] | [Action] ([Amount] if applicable)

Rules:
- Always use a single line
- Use '|' to separate sections and '→' for direction
- Be extremely concise
- Include amount only if it's a transfer
- Remove technical jargon
- Focus on the main action

Examples:
"Payment | r9LqNeG6... → rPT1Sjz... | Sent 1000 XRP"
"TrustSet | r9LqNeG6... → rPT1Sjz... | Set trust line for USD"
"OfferCreate | r9LqNeG6... | Created offer to exchange XRP/USD"`,
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

    const transaction = await fetchRippleTransaction(hash);

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
