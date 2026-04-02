"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Currency {
  id: string;
  user_id: string;
  code: string;
  name: string;
  symbol: string;
  created_at: string;
}

const PRESETS = [
  { code: "RON", name: "Leu Românesc", symbol: "lei" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "USD", name: "Dolar American", symbol: "$" },
  { code: "GBP", name: "Liră Sterlină", symbol: "£" },
];

const emptyForm = { code: "", name: "", symbol: "" };

export default function CurrenciesPage() {
  const { user, loading: authLoading } = useAuth();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [addingCode, setAddingCode] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchCurrencies();
  }, [user]);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/currencies");
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare"); return; }
      setCurrencies(data.currencies);
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = async (preset: typeof PRESETS[0]) => {
    setAddingCode(preset.code);
    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preset),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare"); return; }
      toast.success(`${preset.code} adăugat!`);
      fetchCurrencies();
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setAddingCode(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare"); return; }
      toast.success("Valută adăugată!");
      setShowForm(false);
      setFormData(emptyForm);
      fetchCurrencies();
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (currency: Currency) => {
    if (!confirm(`Ștergi valuta "${currency.code}"?`)) return;
    setDeletingId(currency.id);
    try {
      const res = await fetch(`/api/currencies/${currency.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare"); return; }
      toast.success("Valută ștearsă!");
      fetchCurrencies();
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setDeletingId(null);
    }
  };

  const existingCodes = new Set(currencies.map((c) => c.code));

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💱 Valute</h1>

          <p className="text-sm text-gray-600 mt-3">
            Gestionează valutele folosite în tranzacții
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Adaugă
        </button>
      </div>

      {/* Preseturi */}
      <div className="bg-white shadow rounded-lg px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Preset:</span>
          {PRESETS.map((preset) => {
            const exists = existingCodes.has(preset.code);
            return (
              <button
                key={preset.code}
                onClick={() => !exists && handlePreset(preset)}
                disabled={exists || addingCode === preset.code}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  exists
                    ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                    : "border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100"
                }`}
              >
                <span className="font-mono">{preset.symbol}</span>
                <span>{preset.code}</span>
                {exists && <span className="text-xs">✓</span>}
                {addingCode === preset.code && <span className="text-xs">...</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-600">Se încarcă...</div>
        ) : currencies.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-3xl mb-3">💱</p>
            <p className="font-medium text-gray-900">Nu ai adăugat nicio valută</p>
            <p className="text-sm text-gray-600 mt-1">
              Folosește butoanele Preset sau adaugă manual
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cod</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Simbol</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nume</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {currencies.map((currency) => (
                <tr key={currency.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                      {currency.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700">{currency.symbol}</td>
                  <td className="px-4 py-3 text-gray-900">{currency.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDelete(currency)}
                        disabled={deletingId === currency.id}
                        className="text-gray-600 hover:text-red-500 px-2 py-1 rounded text-xs border border-gray-200 hover:border-red-300 transition-colors disabled:opacity-50"
                      >
                        {deletingId === currency.id ? "..." : "Șterge"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal adaugă manual */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Adaugă valută</h2>
              <button
                onClick={() => { setShowForm(false); setFormData(emptyForm); }}
                className="text-gray-400 hover:text-gray-900 text-2xl leading-none"
              >×</button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Cod valută</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  required maxLength={5} placeholder="ex: USD, EUR..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Simbol</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData((f) => ({ ...f, symbol: e.target.value }))}
                  required maxLength={5} placeholder="ex: $, €, lei..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Nume</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  required placeholder="ex: Dolar American..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormData(emptyForm); }}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? "Se salvează..." : "Salvează"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
