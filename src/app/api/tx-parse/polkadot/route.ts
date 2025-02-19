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

interface ApiResponse {
  transaction?: any;
  explanation: string;
  error?: string;
}

async function fetchPolkadotTransaction(hash: string) {
  const SUBSCAN_API_URL = "https://polkadot.api.subscan.io/api/scan/extrinsic";
  const SUBSCAN_API_KEY = process.env.SUBSCAN_API_KEY;

  const response = await fetch(SUBSCAN_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": SUBSCAN_API_KEY || "",
    },
    body: JSON.stringify({
      events_limit: 0,
      extrinsic_index: "",
      focus: "",
      hash: hash,
      only_extrinsic_event: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch transaction: ${response.status} ${error}`);
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Subscan API error: ${data.message}`);
  }

  return {
    transaction: data.data,
  };
}

async function analyzeTransaction(transaction: any): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "elyn/2.0-flash",
    messages: [
      {
        role: "system",
        content: `You are a Polkadot blockchain transaction analyzer. Your role is to provide clear, single-line summaries of transactions in this format:

[Type] | [From] → [To] | [Action] ([Amount] if applicable)

Rules:
- Always use a single line
- Use '|' to separate sections and '→' for direction
- Be extremely concise
- Include amount only if it's a transfer
- Remove technical jargon
- Focus on the main action

Examples:
"Transfer | 15kUt2i... → 14Vz2... | Sent 5 DOT"
"Staking | 15kUt2i... → Validator | Bonded 100 DOT"
"Governance | 15kUt2i... | Voted on proposal #23"
"Crowdloan | 15kUt2i... → Parachain | Contributed 50 DOT"
"Cross-Chain | 15kUt2i... → Kusama | Transferred 10 DOT via XCM"`,
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

    const transaction = await fetchPolkadotTransaction(hash);

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
