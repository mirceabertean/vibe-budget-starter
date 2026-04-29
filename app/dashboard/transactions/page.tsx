"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Bank {
  id: string;
  name: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  type: "income" | "expense";
}

interface Currency {
  id: string;
  code: string;
  symbol: string;
}

interface Transaction {
  id: string;
  user_id: string;
  bank_id: string | null;
  category_id: string | null;
  date: string;
  description: string;
  amount: number;
  currency: string;
  created_at: string;
  banks: { id: string; name: string; color: string } | null;
  categories: { id: string; name: string; icon: string; type: string } | null;
}

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  description: "",
  amount: "",
  currency: "RON",
  bank_id: "",
  category_id: "",
};

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();

  // Date
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // Loading / acțiuni
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  // Filtre
  const [search, setSearch] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Selecție bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkBank, setBulkBank] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (bankFilter) params.set("bank_id", bankFilter);
      if (categoryFilter) params.set("category_id", categoryFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare la încărcare"); return; }
      setTransactions(data.transactions);
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setLoading(false);
    }
  }, [bankFilter, categoryFilter, dateFrom, dateTo, search]);

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
  }, [user, fetchTransactions]);

  useEffect(() => {
    if (!user) return;
    // Încarcă bănci, categorii și valute pentru select-uri
    Promise.all([
      fetch("/api/banks").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/currencies").then((r) => r.json()),
    ]).then(([banksData, categoriesData, currenciesData]) => {
      if (banksData.banks) setBanks(banksData.banks);
      if (categoriesData.categories) setCategories(categoriesData.categories);
      if (currenciesData.currencies) setCurrencies(currenciesData.currencies);
    });
  }, [user]);

  const openAdd = () => {
    setEditingTx(null);
    setFormData({
      ...emptyForm,
      date: new Date().toISOString().split("T")[0],
      currency: currencies[0]?.code || "RON",
    });
    setShowModal(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setFormData({
      date: tx.date,
      description: tx.description,
      amount: String(tx.amount),
      currency: tx.currency,
      bank_id: tx.bank_id || "",
      category_id: tx.category_id || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTx(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingTx ? `/api/transactions/${editingTx.id}` : "/api/transactions";
      const method = editingTx ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          description: formData.description,
          amount: formData.amount,
          currency: formData.currency,
          bank_id: formData.bank_id || null,
          category_id: formData.category_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare la salvare"); return; }
      toast.success(editingTx ? "Tranzacție actualizată!" : "Tranzacție adăugată!");
      closeModal();
      fetchTransactions();
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tx: Transaction) => {
    if (!confirm(`Ștergi tranzacția "${tx.description}"?`)) return;
    setDeletingId(tx.id);
    try {
      const res = await fetch(`/api/transactions/${tx.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare la ștergere"); return; }
      toast.success("Tranzacție ștearsă!");
      fetchTransactions();
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setDeletingId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setBankFilter("");
    setCategoryFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkCategory("");
    setBulkBank("");
  };

  const handleBulkSave = async () => {
    if (selectedIds.size === 0) return;
    if (bulkCategory === "" && bulkBank === "") {
      toast.error("Selectează cel puțin o categorie sau bancă de aplicat");
      return;
    }
    setBulkSaving(true);
    try {
      const updateData: Record<string, string | null> = {};
      if (bulkCategory !== "") updateData.category_id = bulkCategory === "__none__" ? null : bulkCategory;
      if (bulkBank !== "") updateData.bank_id = bulkBank === "__none__" ? null : bulkBank;

      const res = await fetch("/api/transactions/bulk-update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), ...updateData }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare la actualizare"); return; }
      toast.success(`${selectedIds.size} tranzacții actualizate!`);
      clearSelection();
      fetchTransactions();
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setBulkSaving(false);
    }
  };

  const hasFilters = search || bankFilter || categoryFilter || dateFrom || dateTo;


  const formatAmount = (amount: number, currency: string) => {
    const abs = Math.abs(amount).toLocaleString("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${amount >= 0 ? "+" : "-"}${abs} ${currency}`;
  };

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
          <h1 className="text-2xl font-bold text-gray-900">💳 Tranzacții</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestionează toate tranzacțiile tale
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Adaugă tranzacție
        </button>
      </div>

      {/* Filtre */}
      <div className="bg-white shadow rounded-lg px-4 py-3">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-600 mb-1">Caută descriere</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ex: Lidl, salariu..."
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Bancă */}
          <div className="min-w-36">
            <label className="block text-xs font-medium text-gray-600 mb-1">Bancă</label>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Toate băncile</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Categorie */}
          <div className="min-w-36">
            <label className="block text-xs font-medium text-gray-600 mb-1">Categorie</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Toate categoriile</option>
              <option value="__none__">— Fără categorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Dată de la */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">De la</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Dată până la */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Până la</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Reset */}
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Action bar bulk — apare când e cel puțin o selecție */}
      {selectedIds.size > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-teal-800 whitespace-nowrap">
            {selectedIds.size} selectate
          </span>
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="border border-teal-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Categorie: lasă neschimbat</option>
              <option value="__none__">— Fără categorie —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <select
              value={bulkBank}
              onChange={(e) => setBulkBank(e.target.value)}
              className="border border-teal-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Bancă: lasă neschimbat</option>
              <option value="__none__">— Fără bancă —</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkSave}
              disabled={bulkSaving || (bulkCategory === "" && bulkBank === "")}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              {bulkSaving ? "Se salvează..." : "Aplică"}
            </button>
            <button
              onClick={clearSelection}
              className="border border-teal-300 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              Anulează
            </button>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-600">Se încarcă...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-3xl mb-3">💳</p>
            <p className="font-medium text-gray-900">
              {hasFilters ? "Nicio tranzacție nu corespunde filtrelor" : "Nu ai nicio tranzacție"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {hasFilters ? "Modifică filtrele sau resetează-le" : "Adaugă prima tranzacție folosind butonul de mai sus"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={transactions.length > 0 && selectedIds.size === transactions.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Dată</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Descriere</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Sumă</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Bancă</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categorie</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isExpense = tx.amount < 0;
                const amountColor = isExpense ? "#ef4444" : "#16a34a";

                return (
                  <tr
                    key={tx.id}
                    className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${selectedIds.has(tx.id) ? "bg-teal-50 hover:bg-teal-50" : ""}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(tx.id)}
                        onChange={() => toggleSelect(tx.id)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                    </td>
                    {/* Dată */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(tx.date + "T00:00:00").toLocaleDateString("ro-RO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Descriere */}
                    <td className="px-4 py-3 text-gray-900 max-w-xs">
                      <span className="truncate block" title={tx.description}>
                        {tx.description}
                      </span>
                    </td>

                    {/* Sumă */}
                    <td className="px-4 py-3 text-right font-mono font-semibold whitespace-nowrap">
                      <span style={{ color: amountColor }}>
                        {formatAmount(tx.amount, tx.currency)}
                      </span>
                    </td>

                    {/* Bancă */}
                    <td className="px-4 py-3">
                      {tx.banks ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tx.banks.color }}
                          />
                          <span className="text-gray-700">{tx.banks.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Categorie */}
                    <td className="px-4 py-3">
                      {tx.categories ? (
                        <div className="flex items-center gap-1.5">
                          <span>{tx.categories.icon}</span>
                          <span className="text-gray-700">{tx.categories.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Acțiuni */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(tx)}
                          className="text-teal-600 hover:text-teal-700 px-2 py-1 rounded text-xs border border-teal-200 hover:border-teal-300 transition-colors"
                        >
                          Editează
                        </button>
                        <button
                          onClick={() => handleDelete(tx)}
                          disabled={deletingId === tx.id}
                          className="text-gray-600 hover:text-red-500 px-2 py-1 rounded text-xs border border-gray-200 hover:border-red-300 transition-colors disabled:opacity-50"
                        >
                          {deletingId === tx.id ? "..." : "Șterge"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Total tranzacții */}
      {!loading && transactions.length > 0 && (
        <p className="text-xs text-gray-500 text-right">
          {transactions.length} tranzacți{transactions.length === 1 ? "e" : "i"}
          {hasFilters ? " (filtrate)" : " în total"}
        </p>
      )}

      {/* Modal adaugă / editează */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTx ? "Editează tranzacție" : "Adaugă tranzacție"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-900 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              {/* Dată */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Dată</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Descriere */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Descriere</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  required
                  placeholder="ex: Cumpărături Lidl, Salariu..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Sumă + Valută */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Sumă</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData((f) => ({ ...f, amount: e.target.value }))}
                    required
                    step="0.01"
                    placeholder="-45.00 sau 1500.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Valută</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {currencies.length === 0 ? (
                      <option value="RON">RON</option>
                    ) : (
                      currencies.map((c) => (
                        <option key={c.id} value={c.code}>{c.code}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Bancă */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Bancă <span className="text-gray-400 font-normal">(opțional)</span>
                </label>
                <select
                  value={formData.bank_id}
                  onChange={(e) => setFormData((f) => ({ ...f, bank_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">— Fără bancă —</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Categorie */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Categorie <span className="text-gray-400 font-normal">(opțional)</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData((f) => ({ ...f, category_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">— Fără categorie —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Butoane */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={saving}
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
