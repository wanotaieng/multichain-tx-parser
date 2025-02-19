import { NextRequest, NextResponse } from "next/server";

const CHAIN_ENDPOINTS = {
  aptos: "https://fullnode.mainnet.aptoslabs.com/v1",
  ripple: "https://xrplcluster.com",
  polkadot: "https://polkadot.api.subscan.io/api/scan/extrinsic",
};

// Chain-specific regex patterns for transaction hashes
const HASH_PATTERNS = {
  aptos: /^0x[a-f0-9]{64}$/i,
  ripple: /^[A-F0-9]{64}$/i,
  polkadot: /^0x[a-f0-9]{64}$/i,
};

// Chain-specific JSON structure patterns
const hasAptosStructure = (json: any): boolean => {
  return (
    typeof json === "object" &&
    json !== null &&
    (json.type === "user_transaction" ||
      json.type === "entry_function_payload") &&
    typeof json.version === "string"
  );
};

const hasRippleStructure = (json: any): boolean => {
  return (
    typeof json === "object" &&
    json !== null &&
    typeof json.TransactionType === "string" &&
    typeof json.hash === "string"
  );
};

const hasPolkadotStructure = (json: any): boolean => {
  return (
    typeof json === "object" &&
    json !== null &&
    json.transaction &&
    typeof json.transaction === "object" &&
    typeof json.transaction.extrinsic_hash === "string" &&
    json.transaction.extrinsic_hash.startsWith("0x")
  );
};

// Chain-specific API verification functions
async function verifyAptosTransaction(hash: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${CHAIN_ENDPOINTS.aptos}/transactions/by_hash/${hash}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function verifyRippleTransaction(hash: string): Promise<boolean> {
  try {
    const response = await fetch(CHAIN_ENDPOINTS.ripple, {
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

    if (!response.ok) return false;
    const data = await response.json();
    return !data.error;
  } catch {
    return false;
  }
}

async function verifyPolkadotTransaction(hash: string): Promise<boolean> {
  try {
    const response = await fetch(CHAIN_ENDPOINTS.polkadot, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.SUBSCAN_API_KEY || "",
      },
      body: JSON.stringify({
        hash: hash,
      }),
    });

    if (!response.ok) return false;
    const data = await response.json();
    return data.code === 0; // Subscan API returns code 0 for success
  } catch {
    return false;
  }
}

const VERIFY_FUNCTIONS = {
  aptos: verifyAptosTransaction,
  ripple: verifyRippleTransaction,
  polkadot: verifyPolkadotTransaction,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, input } = body;

    if (!type || !input) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const possibleChains: string[] = [];

    if (type === "hash") {
      // First check hash patterns
      for (const [chain, pattern] of Object.entries(HASH_PATTERNS)) {
        if (pattern.test(input)) {
          possibleChains.push(chain);
        }
      }

      // If we have possible chains, verify with their APIs
      if (possibleChains.length > 0) {
        const verificationResults = await Promise.all(
          possibleChains.map(async (chain) => {
            const isValid = await VERIFY_FUNCTIONS[
              chain as keyof typeof VERIFY_FUNCTIONS
            ](input);
            return { chain, isValid };
          })
        );

        // Filter to only chains that verified successfully
        const verifiedChains = verificationResults
          .filter((result) => result.isValid)
          .map((result) => result.chain);

        if (verifiedChains.length === 1) {
          return NextResponse.json({ chain: verifiedChains[0] });
        } else if (verifiedChains.length > 1) {
          // If multiple chains verify (shouldn't happen often), use the first one
          // You might want to implement additional logic here
          return NextResponse.json({ chain: verifiedChains[0] });
        }
      }
    } else if (type === "json") {
      // Parse JSON input
      let jsonData;
      try {
        jsonData = typeof input === "string" ? JSON.parse(input) : input;
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON format" },
          { status: 400 }
        );
      }

      // Check JSON structure patterns
      if (hasAptosStructure(jsonData)) {
        return NextResponse.json({ chain: "aptos" });
      } else if (hasRippleStructure(jsonData)) {
        return NextResponse.json({ chain: "ripple" });
      } else if (hasPolkadotStructure(jsonData)) {
        return NextResponse.json({ chain: "polkadot" });
      }
    }

    return NextResponse.json(
      { error: "Unable to determine blockchain type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in judge API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
