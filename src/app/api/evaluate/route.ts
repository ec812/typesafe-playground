import { NextResponse } from "next/server";
import { TypeSafeClient, choice, noul, score } from "@typesafe-ai/sdk";
import { insertQuery } from "@/lib/db";

const client = new TypeSafeClient();

interface QuestionDef {
  type: "noul" | "choice" | "score";
  instructions: string;
  criteria?: string | Record<string, string> | string[];
}

function buildQuestion(def: QuestionDef) {
  switch (def.type) {
    case "noul":
      return noul(def.instructions);
    case "choice": {
      // Parse "key: value, key: value" string into {key: value} object
      const raw = def.criteria;
      let criteriaObj: Record<string, string>;
      if (typeof raw === "string") {
        criteriaObj = {};
        raw.split(",").forEach((pair) => {
          const [key, ...rest] = pair.split(":");
          if (key && rest.length) {
            criteriaObj[key.trim()] = rest.join(":").trim();
          }
        });
      } else {
        criteriaObj = raw as Record<string, string>;
      }
      return choice(def.instructions, criteriaObj);
    }
    case "score": {
      // Parse newline-separated string or array
      const rawCriteria = def.criteria;
      let criteriaList: string[];
      if (Array.isArray(rawCriteria)) {
        criteriaList = rawCriteria;
      } else if (typeof rawCriteria === "string") {
        criteriaList = rawCriteria.split("\n").filter((s: string) => s.trim());
      } else {
        criteriaList = [];
      }
      if (criteriaList.length < 2) {
        throw new Error("Score criteria must have at least 2 entries");
      }
      return score(def.instructions, [criteriaList[0], criteriaList[1], ...criteriaList.slice(2)]);
    }
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { state, questions, model } = body;

  if (!state || !questions || typeof questions !== "object") {
    return NextResponse.json(
      { error: "state and questions are required" },
      { status: 400 }
    );
  }

  const questionEntries = Object.entries(questions as Record<string, QuestionDef>).map(
    ([name, def]) => [name, buildQuestion(def)]
  );

  const questionMap = Object.fromEntries(questionEntries);

  const start = Date.now();
  try {
    const response = await client.systemOne({
      state,
      questions: questionMap,
      ...(model ? { model } : {}),
    });
    const duration_ms = Date.now() - start;

    // Persist to SQLite
    insertQuery({
      state: typeof state === "string" ? state : JSON.stringify(state),
      questions: JSON.stringify(questions),
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
    });
  } catch (error: unknown) {
    const duration_ms = Date.now() - start;
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message, duration_ms },
      { status: 500 }
    );
  }
}
