"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Bank {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

const COLORS = [
  "#6366f1", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6b7280",
];

export default function BanksPage() {
  const { user, loading: authLoading } = useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchBanks();
  }, [user]);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/banks");
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare la încărcare"); return; }
      setBanks(data.banks);
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingBank(null);
    setFormName("");
    setFormColor(COLORS[0]);
    setShowModal(true);
  };

  const openEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormName(bank.name);
    setFormColor(bank.color);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBank(null);
    setFormName("");
    setFormColor(COLORS[0]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingBank ? `/api/banks/${editingBank.id}` : "/api/banks";
      const method = editingBank ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, color: formColor }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare la salvare"); return; }

      toast.success(editingBank ? "Banca a fost actualizată!" : "Banca a fost adăugată!");
      closeModal();
      fetchBanks();
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bank: Bank) => {
    if (!confirm(`Ștergi banca "${bank.name}"?`)) return;
    setDeletingId(bank.id);
    try {
      const res = await fetch(`/api/banks/${bank.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare la ștergere"); return; }
      toast.success("Banca a fost ștearsă!");
      fetchBanks();
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setDeletingId(null);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">🏦 Bănci</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestionează conturile tale bancare
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Adaugă bancă
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-600">Se încarcă...</div>
        ) : banks.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-3xl mb-3">🏦</p>
            <p className="font-medium text-gray-900">Nu ai adăugat nicio bancă</p>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              Adaugă băncile pe care le folosești pentru a-ți organiza tranzacțiile
            </p>
            <button
              onClick={openAdd}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Adaugă prima bancă
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-12">Culoare</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nume</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Adăugată</th>
                <th className="px-4 py-3 w-32" />
              </tr>
            </thead>
            <tbody>
              {banks.map((bank) => (
                <tr
                  key={bank.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span
                      className="block w-6 h-6 rounded-full"
                      style={{ backgroundColor: bank.color }}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{bank.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(bank.created_at).toLocaleDateString("ro-RO")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(bank)}
                        className="text-teal-600 hover:text-teal-700 px-2 py-1 rounded text-xs border border-teal-200 hover:border-teal-300 transition-colors"
                      >
                        Editează
                      </button>
                      <button
                        onClick={() => handleDelete(bank)}
                        disabled={deletingId === bank.id}
                        className="text-gray-600 hover:text-red-500 px-2 py-1 rounded text-xs border border-gray-200 hover:border-red-300 transition-colors disabled:opacity-50"
                      >
                        {deletingId === bank.id ? "..." : "Șterge"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingBank ? "Editează banca" : "Adaugă bancă"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-900 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              {/* Nume */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Nume bancă
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="ex: ING, BCR, Revolut..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Culoare
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        outline: formColor === color ? `3px solid ${color}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: formColor }}
                />
                <span className="font-medium text-gray-900">
                  {formName || "Numele băncii"}
                </span>
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
