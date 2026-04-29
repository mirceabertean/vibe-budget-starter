"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { StatsCard } from "./_components/stats-card";
import { StatsSkeleton } from "./_components/stats-skeleton";

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  currentMonthIncome: number;
  currentMonthExpenses: number;
  currentMonthBalance: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Eroare la încărcarea statisticilor");
        return;
      }
      setStats(data.stats);
    } catch (err) {
      console.error("[DashboardPage] Error:", err);
      setError("A apărut o eroare neașteptată");
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) =>
    `${amount.toLocaleString("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} RON`;

  const currentMonth = new Date().toLocaleDateString("ro-RO", {
    month: "long",
    year: "numeric",
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Se încarcă...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bun venit, {user?.user_metadata?.name || user?.email?.split("@")[0] || "Utilizator"}!
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Rezumatul financiar pentru {currentMonth}
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <StatsSkeleton />
      ) : error ? (
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-2 text-sm text-teal-600 hover:underline"
          >
            Reîncarcă
          </button>
        </div>
      ) : stats ? (
        <>
          {/* Luna curentă */}
          <div>
            <h2 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">
              Luna curentă
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                title="Venituri luna aceasta"
                value={`+${formatAmount(stats.currentMonthIncome)}`}
                color="#16a34a"
              />
              <StatsCard
                title="Cheltuieli luna aceasta"
                value={`-${formatAmount(stats.currentMonthExpenses)}`}
                color="#ef4444"
              />
              <StatsCard
                title="Sold luna aceasta"
                value={formatAmount(stats.currentMonthBalance)}
                color={stats.currentMonthBalance >= 0 ? "#0d9488" : "#ef4444"}
              />
            </div>
          </div>

          {/* Total general */}
          <div>
            <h2 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">
              Total general
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Venituri"
                value={formatAmount(stats.totalIncome)}
                color="#16a34a"
              />
              <StatsCard
                title="Total Cheltuieli"
                value={formatAmount(stats.totalExpenses)}
                color="#ef4444"
              />
              <StatsCard
                title="Sold Total"
                value={formatAmount(stats.balance)}
                color={stats.balance >= 0 ? "#0d9488" : "#ef4444"}
              />
              <StatsCard
                title="Nr. Tranzacții"
                value={stats.transactionCount.toString()}
              />
            </div>
          </div>
        </>
      ) : null}

      {/* Onboarding (fără date) sau Acțiuni rapide (cu date) */}
      {stats && stats.transactionCount === 0 ? (
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-6">
          <h2 className="text-base font-semibold text-teal-900 mb-4">
            👋 Bun venit! Iată cum începi:
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-start gap-3 flex-1">
              <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Adaugă o bancă</p>
                <p className="text-xs text-gray-500 mt-0.5">ING, BCR, Revolut sau orice alt cont</p>
                <Link href="/dashboard/banks" className="text-xs text-teal-600 hover:underline font-medium mt-1 inline-block">Mergi la Bănci →</Link>
              </div>
            </div>
            <div className="flex items-start gap-3 flex-1">
              <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Importă extrasul bancar</p>
                <p className="text-xs text-gray-500 mt-0.5">CSV sau Excel — detectare automată</p>
                <Link href="/dashboard/upload" className="text-xs text-teal-600 hover:underline font-medium mt-1 inline-block">Mergi la Import →</Link>
              </div>
            </div>
            <div className="flex items-start gap-3 flex-1">
              <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Explorează rapoartele</p>
                <p className="text-xs text-gray-500 mt-0.5">Grafice și recomandări AI</p>
                <Link href="/dashboard/reports" className="text-xs text-teal-600 hover:underline font-medium mt-1 inline-block">Mergi la Rapoarte →</Link>
              </div>
            </div>
          </div>
        </div>
      ) : stats && stats.transactionCount > 0 ? (
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard/upload"
            className="flex-1 bg-white shadow rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow border border-gray-100"
          >
            <span className="text-3xl">📤</span>
            <div>
              <p className="font-semibold text-gray-900">Importă extras bancar</p>
              <p className="text-sm text-gray-500">CSV sau Excel — Revolut, ING, BT</p>
            </div>
          </Link>
          <Link
            href="/dashboard/reports"
            className="flex-1 bg-white shadow rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow border border-gray-100"
          >
            <span className="text-3xl">📈</span>
            <div>
              <p className="font-semibold text-gray-900">Rapoarte și AI Coach</p>
              <p className="text-sm text-gray-500">Analiză și recomandări personalizate</p>
            </div>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
