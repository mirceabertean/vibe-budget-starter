"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  is_system_category: boolean;
}

const ICONS = [
  "🍔", "🛒", "🏠", "🚗", "🍕", "💊", "✈️", "🛍️",
  "🎮", "🎵", "📚", "💡", "🏋️", "🐾", "🎁", "✂️",
  "🏦", "💳", "📈", "💼", "🎓", "🌿", "⚽", "🎨",
  "📱", "☎️", "💻", "🖥️", "📺", "📡", "🎬", "🎥",
  "💰", "💵", "💸", "🪙", "💎", "🏧", "📊", "🤑",
];

const COLORS = [
  "#6366f1", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6b7280",
];

interface CategoryTableProps {
  title: string;
  type: "income" | "expense";
  categories: Category[];
  onAdd: (type: "income" | "expense") => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  deletingId: string | null;
}

function CategoryTable({ title, type, categories, onAdd, onEdit, onDelete, deletingId }: CategoryTableProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {categories.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(type)}
          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          + Adaugă
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">
          Nu există categorii. Adaugă una!
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2 font-medium text-gray-600 w-12">Icon</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Nume</th>
              <th className="px-4 py-2 w-28" />
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                    style={{ backgroundColor: cat.color + "33" }}
                  >
                    {cat.icon}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-900 font-medium">
                  {cat.name}
                  {cat.is_system_category && (
                    <span className="ml-2 text-xs text-gray-400 font-normal">Sistem</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-2">
                    {!cat.is_system_category ? (
                      <>
                        <button
                          onClick={() => onEdit(cat)}
                          className="text-teal-600 hover:text-teal-700 px-2 py-1 rounded text-xs border border-teal-200 hover:border-teal-300 transition-colors"
                        >
                          Editează
                        </button>
                        <button
                          onClick={() => onDelete(cat)}
                          disabled={deletingId === cat.id}
                          className="text-gray-600 hover:text-red-500 px-2 py-1 rounded text-xs border border-gray-200 hover:border-red-300 transition-colors disabled:opacity-50"
                        >
                          {deletingId === cat.id ? "..." : "Șterge"}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 px-2 py-1">Sistem</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formIcon, setFormIcon] = useState(ICONS[0]);
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare"); return; }
      setCategories(data.categories);
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = (type: "income" | "expense") => {
    setEditingCat(null);
    setFormName("");
    setFormType(type);
    setFormIcon(ICONS[0]);
    setFormColor(COLORS[0]);
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setFormName(cat.name);
    setFormType(cat.type);
    setFormIcon(cat.icon);
    setFormColor(cat.color);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCat(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingCat ? `/api/categories/${editingCat.id}` : "/api/categories";
      const method = editingCat ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, type: formType, icon: formIcon, color: formColor }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare la salvare"); return; }
      toast.success(editingCat ? "Categorie actualizată!" : "Categorie adăugată!");
      closeModal();
      fetchCategories();
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Ștergi categoria "${cat.name}"?`)) return;
    setDeletingId(cat.id);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Eroare la ștergere"); return; }
      toast.success("Categorie ștearsă!");
      fetchCategories();
    } catch {
      toast.error("A apărut o eroare neașteptată");
    } finally {
      setDeletingId(null);
    }
  };

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  if (authLoading || loading) {
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
        <h1 className="text-2xl font-bold text-gray-900">📁 Categorii</h1>
        <p className="text-sm text-gray-600 mt-1">
          Gestionează categoriile pentru venituri și cheltuieli
        </p>
      </div>

      {/* Două tabele */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryTable
          title="💸 Cheltuieli"
          type="expense"
          categories={expense}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
        <CategoryTable
          title="💰 Venituri"
          type="income"
          categories={income}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCat ? "Editează categorie" : "Adaugă categorie"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 text-2xl leading-none">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              {/* Tip */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Tip</label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFormType("expense")}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${formType === "expense" ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    💸 Cheltuială
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("income")}
                    className={`flex-1 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${formType === "income" ? "bg-green-50 text-green-600" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    💰 Venit
                  </button>
                </div>
              </div>

              {/* Nume */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Nume categorie</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="ex: Mâncare, Salariu, Transport..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Icon picker */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Icon</label>
                <div className="grid grid-cols-8 gap-1">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormIcon(icon)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                        formIcon === icon
                          ? "bg-teal-100 ring-2 ring-teal-500"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Culoare</label>
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
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: formColor + "33" }}
                >
                  {formIcon}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{formName || "Numele categoriei"}</p>
                  <p className="text-xs text-gray-500">{formType === "income" ? "Venit" : "Cheltuială"}</p>
                </div>
              </div>

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
