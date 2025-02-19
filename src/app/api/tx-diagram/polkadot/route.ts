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
  diagram: string;
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

async function generateDiagram(transaction: any): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "elyn/4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert in creating Mermaid sequence diagrams for Polkadot blockchain transactions. Your task is to generate ONLY the Mermaid sequence diagram code without any additional text or explanations. Focus on:

1. Pallet and Call Flow:
   - Show specific pallet and call execution
   - Display interactions between pallets
   - Include relevant parameters
   - Show emitted events

2. Participant Structure:
   - Origin account (sender)
   - Target accounts or systems
   - Relevant pallets
   - Validator nodes if applicable
   - Parachain interactions if present

3. Technical Requirements:
   - Use proper Mermaid sequence diagram syntax
   - Group related operations in rect blocks
   - Use activate/deactivate for complex flows
   - Keep diagram flowing left to right
   - Only output the diagram code, no explanations

IMPORTANT: Return ONLY the Mermaid diagram code without any surrounding text, explanations, or markdown code blocks.`,
      },
      {
        role: "user",
        content: `Convert this Polkadot transaction into a Mermaid sequence diagram. Return only the diagram code: ${JSON.stringify(
          transaction
        )}`,
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

  // Clean up the response and extract only the diagram code
  const cleanedCode = diagramCode
    .replace(/^(Here's|This is|Generated|Creating|The).*?\n/i, "")
    .replace(/^```mermaid\n?/, "")
    .replace(/```$/, "")
    .replace(/###.*$/, "")
    .replace(/Explanation:?[\s\S]*$/, "")
    .trim();

  // Ensure the code starts with 'sequenceDiagram'
  if (!cleanedCode.startsWith("sequenceDiagram")) {
    throw new Error("Invalid diagram code generated");
  }

  return cleanedCode;
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
