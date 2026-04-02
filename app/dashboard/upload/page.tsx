"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Bank {
  id: string;
  name: string;
  color: string;
}

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedBank, setSelectedBank] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/banks")
      .then((r) => r.json())
      .then((data) => { if (data.banks) setBanks(data.banks); });
  }, [user]);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Upload va fi funcțional în Săptămâna 5, Lecția 5.1");
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
        <h1 className="text-2xl font-bold text-gray-900">Upload Tranzacții</h1>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Înapoi la Dashboard
        </Link>
      </div>

      {/* Card form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          Importă din CSV sau Excel
        </h2>

        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          {/* Fișier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fișier
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="w-full text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Bancă */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bancă
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Selectează bancă...</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Buton */}
          <button
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors mt-1"
          >
            Upload
          </button>
        </form>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg py-16 flex flex-col items-center justify-center gap-1">
        <p className="text-gray-500 text-sm font-medium">
          Selectează un fișier pentru preview
        </p>
        <p className="text-gray-400 text-xs">
          Formatul acceptat: CSV sau Excel (.xlsx, .xls)
        </p>
      </div>
    </div>
  );
}
