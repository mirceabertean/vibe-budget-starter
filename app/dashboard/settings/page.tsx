"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.name) {
        setName(data.user.user_metadata.name);
      }
    });
  }, []);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setNameSuccess(false);

    if (!name.trim()) {
      setNameError("Numele nu poate fi gol.");
      return;
    }

    setNameLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
      if (error) {
        setNameError("A apărut o eroare. Încearcă din nou.");
        return;
      }
      setNameSuccess(true);
    } catch {
      setNameError("A apărut o eroare. Încearcă din nou.");
    } finally {
      setNameLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Parolele nu se potrivesc.");
      return;
    }

    if (password.length < 6) {
      setError("Parola trebuie să aibă minim 6 caractere.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError("A apărut o eroare. Încearcă din nou.");
        return;
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("A apărut o eroare. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Setările contului</h1>

      {/* Nume afișat */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Nume afișat</h2>
        <p className="text-sm text-gray-500 mb-5">
          Acesta apare în salutul de pe Dashboard.
        </p>

        <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameSuccess(false); }}
              required
              placeholder="Numele tău"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {nameError && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2">{nameError}</p>
          )}

          {nameSuccess && (
            <p className="text-green-700 text-sm bg-green-50 rounded-lg px-4 py-2">
              Numele a fost actualizat cu succes!
            </p>
          )}

          <button
            type="submit"
            disabled={nameLoading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-lg py-3 transition-colors"
          >
            {nameLoading ? "Se salvează..." : "Salvează numele"}
          </button>
        </form>
      </div>

      {/* Schimbă parola */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Schimbă parola</h2>
        <p className="text-sm text-gray-500 mb-5">
          Parola nouă trebuie să aibă minim 6 caractere.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parolă nouă
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minim 6 caractere"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmă parola nouă
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Repetă parola nouă"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2">{error}</p>
          )}

          {success && (
            <p className="text-green-700 text-sm bg-green-50 rounded-lg px-4 py-2">
              Parola a fost schimbată cu succes!
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-lg py-3 transition-colors"
          >
            {loading ? "Se salvează..." : "Schimbă parola"}
          </button>
        </form>
      </div>
    </div>
  );
}
