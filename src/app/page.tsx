"use client";

import { useState, useCallback } from "react";

type QuestionType = "noul" | "choice" | "score";

interface QuestionDef {
  type: QuestionType;
  instructions: string;
  criteria?: string; // comma-separated for choice, newline-separated for score
}

interface EvalResult {
  model: string;
  answers: Record<string, unknown>;
  usage: { input_tokens: number; output_tokens: number };
  duration_ms: number;
}

interface HistoryEntry {
  id: number;
  state: string;
  questions: string;
  model: string | null;
  response: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  duration_ms: number | null;
  created_at: string;
}

const PRESETS: Record<string, { state: string; questions: QuestionDef[] }> = {
  "Support Ticket": {
    state:
      "Hi, I've been trying to connect my Stripe account for 3 days and it keeps failing. I'm losing sales. Please help ASAP.",
    questions: [
      { type: "choice", instructions: "Which team should handle this?", criteria: "billing: Payment issues, technical: Bugs/integration, sales: Pricing" },
      { type: "score", instructions: "How frustrated the customer appears", criteria: "Calm, just stating facts\nFrustrated but civil\nVery angry, strong language" },
      { type: "noul", instructions: "This message conveys urgency" },
    ],
  },
  "Sentiment Analysis": {
    state: "Just tried the new feature — it's actually amazing. This is exactly what I've been waiting for. Best update in months.",
    questions: [
      { type: "noul", instructions: "The text expresses a positive sentiment" },
      { type: "score", instructions: "How enthusiastic the tone is", criteria: "Neutral/indifferent\nSomewhat enthusiastic\nVery enthusiastic, strong praise" },
      { type: "choice", instructions: "What is the primary emotion?", criteria: "joy: Positive emotion, anger: Negative emotion, surprise: Unexpected reaction, neutral: No strong emotion" },
    ],
  },
  "Product Review": {
    state: "The battery life is decent but the screen quality disappointed me. For the price, I expected better. Camera is solid though.",
    questions: [
      { type: "noul", instructions: "Overall sentiment is positive" },
      { type: "choice", instructions: "What is this mainly about?", criteria: "hardware: Physical product features, price: Value for money, comparison: Comparing to alternatives" },
      { type: "score", instructions: "How satisfied is the reviewer?", criteria: "Very dissatisfied\nNeutral/Mixed\nVery satisfied" },
    ],
  },
};

