"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// ─── Tipuri ──────────────────────────────────────────────────────────────────

type Period = "current_month" | "last_3_months" | "last_6_months" | "all";

interface CategoryExpense {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  total: number;
  percentage: number;
}

interface MonthExpense {
  month: string;
  label: string;
  total: number;
}

interface ReportsData {
  expensesByCategory: CategoryExpense[];
  expensesByMonth: MonthExpense[];
  totalExpenses: number;
  totalIncome: number;
}

interface CoachResponse {
  healthScore: number;
  healthExplanation: string;
  tips: string[];
  positiveObservation: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDateRange(period: Period): { date_from: string; date_to: string } | null {
  if (period === "all") return null;

  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  if (period === "current_month") {
    return {
      date_from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
      date_to: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
    };
  }
  if (period === "last_3_months") {
    return {
      date_from: fmt(new Date(today.getFullYear(), today.getMonth() - 2, 1)),
      date_to: fmt(today),
    };
  }
  // last_6_months
  return {
    date_from: fmt(new Date(today.getFullYear(), today.getMonth() - 5, 1)),
    date_to: fmt(today),
  };
}

function formatCurrency(value: number): string {
  return (
    value.toLocaleString("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " RON"
  );
}

// Culoarea scorului: roșu < 40, galben < 70, verde >= 70
function scoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-yellow-500";
  return "text-red-600";
}

function scoreBg(score: number): string {
  if (score >= 70) return "bg-green-50 border-green-200";
  if (score >= 40) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

function scoreBarColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-yellow-400";
  return "bg-red-500";
}

// ─── Componentă ──────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "current_month", label: "Luna curentă" },
  { value: "last_3_months", label: "Ultimele 3 luni" },
  { value: "last_6_months", label: "Ultimele 6 luni" },
  { value: "all", label: "Tot" },
];

