import { NextResponse } from "next/server";
import { OpenAI } from "openai";

import { ApiPromise, WsProvider } from "@polkadot/api";
import { typesBundleForPolkadot } from "@crustio/type-definitions";

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

async function createPolkadotApiInstance() {
    const wsProvider = new WsProvider("wss://rpc.crust.network");

    const api = await ApiPromise.create({
        provider: wsProvider,
        typesBundle: typesBundleForPolkadot,
    });
    console.log("Polkadot API is ready with Crust types");
    return api;
}

// Fetch Polkadot transaction data from Subscan
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

// Analyze the fetched transaction using OpenAI
async function analyzeTransaction(transaction: any): Promise<string> | string {
    const completion = await openai.chat.completions.create({
        model: "elyn/2.0-flash",
        messages: [
            {
                role: "system",
                content: `You are a Polkadot blockchain transaction analyzer. Provide a brief 4-5 line analysis covering:

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

        await createPolkadotApiInstance();
        const transaction = await fetchPolkadotTransaction(hash);
        const explanation = await analyzeTransaction(transaction);

        const response: { explanation: Promise<string> | string; transaction: { transaction: any } } = {
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
        );
    }
}

// POST handler
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