export default function Home() {
  const [state, setState] = useState("");
  const [questions, setQuestions] = useState<QuestionDef[]>([
    { type: "noul", instructions: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const addQuestion = useCallback(() => {
    setQuestions((q) => [...q, { type: "noul", instructions: "" }]);
  }, []);

  const removeQuestion = useCallback((idx: number) => {
    setQuestions((q) => q.filter((_, i) => i !== idx));
  }, []);

  const updateQuestion = useCallback(
    (idx: number, patch: Partial<QuestionDef>) => {
      setQuestions((q) =>
        q.map((item, i) => (i === idx ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const loadPreset = useCallback((name: string) => {
    const preset = PRESETS[name];
    if (preset) {
      setState(preset.state);
      setQuestions(preset.questions);
      setResult(null);
      setError(null);
    }
  }, []);

  const runEvaluation = useCallback(async () => {
    if (!state.trim()) return;

    // Build questions object
    const questionsObj: Record<string, QuestionDef> = {};
    questions.forEach((q, i) => {
      if (!q.instructions.trim()) return;
      const key = q.type === "noul" ? `q${i}` : q.type === "choice" ? `q${i}` : `q${i}`;
      questionsObj[key] = { type: q.type, instructions: q.instructions };
      if (q.type === "choice" && q.criteria) {
        questionsObj[key].criteria = q.criteria;
      }
      if (q.type === "score" && q.criteria) {
        questionsObj[key].criteria = q.criteria;
      }
    });

    if (Object.keys(questionsObj).length === 0) {
      setError("Add at least one question with instructions");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, questions: questionsObj }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Request failed");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [state, questions]);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/history");
    const data = await res.json();
    setHistory(data);
    setShowHistory(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              TypeSafe Playground
            </h1>
            <p className="text-neutral-400 text-sm">
              Test the TypeSafe AI API with custom state and questions. Results
              are persisted to SQLite.
            </p>
          </div>
          <a
            href="/analyze"
            className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors"
          >
            Stock Analyzer →
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Presets */}
            <div className="flex gap-2 flex-wrap">
              {Object.keys(PRESETS).map((name) => (
                <button
                  key={name}
                  onClick={() => loadPreset(name)}
                  className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors border border-neutral-700"
                >
                  {name}
                </button>
              ))}
            </div>

            {/* State Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                State (text to evaluate)
              </label>
              <textarea
                value={state}
                onChange={(e) => setState(e.target.value)}
                rows={4}
                placeholder="Paste or type the text to evaluate..."
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              />
            </div>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-neutral-300">
                  Questions
                </label>
                <button
                  onClick={addQuestion}
                  className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
                >
                  + Add Question
                </button>
              </div>

              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <select
                        value={q.type}
                        onChange={(e) =>
                          updateQuestion(idx, {
                            type: e.target.value as QuestionType,
                          })
                        }
                        className="bg-neutral-800 border border-neutral-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="noul">Noul (Yes/No)</option>
                        <option value="choice">Choice (Category)</option>
                        <option value="score">Score (Rating)</option>
                      </select>

                      <input
                        value={q.instructions}
                        onChange={(e) =>
                          updateQuestion(idx, {
                            instructions: e.target.value,
                          })
                        }
                        placeholder="Your question..."
                        className="flex-1 bg-neutral-800 border border-neutral-600 rounded-md px-3 py-1.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      {questions.length > 1 && (
                        <button
                          onClick={() => removeQuestion(idx)}
                          className="text-neutral-500 hover:text-red-400 transition-colors text-lg"
                          title="Remove question"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {q.type === "choice" && (
                      <input
                        value={q.criteria ?? ""}
                        onChange={(e) =>
                          updateQuestion(idx, { criteria: e.target.value })
                        }
                        placeholder="Categories (key: description, key: description)"
                        className="w-full bg-neutral-800 border border-neutral-600 rounded-md px-3 py-1.5 text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    {q.type === "score" && (
                      <textarea
                        value={q.criteria ?? ""}
                        onChange={(e) =>
                          updateQuestion(idx, { criteria: e.target.value })
                        }
                        rows={3}
                        placeholder="Score criteria (one per line)&#10;Calm, just stating facts&#10;Frustrated but civil&#10;Very angry"
                        className="w-full bg-neutral-800 border border-neutral-600 rounded-md px-3 py-1.5 text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={runEvaluation}
              disabled={loading || !state.trim()}
              className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Evaluating..." : "Run Evaluation"}
            </button>

            {/* Error */}
            {error && (
              <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Results</h2>
                  <div className="flex items-center gap-4 text-xs text-neutral-400">
                    <span className="font-mono">{result.model}</span>
                    <span>
                      {result.duration_ms}ms
                    </span>
                    <span>
                      {result.usage.input_tokens} in / {result.usage.output_tokens} out
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(result.answers).map(([name, answer]) => {
                    const a = answer as Record<string, unknown>;
                    return (
                      <div
                        key={name}
                        className="bg-neutral-800 rounded-md p-4 border border-neutral-700"
                      >
                        <div className="text-xs text-neutral-400 font-mono mb-2">
                          {name} ({a.type as string})
                        </div>

                        {a.type === "noul" && (
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold font-mono">
                              {typeof a.noul === "number" ? a.noul.toFixed(3) : String(a.noul)}
                            </div>
                            <div className="flex-1 h-2 bg-neutral-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{
                                  width: `${typeof a.noul === "number" ? a.noul * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-neutral-400">
                              {typeof a.noul === "number" && a.noul > 0.5 ? "Yes" : "No"}
                            </span>
                          </div>
                        )}

                        {a.type === "choice" && (
                          <div className="space-y-2">
                            <div className="text-xl font-bold capitalize">
                              {String(a.choice)}
                              {typeof a.confidence === "number" && (
                                <span className="text-sm font-normal text-neutral-400 ml-2">
                                  ({(a.confidence as number * 100).toFixed(0)}% confidence)
                                </span>
                              )}
                            </div>
                            {!!a.probabilities && typeof a.probabilities === "object" && (
                              <div className="space-y-1">
                                {Object.entries(
                                  a.probabilities as Record<string, number>
                                ).map(([label, prob]) => (
                                  <div key={label} className="flex items-center gap-2">
                                    <span className="text-xs text-neutral-400 w-20 text-right font-mono">
                                      {label}
                                    </span>
                                    <div className="flex-1 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${prob * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-mono text-neutral-500 w-10">
                                      {(prob * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {a.type === "score" && (
                          <div className="space-y-2">
                            <div className="text-xl font-bold font-mono">
                              {typeof a.score === "number" ? a.score.toFixed(3) : String(a.score)}
                              {typeof a.confidence === "number" && (
                                <span className="text-sm font-normal text-neutral-400 ml-2">
                                  (confidence {(a.confidence as number * 100).toFixed(0)}%)
                                </span>
                              )}
                            </div>
                            {!!a.legend && typeof a.legend === "object" && (
                              <div className="flex gap-4 text-xs">
                                {Object.entries(
                                  a.legend as Record<string, string>
                                ).map(([k, v]) => (
                                  <span key={k} className="text-neutral-400">
                                    <span className="font-mono text-neutral-300">{k}:</span> {v}
                                  </span>
                                ))}
                              </div>
                            )}
                            {!!a.probabilities && typeof a.probabilities === "object" && (
                              <div className="space-y-1">
                                {Object.entries(
                                  a.probabilities as Record<string, number>
                                ).map(([score, prob]) => (
                                  <div key={score} className="flex items-center gap-2">
                                    <span className="text-xs text-neutral-400 w-4 text-right font-mono">
                                      {score}
                                    </span>
                                    <div className="flex-1 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${prob * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-mono text-neutral-500 w-10">
                                      {(prob * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Raw JSON toggle */}
                <details className="group">
                  <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
                    Raw JSON
                  </summary>
                  <pre className="mt-2 p-3 bg-neutral-950 rounded-md text-xs font-mono text-neutral-400 overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>

          {/* Right: History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-300">History</h2>
              <button
                onClick={loadHistory}
                className="px-3 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors border border-neutral-700"
              >
                {showHistory ? "Refresh" : "Load"}
              </button>
            </div>

            {showHistory && history.length === 0 && (
              <p className="text-xs text-neutral-500">No queries yet.</p>
            )}

            {showHistory && history.length > 0 && (
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {history.map((entry) => {
                  let parsed: EvalResult | null = null;
                  try {
                    parsed = entry.response ? JSON.parse(entry.response) : null;
                  } catch {}

                  return (
                    <div
                      key={entry.id}
                      className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-xs space-y-2 hover:border-neutral-600 transition-colors cursor-pointer"
                      onClick={() => {
                        setState(entry.state);
                        try {
                          const qs = JSON.parse(entry.questions) as Record<string, QuestionDef>;
                          setQuestions(
                            Object.values(qs).map((q) => ({
                              type: q.type,
                              instructions: q.instructions,
                              criteria: q.criteria
                                ? typeof q.criteria === "object"
                                  ? JSON.stringify(q.criteria)
                                  : q.criteria
                                : undefined,
                            }))
                          );
                        } catch {}
                      }}
                    >
                      <div className="text-neutral-400 line-clamp-2">
                        {entry.state.slice(0, 100)}
                        {entry.state.length > 100 ? "..." : ""}
                      </div>
                      <div className="flex items-center gap-2 text-neutral-500">
                        <span className="font-mono">{entry.model}</span>
                        {entry.duration_ms != null && <span>{entry.duration_ms}ms</span>}
                        {entry.input_tokens != null && (
                          <span>
                            {entry.input_tokens}/{entry.output_tokens}
                          </span>
                        )}
                      </div>
                      {parsed && (
                        <div className="space-y-1">
                          {Object.entries(parsed.answers).map(([k, v]) => {
                            const a = v as Record<string, unknown>;
                            const val =
                              a.type === "noul"
                                ? typeof a.noul === "number" ? a.noul.toFixed(2) : String(a.noul)
                                : a.type === "choice"
                                  ? String(a.choice)
                                  : typeof a.score === "number" ? a.score.toFixed(2) : String(a.score);
                            return (
                              <div key={k} className="flex justify-between">
                                <span className="text-neutral-500 font-mono">
                                  {k}
                                </span>
                                <span className="text-neutral-300">{val}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
