"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        setError("A apărut o eroare. Verifică adresa de email și încearcă din nou.");
        return;
      }

      setSent(true);
    } catch {
      setError("A apărut o eroare. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <span className="text-4xl">💰</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Vibe Budget</h1>
          <p className="text-gray-500 text-sm mt-1">Resetare parolă</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-6 mb-6">
              <p className="text-green-800 font-medium">Email trimis!</p>
              <p className="text-green-700 text-sm mt-1">
                Verifică inbox-ul pentru <strong>{email}</strong> și urmează
                instrucțiunile pentru a-ți reseta parola.
              </p>
            </div>
            <p className="text-gray-500 text-sm">
              Nu ai primit emailul? Verifică folderul Spam sau{" "}
              <button
                onClick={() => setSent(false)}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                încearcă din nou
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 text-sm mb-6">
              Introdu adresa de email asociată contului tău și îți vom trimite un
              link pentru a-ți reseta parola.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@exemplu.com"
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
                {loading ? "Se trimite..." : "Trimite link de resetare"}
              </button>
            </form>
          </>
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
