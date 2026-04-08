import { UserKeyword } from "@/lib/db/schema";

/**
 * AUTO-CATEGORIZARE TRANZACȚII
 *
 * Primește descrierea unei tranzacții și lista de keyword-uri salvate de utilizator.
 * Returnează categoryId-ul potrivit sau null dacă nu se găsește niciun match.
 *
 * EXEMPLU:
 * - Descriere: "MEGA IMAGE 123 BUCURESTI"
 * - Keyword: "mega image" → categoria "Mâncare"
 * - Rezultat: categoryId-ul categoriei "Mâncare"
 */
export function autoCategorizaTransactie(
  description: string,
  keywords: UserKeyword[]
): string | null {
  const descLower = description.toLowerCase();

  for (const kw of keywords) {
    if (descLower.includes(kw.keyword.toLowerCase())) {
      return kw.categoryId;
    }
  }

  return null;
}
