"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase setează automat sesiunea din hash-ul URL-ului (access_token)
    // Așteptăm să fie gata înainte să permitem resetarea
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
        setError("A apărut o eroare. Linkul de resetare poate fi expirat — solicită unul nou.");
        return;
      }

      // Logout după resetare, redirecționăm la login
      await supabase.auth.signOut();
      router.push("/login?reset=success");
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
          <p className="text-gray-500 text-sm mt-1">Setează o parolă nouă</p>
        </div>

        {!sessionReady ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">Se verifică linkul de resetare...</p>
            <p className="text-gray-400 text-xs mt-2">
              Dacă pagina nu se încarcă, linkul poate fi expirat.{" "}
              <Link href="/forgot-password" className="text-teal-600 hover:text-teal-700">
                Solicită un link nou
              </Link>
              .
            </p>
          </div>
        ) : (
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
                Confirmă parola
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
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-lg py-3 mt-1 transition-colors"
            >
              {loading ? "Se salvează..." : "Salvează parola nouă"}
            </button>
          </form>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
            Înapoi la autentificare
          </Link>
        </p>
      </div>
    </div>
  );
}
