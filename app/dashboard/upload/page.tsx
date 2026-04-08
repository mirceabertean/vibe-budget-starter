"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { parseCSV, parseExcel, ParsedTransaction } from "@/lib/utils/file-parser";

interface Bank {
  id: string;
  name: string;
  color: string;
}

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedBank, setSelectedBank] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ total: number; categorized: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/banks")
      .then((r) => r.json())
      .then((data) => { if (data.banks) setBanks(data.banks); });
  }, [user]);

  const handleImport = async () => {
    if (!selectedBank || parsedTransactions.length === 0) return;

    setImporting(true);
    setImportError(null);

    try {
      const transactions = parsedTransactions.map((t) => ({
        bankId: selectedBank,
        date: t.date,
        description: t.description,
        amount: t.amount,
        currency: t.currency ?? "RON",
        type: t.type === "credit" ? "income" : "expense",
      }));

      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImportError(data.error ?? "Eroare la import.");
        return;
      }

      setImportResult({ total: data.total, categorized: data.categorized });
    } catch (err: any) {
      setImportError(err.message ?? "Eroare la import.");
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParseError(null);
    setParsedTransactions([]);
    setImportError(null);
    setImportResult(null);
    setSelectedBank("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParseError(null);
    setParsedTransactions([]);
    setParsing(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      console.log("[Upload] Fișier selectat:", file.name, "ext:", ext, "size:", file.size);

      let result;

      if (ext === "csv") {
        result = await parseCSV(file);
      } else if (ext === "xlsx" || ext === "xls") {
        result = await parseExcel(file);
      } else {
        setParseError("Format nesuportat. Folosește CSV sau Excel (.xlsx, .xls).");
        setParsing(false);
        return;
      }

      console.log("[Upload] Rezultat parsare:", result);

      if (!result.success) {
        setParseError(result.error ?? "Eroare necunoscută la parsarea fișierului.");
      } else if (result.transactions.length === 0) {
        setParseError(
          `Fișierul a fost citit (${result.rowCount ?? 0} rânduri) dar nu s-au putut detecta tranzacții. Verificați consola (F12) pentru coloanele detectate.`
        );
      } else {
        setParsedTransactions(result.transactions);
      }
    } catch (err: any) {
      console.error("[Upload] Eroare parsare:", err);
      setParseError(err.message ?? "Eroare la citirea fișierului.");
    } finally {
      setParsing(false);
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

        <div className="flex flex-col gap-4">
          {/* Fișier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fișier
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
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

          {/* Buton import */}
          <button
            disabled={parsedTransactions.length === 0 || !selectedBank || importing}
            onClick={handleImport}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors mt-1 flex items-center justify-center gap-2"
          >
            {importing && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {importing
              ? "Se importă..."
              : parsedTransactions.length > 0
              ? `Importă ${parsedTransactions.length} tranzacții`
              : "Importă tranzacții"}
          </button>
        </div>
      </div>

      {/* Succes import */}
      {importResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="text-green-500 text-xl leading-none mt-0.5">✓</span>
            <div>
              <p className="text-sm font-medium text-green-800">Import finalizat cu succes</p>
              <p className="text-sm text-green-700 mt-0.5">
                {importResult.total} tranzacții importate
                {importResult.categorized > 0 && (
                  <>, <span className="font-medium">{importResult.categorized} categorizate automat</span></>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Încarcă alt fișier
            </button>
            <Link
              href="/dashboard/transactions"
              className="px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
            >
              Vezi tranzacțiile
            </Link>
          </div>
        </div>
      )}

      {/* Eroare import */}
      {importError && !importing && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-red-500 text-lg leading-none mt-0.5">✕</span>
          <div>
            <p className="text-sm font-medium text-red-700">Eroare la import</p>
            <p className="text-sm text-red-600 mt-0.5">{importError}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {parsing && (
        <div className="bg-white shadow rounded-lg py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Se procesează fișierul...</p>
        </div>
      )}

      {/* Eroare */}
      {!parsing && parseError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-red-500 text-lg leading-none mt-0.5">✕</span>
          <div>
            <p className="text-sm font-medium text-red-700">Eroare la citirea fișierului</p>
            <p className="text-sm text-red-600 mt-0.5">{parseError}</p>
          </div>
        </div>
      )}

      {/* Preview tranzacții */}
      {!parsing && !parseError && parsedTransactions.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Preview tranzacții</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Dată</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Descriere</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Sumă</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Valută</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsedTransactions.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{t.date}</td>
                    <td className="px-6 py-3 text-gray-900 max-w-xs truncate">{t.description}</td>
                    <td className={`px-6 py-3 text-right font-medium whitespace-nowrap ${t.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                      {t.amount > 0 ? "+" : ""}{t.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{t.currency ?? "RON"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Total: <span className="font-medium text-gray-700">{parsedTransactions.length} tranzacții</span> găsite în fișier
            </p>
          </div>
        </div>
      )}

      {/* Placeholder când nu e niciun fișier */}
      {!parsing && !parseError && parsedTransactions.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg py-16 flex flex-col items-center justify-center gap-1">
          <p className="text-gray-500 text-sm font-medium">
            Selectează un fișier pentru preview
          </p>
          <p className="text-gray-400 text-xs">
            Formatul acceptat: CSV sau Excel (.xlsx, .xls)
          </p>
        </div>
      )}
    </div>
  );
}
