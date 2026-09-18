"use client";

import { useState, useCallback } from "react";

interface AnalysisResult {
  model: string;
  answers: Record<string, unknown>;
  usage: { input_tokens: number; output_tokens: number };
  duration_ms: number;
}

interface HistoryEntry {
  id: number;
  state: string;
  ticker: string | null;
  response: string | null;
  duration_ms: number | null;
  created_at: string;
}

const TICKER_PRESETS = [
  { ticker: "AAPL", name: "Apple" },
  { ticker: "NVDA", name: "Nvidia" },
  { ticker: "TSLA", name: "Tesla" },
  { ticker: "0700.HK", name: "Tencent" },
  { ticker: "9988.HK", name: "Alibaba" },
];

const SAMPLE_NEWS = `Tesla stock dropped 8% after earnings miss. Revenue came in at $24.3B vs $25.1B expected. EPS was $0.52 vs $0.62 expected. CEO blamed supply chain issues in China and said new Gigafactory timeline may slip to Q2. Short interest is up 12% this month. However, autonomous driving division reported record pilot miles and regulatory approval in two new states. Analyst consensus price target remains at $285.`;

function AnswerCard({ name, answer }: { name: string; answer: Record<string, unknown> }) {
  const type = answer.type as string;

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 space-y-2">
      <div className="text-xs text-neutral-400 font-mono uppercase tracking-wider">
        {name.replace(/_/g, " ")}
      </div>

      {type === "noul" && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold font-mono">
              {typeof answer.noul === "number" ? answer.noul.toFixed(3) : String(answer.noul)}
            </div>
            <div className="flex-1">
              <div className="h-3 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    typeof answer.noul === "number" && answer.noul > 0.7
                      ? "bg-emerald-500"
                      : typeof answer.noul === "number" && answer.noul > 0.4
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${typeof answer.noul === "number" ? answer.noul * 100 : 0}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium min-w-[3rem] text-right">
              {typeof answer.noul === "number" && answer.noul > 0.5 ? "YES" : "NO"}
            </span>
          </div>
        </div>
      )}

      {type === "choice" && (
        <div className="space-y-3">
          <div className="text-xl font-bold capitalize">
            {String(answer.choice)}
            {typeof answer.confidence === "number" && (
              <span className="text-sm font-normal text-neutral-400 ml-2">
                {(answer.confidence as number * 100).toFixed(0)}% confidence
              </span>
            )}
          </div>
          {!!answer.probabilities && typeof answer.probabilities === "object" && (
            <div className="space-y-1.5">
              {Object.entries(answer.probabilities as Record<string, number>)
                .sort(([, a], [, b]) => b - a)
                .map(([label, prob]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400 w-24 text-right font-mono truncate">
                      {label}
                    </span>
                    <div className="flex-1 h-2 bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          label === String(answer.choice) ? "bg-blue-500" : "bg-neutral-600"
                        }`}
                        style={{ width: `${prob * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-neutral-500 w-12">
                      {(prob * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {type === "score" && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold font-mono">
              {typeof answer.score === "number" ? answer.score.toFixed(2) : String(answer.score)}
            </div>
            <span className="text-sm text-neutral-400">
              / {(answer.legend && typeof answer.legend === "object" ? Object.keys(answer.legend as Record<string, string>).length : 3) - 1}
            </span>
            {typeof answer.confidence === "number" && (
              <span className="text-sm text-neutral-400 ml-2">
                {(answer.confidence as number * 100).toFixed(0)}% confidence
              </span>
            )}
          </div>
          {!!answer.legend && typeof answer.legend === "object" && (
            <div className="flex gap-3 text-xs">
              {Object.entries(answer.legend as Record<string, string>).map(([k, v]) => (
                <span key={k} className="text-neutral-400">
                  <span className="font-mono text-neutral-300">{k}:</span> {v}
                </span>
              ))}
            </div>
          )}
          {!!answer.probabilities && typeof answer.probabilities === "object" && (
            <div className="flex gap-1 h-6">
              {Object.entries(answer.probabilities as Record<string, number>).map(([score, prob]) => (
                <div
                  key={score}
                  className="bg-blue-500 rounded-sm transition-all duration-500"
                  style={{ width: `${prob * 100}%`, minWidth: prob > 0 ? "2px" : "0" }}
                  title={`${score}: ${(prob * 100).toFixed(0)}%`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  const [text, setText] = useState("");
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const analyze = useCallback(async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const state = ticker.trim()
      ? `[${ticker.trim().toUpperCase()}] ${text}`
      : text;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, ticker: ticker.trim().toUpperCase() || null }),
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
  }, [text, ticker]);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/analyze/history");
    const data = await res.json();
    setHistory(data);
    setShowHistory(true);
  }, []);

  const loadSample = useCallback(() => {
    setText(SAMPLE_NEWS);
    setTicker("TSLA");
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">Stock Signal Analyzer</h1>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                POWERED BY TYPESAFE
              </span>
            </div>
            <p className="text-neutral-400 text-sm">
              Paste a news article or earnings report. Get sentiment, sector impact, urgency, and a suggested action in one call.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors border border-neutral-700"
            >
              ← Playground
            </a>
            <button
              onClick={loadHistory}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors border border-neutral-700"
            >
              History
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input */}
          <div className="lg:col-span-2 space-y-4">
            {/* Ticker */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2">
                TICKER (OPTIONAL)
              </label>
              <div className="flex gap-2 flex-wrap">
                {TICKER_PRESETS.map((p) => (
                  <button
                    key={p.ticker}
                    onClick={() => setTicker(ticker === p.ticker ? "" : p.ticker)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors border ${
                      ticker === p.ticker
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    {p.ticker}
                  </button>
                ))}
                <input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="Other..."
                  className="px-3 py-1.5 text-xs font-mono bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                />
              </div>
            </div>

            {/* News Text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-neutral-400">
                  NEWS / EARNINGS TEXT
                </label>
                <button
                  onClick={loadSample}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Load sample
                </button>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                placeholder="Paste a news article, earnings report, analyst note, or any market-moving text..."
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono leading-relaxed"
              />
              <div className="flex justify-between mt-1 text-[10px] text-neutral-600">
                <span>{text.length} chars</span>
                <span>~{Math.ceil(text.length / 4)} tokens estimated</span>
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={analyze}
              disabled={loading || !text.trim()}
              className="w-full py-3.5 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                "Analyze Signal"
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-4">
                {/* Meta bar */}
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center gap-4">
                    <span className="font-mono">{result.model}</span>
                    <span>{result.duration_ms}ms</span>
                  </div>
                  <span>
                    {result.usage.input_tokens} in / {result.usage.output_tokens} out
                  </span>
                </div>

                {/* Answer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(result.answers).map(([name, answer]) => (
                    <AnswerCard key={name} name={name} answer={answer as Record<string, unknown>} />
                  ))}
                </div>

                {/* Verdict Summary */}
                {result.answers && (
                  <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-5">
                    <div className="text-xs text-neutral-400 uppercase tracking-wider mb-3 font-mono">
                      Signal Summary
                    </div>
                    <div className="text-sm text-neutral-300 leading-relaxed">
                      {(() => {
                        const answers = result.answers;
                        const parts: string[] = [];

                        const action = answers.suggested_action as Record<string, unknown> | undefined;
                        if (action?.type === "choice") {
                          parts.push(`Action: ${(action.choice as string).toUpperCase()}`);
                        }

                        const sentiment = answers.sentiment as Record<string, unknown> | undefined;
                        if (sentiment?.type === "choice") {
                          parts.push(`Sentiment: ${String(sentiment.choice)}`);
                        }

                        const urgency = answers.urgency as Record<string, unknown> | undefined;
                        if (urgency?.type === "score") {
                          parts.push(`Urgency: ${typeof urgency.score === "number" ? urgency.score.toFixed(2) : String(urgency.score)}`);
                        }

                        const material = answers.material as Record<string, unknown> | undefined;
                        if (material?.type === "noul") {
                          parts.push(`Material: ${typeof material.noul === "number" && material.noul > 0.5 ? "Yes" : "No"}`);
                        }

                        return parts.join(" · ");
                      })()}
                    </div>
                  </div>
                )}

                {/* Raw JSON */}
                <details className="group">
                  <summary className="text-xs text-neutral-600 cursor-pointer hover:text-neutral-400 transition-colors">
                    Raw JSON
                  </summary>
                  <pre className="mt-2 p-4 bg-neutral-950 rounded-md text-xs font-mono text-neutral-400 overflow-x-auto border border-neutral-800">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>

          {/* Right: History */}
          <div className="space-y-4">
            <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Recent Analyses
            </h2>

            {!showHistory && (
              <p className="text-xs text-neutral-600">
                Click History to load past analyses.
              </p>
            )}

            {showHistory && history.length === 0 && (
              <p className="text-xs text-neutral-600">No analyses yet.</p>
            )}

            {showHistory && history.length > 0 && (
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {history.map((entry) => {
                  let parsed: AnalysisResult | null = null;
                  try {
                    parsed = entry.response ? JSON.parse(entry.response) : null;
                  } catch {}

                  return (
                    <div
                      key={entry.id}
                      className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-xs space-y-2 hover:border-neutral-600 transition-colors cursor-pointer"
                      onClick={() => {
                        setText(entry.state);
                        if (entry.ticker) setTicker(entry.ticker);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        {entry.ticker && (
                          <span className="font-mono text-blue-400">{entry.ticker}</span>
                        )}
                        <span className="text-neutral-600 font-mono text-[10px]">
                          {entry.duration_ms}ms
                        </span>
                      </div>
                      <div className="text-neutral-500 line-clamp-2">
                        {entry.state.slice(0, 120)}
                        {entry.state.length > 120 ? "..." : ""}
                      </div>
                      {parsed?.answers && (
                        <div className="flex gap-3 text-[10px]">
                          {Object.entries(parsed.answers).slice(0, 4).map(([k, v]) => {
                            const a = v as Record<string, unknown>;
                            const val =
                              a.type === "noul"
                                ? typeof a.noul === "number" ? (a.noul > 0.5 ? "Y" : "N") : "?"
                                : a.type === "choice"
                                  ? String(a.choice).slice(0, 8)
                                  : typeof a.score === "number" ? a.score.toFixed(1) : "?";
                            return (
                              <span key={k} className="text-neutral-500">
                                <span className="font-mono">{k.slice(0, 6)}:</span>{" "}
                                <span className="text-neutral-300">{val}</span>
                              </span>
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