const PERIOD_LABELS: Record<Period, string> = {
  current_month: "luna curentă",
  last_3_months: "ultimele 3 luni",
  last_6_months: "ultimele 6 luni",
  all: "toate tranzacțiile",
};

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();

  const [period, setPeriod] = useState<Period>("current_month");
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Coach
  const [coachResult, setCoachResult] = useState<CoachResponse | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Resetează rezultatul AI când se schimbă perioada
    setCoachResult(null);
    setCoachError(null);
    try {
      const range = getDateRange(period);
      const params = new URLSearchParams();
      if (range) {
        params.set("date_from", range.date_from);
        params.set("date_to", range.date_to);
      }
      const res = await fetch(`/api/dashboard/reports?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la încărcarea rapoartelor");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchReports();
    }
  }, [authLoading, user, fetchReports]);

  // Trimite datele curente la AI pentru analiză
  const handleAnalyze = async () => {
    if (!data) return;
    setCoachLoading(true);
    setCoachError(null);
    setCoachResult(null);
    try {
      const balance = data.totalIncome - data.totalExpenses;
      const summary = {
        period: PERIOD_LABELS[period],
        totalExpenses: data.totalExpenses,
        totalIncome: data.totalIncome,
        balance,
        expensesByCategory: data.expensesByCategory.map((c) => ({
          categoryName: c.categoryName,
          total: c.total,
          percentage: c.percentage,
        })),
        expensesByMonth: data.expensesByMonth.map((m) => ({
          label: m.label,
          total: m.total,
        })),
      };

      const res = await fetch("/api/ai/financial-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la analiza AI");
      setCoachResult(json.coach);
    } catch (err) {
      setCoachError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setCoachLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Se încarcă...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapoarte</h1>
        <p className="text-sm text-gray-500 mt-1">Vizualizează cheltuielile și veniturile tale</p>
      </div>

      {/* Selector perioadă */}
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              period === opt.value
                ? "bg-teal-600 text-white border-teal-600 font-medium"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Eroare date */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading date */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-400">Se încarcă datele...</p>
        </div>
      )}

      {/* Date */}
      {!loading && data && (
        <>
          {/* Carduri sumar */}
          {(() => {
            const balance = data.totalIncome - data.totalExpenses;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <p className="text-sm text-gray-500 mb-1">Total cheltuieli</p>
                  <p className="text-2xl font-bold text-red-600">
                    -{formatCurrency(data.totalExpenses)}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <p className="text-sm text-gray-500 mb-1">Total venituri</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{formatCurrency(data.totalIncome)}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <p className="text-sm text-gray-500 mb-1">Balanță</p>
                  <p
                    className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {balance >= 0 ? "+" : ""}
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Stare goală */}
          {data.expensesByCategory.length === 0 && data.expensesByMonth.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-gray-400 text-lg">Nu există cheltuieli în această perioadă.</p>
              <p className="text-gray-300 text-sm mt-2">
                Încearcă să selectezi o altă perioadă sau importă tranzacții.
              </p>
            </div>
          ) : (
            <>
              {/* Grafice */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart — cheltuieli pe categorii */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h2 className="text-base font-semibold text-gray-800 mb-4">
                    Cheltuieli pe categorii
                  </h2>
                  {data.expensesByCategory.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-12">
                      Nu există date pentru această perioadă.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={data.expensesByCategory}
                          dataKey="total"
                          nameKey="categoryName"
                          cx="50%"
                          cy="45%"
                          outerRadius={100}
                          label={({ percentage }) => `${percentage}%`}
                          labelLine={false}
                        >
                          {data.expensesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.categoryColor} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: unknown) => [formatCurrency(value as number), "Total"]}
                        />
                        <Legend
                          formatter={(value) => (
                            <span className="text-sm text-gray-700">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Bar chart — cheltuieli pe luni */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h2 className="text-base font-semibold text-gray-800 mb-4">
                    Cheltuieli pe luni
                  </h2>
                  {data.expensesByMonth.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-12">
                      Nu există date pentru această perioadă.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={data.expensesByMonth}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) =>
                            v.toLocaleString("ro-RO", { maximumFractionDigits: 0 })
                          }
                        />
                        <Tooltip
                          formatter={(value: unknown) => [formatCurrency(value as number), "Cheltuieli"]}
                          cursor={{ fill: "#f0fdfa" }}
                        />
                        <Bar dataKey="total" fill="#0d9488" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Buton Analizează + Coach AI */}
              <div className="space-y-4">
                {/* Buton */}
                {!coachResult && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleAnalyze}
                      disabled={coachLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-medium rounded-xl shadow-sm hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {coachLoading ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                          Se analizează...
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          Analizează cheltuielile
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Eroare AI */}
                {coachError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                    {coachError}
                  </div>
                )}

                {/* Card rezultat AI */}
                {coachResult && (
                  <div className={`rounded-xl border p-6 space-y-5 ${scoreBg(coachResult.healthScore)}`}>
                    {/* Header card */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          ✨ AI Financial Coach
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Analiză bazată pe {PERIOD_LABELS[period]}
                        </p>
                      </div>
                      <button
                        onClick={handleAnalyze}
                        disabled={coachLoading}
                        className="text-sm text-teal-600 hover:text-teal-700 underline disabled:opacity-50"
                      >
                        Reanalizează
                      </button>
                    </div>

                    {/* Health Score */}
                    <div className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Scor sănătate financiară
                        </span>
                        <span className={`text-3xl font-bold ${scoreColor(coachResult.healthScore)}`}>
                          {coachResult.healthScore}
                          <span className="text-base font-normal text-gray-400">/100</span>
                        </span>
                      </div>
                      {/* Bară progres */}
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-700 ${scoreBarColor(coachResult.healthScore)}`}
                          style={{ width: `${coachResult.healthScore}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600">{coachResult.healthExplanation}</p>
                    </div>

                    {/* Observație pozitivă */}
                    <div className="bg-white rounded-xl p-4 shadow-sm flex gap-3">
                      <span className="text-xl shrink-0">🌟</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                          Ce faci bine
                        </p>
                        <p className="text-sm text-gray-600">{coachResult.positiveObservation}</p>
                      </div>
                    </div>

                    {/* Sfaturi */}
                    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                      <p className="text-sm font-semibold text-gray-700">💡 Sfaturi personalizate</p>
                      <ul className="space-y-2">
                        {coachResult.tips.map((tip, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-600">
                            <span className="text-teal-500 font-bold shrink-0">{i + 1}.</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
