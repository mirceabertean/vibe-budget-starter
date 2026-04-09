import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { anthropic } from "@/lib/ai";

// ─── Tipuri pentru datele primite de la pagina de rapoarte ───────────────────

interface CategorySummary {
  categoryName: string;
  total: number;
  percentage: number;
}

interface MonthSummary {
  label: string;
  total: number;
}

interface FinancialSummary {
  period: string;
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  expensesByCategory: CategorySummary[];
  expensesByMonth: MonthSummary[];
}

// ─── Tipuri pentru răspunsul AI ──────────────────────────────────────────────

interface CoachResponse {
  healthScore: number;
  healthExplanation: string;
  tips: string[];
  positiveObservation: string;
}

// ─── Construiește prompt-ul pentru Claude ────────────────────────────────────

function buildPrompt(summary: FinancialSummary): string {
  const categoryLines = summary.expensesByCategory
    .map((c) => `  - ${c.categoryName}: ${c.total.toFixed(2)} RON (${c.percentage}%)`)
    .join("\n");

  const monthLines = summary.expensesByMonth
    .map((m) => `  - ${m.label}: ${m.total.toFixed(2)} RON`)
    .join("\n");

  return `Ești un coach financiar personal care analizează cheltuielile unui utilizator român.

DATE FINANCIARE (perioada: ${summary.period}):
- Total venituri: ${summary.totalIncome.toFixed(2)} RON
- Total cheltuieli: ${summary.totalExpenses.toFixed(2)} RON
- Balanță: ${summary.balance.toFixed(2)} RON

CHELTUIELI PE CATEGORII:
${categoryLines || "  - Fără date"}

TREND LUNAR (cheltuieli):
${monthLines || "  - Fără date"}

Analizează aceste date și răspunde STRICT în format JSON valid, fără niciun text în afara JSON-ului:

{
  "healthScore": <număr întreg 0-100>,
  "healthExplanation": "<explicație scurtă de 1-2 propoziții de ce ai dat acest scor>",
  "tips": [
    "<sfat personalizat 1 bazat pe datele reale>",
    "<sfat personalizat 2>",
    "<sfat personalizat 3>",
    "<sfat personalizat 4 opțional>",
    "<sfat personalizat 5 opțional>"
  ],
  "positiveObservation": "<un lucru concret pe care utilizatorul îl face bine>"
}

Reguli importante:
- Scorul 0-100: 0-40 = situație dificilă, 41-70 = ok dar poate fi îmbunătățit, 71-100 = sănătos financiar
- Sfaturile să fie specifice și bazate pe datele reale (menționează categorii și sume concrete)
- Dacă balanța este negativă, reflectă asta în scor și sfaturi
- Dacă nu există date suficiente, dă un scor neutru de 50 și sfaturi generale
- Răspunde în limba română
- Returnează DOAR JSON, fără markdown, fără explicații extra`;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Autentificare
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validare body
    const body = await request.json();
    const summary: FinancialSummary = body.summary;

    if (!summary || typeof summary !== "object") {
      return NextResponse.json({ error: "Rezumatul financiar lipsește" }, { status: 400 });
    }

    // 3. Apel Claude AI
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: buildPrompt(summary),
        },
      ],
    });

    // 4. Parsare răspuns JSON — extrage primul obiect {...} din răspuns
    const rawText =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[AI_FINANCIAL_COACH] No JSON object found. Raw:", rawText);
      return NextResponse.json(
        { error: "Răspunsul AI nu a putut fi procesat. Încearcă din nou." },
        { status: 500 }
      );
    }

    let coachResponse: CoachResponse;
    try {
      coachResponse = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("[AI_FINANCIAL_COACH] JSON parse error. Raw:", jsonMatch[0]);
      return NextResponse.json(
        { error: "Răspunsul AI nu a putut fi procesat. Încearcă din nou." },
        { status: 500 }
      );
    }

    // 5. Validare câmpuri obligatorii
    if (
      typeof coachResponse.healthScore !== "number" ||
      !coachResponse.healthExplanation ||
      !Array.isArray(coachResponse.tips) ||
      !coachResponse.positiveObservation
    ) {
      return NextResponse.json(
        { error: "Răspunsul AI este incomplet. Încearcă din nou." },
        { status: 500 }
      );
    }

    // 6. Răspuns
    return NextResponse.json({ coach: coachResponse });
  } catch (error) {
    console.error("[AI_FINANCIAL_COACH] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
