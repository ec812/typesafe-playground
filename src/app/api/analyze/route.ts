import { NextResponse } from "next/server";
import { TypeSafeClient, choice, noul, score } from "@typesafe-ai/sdk";
import { insertQuery } from "@/lib/db";

const client = new TypeSafeClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { state, ticker } = body;

  if (!state || typeof state !== "string") {
    return NextResponse.json(
      { error: "state text is required" },
      { status: 400 }
    );
  }

  const start = Date.now();
  try {
    const response = await client.systemOne({
      state,
      questions: {
        sentiment: choice("Overall market sentiment of this text", {
          positive: "Bullish or optimistic tone",
          negative: "Bearish or pessimistic tone",
          neutral: "Factual reporting without clear bias",
          mixed: "Contains both positive and negative signals",
        }),
        material: noul(
          "This news is material and likely to move the stock price"
        ),
        urgency: score(
          "How time-sensitive is this information for an investor?",
          [
            "Low — background context, no rush",
            "Moderate — worth reviewing within days",
            "High — needs attention today or tomorrow",
            "Critical — market-moving, act now",
          ]
        ),
        sector: choice(
          "Which sector or theme does this primarily relate to?",
          {
            earnings: "Revenue, profit, or financial results",
            growth: "Product launches, market expansion, partnerships",
            regulation: "Government policy, legal, compliance",
            macro: "Interest rates, inflation, economic indicators",
            sentiment: "Analyst ratings, upgrades/downgrades, rumors",
            operations: "Supply chain, management, restructuring",
          }
        ),
        suggested_action: choice(
          "What action should a retail investor consider?",
          {
            buy: "Accumulate or start a position",
            hold: "Maintain current position, no change needed",
            sell: "Reduce or exit position",
            watch: "Monitor for further developments",
          }
        ),
      },
    });

    const duration_ms = Date.now() - start;

    insertQuery({
      state,
      questions: JSON.stringify({
        sentiment: { type: "choice", instructions: "Overall market sentiment" },
        material: { type: "noul", instructions: "Material news" },
        urgency: { type: "score", instructions: "Time sensitivity" },
        sector: { type: "choice", instructions: "Sector/theme" },
        suggested_action: { type: "choice", instructions: "Investor action" },
      }),
      model: response.model,
      response: JSON.stringify(response),
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      duration_ms,
    });

    return NextResponse.json({
      model: response.model,
      answers: response.answers,
      usage: response.usage,
      duration_ms,
      ticker: ticker || null,
    });
  } catch (error: unknown) {
    const duration_ms = Date.now() - start;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message, duration_ms },
      { status: 500 }
    );
  }
}
