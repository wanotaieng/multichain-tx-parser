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
  diagram: string;
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

async function generateDiagram(transaction: any): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "elyn/4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert in creating Mermaid sequence diagrams for Aptos blockchain transactions. Generate clear and accurate sequence diagrams showing the transaction flow, focusing on:

1. Key participants and their interactions:
   - Sender/User
   - Target contract or module
   - Resources affected
   - Other relevant participants

2. Transaction details:
   - Function calls with parameters
   - Token transfers with amounts
   - State changes in resources
   - Events emitted

3. Technical specifications:
   - Use proper Mermaid sequence diagram syntax
   - Include activate/deactivate for complex operations
   - Group related operations in rect blocks
   - Keep diagram flowing left to right
   - Limit to 4-5 main participants for clarity

Output just the Mermaid diagram code without any additional text or explanation.`,
      },
      {
        role: "user",
        content: `Create a Mermaid sequence diagram for this Aptos transaction: ${JSON.stringify(
          transaction
        )}

Example format:
sequenceDiagram
    participant User
    participant Contract
    participant Resource
    ...rest of the diagram`,
      },
    ],
    temperature: 0.1,
    max_tokens: 1000,
    presence_penalty: 0.1,
  });

  if (!completion.choices[0]?.message?.content) {
    throw new Error("Invalid response from AI model");
  }

  const diagramCode = completion.choices[0].message.content.trim();

  // Clean up the response to ensure it's valid Mermaid syntax
  return diagramCode
    .replace(/^```mermaid\n?/, "")
    .replace(/```$/, "")
    .trim();
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
    const diagram = await generateDiagram(transaction);

    const response: ApiResponse = {
      diagram,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating diagram:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while processing the transaction";

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

    const diagram = await generateDiagram(transaction);

    const response: ApiResponse = {
      diagram,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating diagram:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while generating the diagram";

    return NextResponse.json(
      { error: errorMessage },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}
