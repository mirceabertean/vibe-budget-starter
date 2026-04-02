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
          Bun venit, {user?.email?.split("@")[0] || "Utilizator"}!
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
                subtitle="importate total"
              />
            </div>
          </div>
        </>
      ) : null}

      {/* Navigare rapidă */}
      <div>
        <h2 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">
          Navigare rapidă
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/banks"
            className="bg-white shadow rounded-lg p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <span className="text-3xl">🏦</span>
            <div>
              <p className="font-semibold text-gray-900">Bănci</p>
              <p className="text-sm text-gray-600">Gestionează conturile bancare</p>
            </div>
          </Link>
          <Link
            href="/dashboard/categories"
            className="bg-white shadow rounded-lg p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <span className="text-3xl">📁</span>
            <div>
              <p className="font-semibold text-gray-900">Categorii</p>
              <p className="text-sm text-gray-600">Organizează tranzacțiile</p>
            </div>
          </Link>
          <Link
            href="/dashboard/currencies"
            className="bg-white shadow rounded-lg p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <span className="text-3xl">💱</span>
            <div>
              <p className="font-semibold text-gray-900">Valute</p>
              <p className="text-sm text-gray-600">Gestionează valutele</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
