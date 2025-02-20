import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { HfInference } from "@huggingface/inference";
import { QdrantClient } from "@qdrant/js-client-rest";

const requiredEnvVars = [
    "ELYN_API_KEY",
    "ELYN_API_ENDPOINT",
    "HF_API_KEY",
    "QDRANT_URL",
    "QDRANT_API_KEY",
    "SUBSCAN_API_KEY",
] as const;

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

const openai = new OpenAI({
    apiKey: process.env.ELYN_API_KEY,
    baseURL: process.env.ELYN_API_ENDPOINT,
});

const hf = new HfInference(process.env.HF_API_KEY!);

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!,
});

interface ApiResponse {
    transaction?: any;
    explanation: string;
    error?: string;
}

async function fetchTransactionFromQdrant(hash: string): Promise<any | null> {
    try {
        const embeddings = await hf.featureExtraction({
            model: "wanot-ai/all-MiniLM-L6-v2",
            inputs: hash,
        });

        const searchResults = await qdrant.search("polkadot_transactions", {
            vector: embeddings[0],
            top: 1,
            scoreThreshold: 0.75, // example threshold
        });

        if (searchResults.length === 0) {
            return null;
        }

        const bestMatch = searchResults[0];
        if (bestMatch.payload?.transaction) {
            // The transaction data is stored in bestMatch.payload.transaction
            return bestMatch.payload.transaction;
        }

        return null;
    } catch (err) {
        console.error("Error searching Qdrant:", err);
        return null;
    }
}

async function storeTransactionInQdrant(hash: string, transaction: any) {
    try {
        const embeddings = await hf.featureExtraction({
            model: "wanot-ai/all-MiniLM-L6-v2",
            inputs: hash,
        });

        await qdrant.upsert("polkadot_transactions", {
            points: [
                {
                    id: hash,
                    vector: embeddings[0],
                    payload: {
                        hash,
                        transaction,
                    },
                },
            ],
        });
    } catch (err) {
        console.error("Error storing transaction in Qdrant:", err);
    }
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

async function analyzeTransaction(transaction: any): Promise<string> | string {
    const completion = await openai.chat.completions.create({
        model: "elyn/2.0-flash",
        messages: [
            {
                role: "system",
                content: `You are a Curst Network blockchain transaction analyzer. Provide a brief 4-5 line analysis covering:

1. Basic Transaction Info
   - Which pallet and call was executed
   - Main purpose of the transaction
   - Block number and timestamp

2. Participants and Values
   - Who initiated the transaction
   - Target accounts or systems affected
   - Amount of DOT or other assets involved
   - Any fees or tips paid

3. Transaction Result
   - Success/failure status
   - Impact on chain state
   - Any cross-chain effects (if applicable)

Use clear, concise language focusing on the most important aspects of the transaction.`,
            },
            {
                role: "user",
                content: `Analyze this Polkadot transaction in detail: ${JSON.stringify(
                    transaction
                )}`,
            },
        ],
        temperature: 0.3,
        max_tokens: 200,
        presence_penalty: 0.1,
    });

    if (!completion.choices[0]?.message?.content) {
        throw new Error("Invalid response from AI model");
    }

    return completion.choices[0].message.content;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const hash = searchParams.get("hash");

        if (!hash) {
            return NextResponse.json(
                { error: "Transaction hash is required" },
            );
        }

        let transactionData = await fetchTransactionFromQdrant(hash);

        if (!transactionData) {
            const fetched = await fetchPolkadotTransaction(hash);
            transactionData = fetched.transaction;
            await storeTransactionInQdrant(hash, transactionData);
        }

        const explanation = await analyzeTransaction(transactionData);

        const response: { explanation: Promise<string> | string; transaction: any } = {
            transaction: transactionData,
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
        );
    }
}

/**
 * POST Handler
 * 1) Expects a JSON body with "transaction".
 * 2) Analyzes the transaction with OpenAI.
 * 3) Does not store in Qdrant by default—add that if desired.
 */
export async function POST(req: Request) {
    try {
        if (!req.body) {
            return NextResponse.json(
                { error: "Request body is required" },
            );
        }

        const { transaction } = await req.json();

        if (!transaction) {
            return NextResponse.json(
                { error: "Transaction data is required" },
            );
        }

        const explanation = await analyzeTransaction(transaction);

        const response: { explanation: Promise<string> | string } = {
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
        );
    }
}
