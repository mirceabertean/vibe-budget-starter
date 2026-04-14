"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccess("Parola a fost resetată cu succes. Te poți autentifica acum.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError("Email sau parolă incorectă.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("A apărut o eroare. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <span className="text-4xl">💰</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Vibe Budget</h1>
          <p className="text-gray-500 text-sm mt-1">Conectează-te la contul tău</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@exemplu.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Parolă</label>
              <Link href="/forgot-password" className="text-xs text-teal-600 hover:text-teal-700">
                Am uitat parola
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {success && (
            <p className="text-green-700 text-sm bg-green-50 rounded-lg px-4 py-2">
              {success}
            </p>
          )}

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-lg py-3 mt-1 transition-colors"
          >
            {loading ? "Se conectează..." : "Conectează-te"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Nu ai cont?{" "}
          <Link href="/register" className="text-teal-600 hover:text-teal-700 font-medium">
            Creează unul
          </Link>
        </p>
      </div>
    </div>
  );
}
