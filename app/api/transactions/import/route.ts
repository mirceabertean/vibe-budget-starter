import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createId } from "@paralleldrive/cuid2";
import { autoCategorizaTransactie } from "@/lib/auto-categorization";
import { UserKeyword } from "@/lib/db/schema";

interface ImportTransaction {
  bankId: string;
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;      // cu semn: negativ = cheltuială, pozitiv = venit
  currency: string;
  type: "income" | "expense"; // informațional
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autentificare
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validare body
    const body = await request.json();
    const { transactions } = body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: "Lista de tranzacții este obligatorie și nu poate fi goală" },
        { status: 400 }
      );
    }

    // 3. Încarcă keyword-urile utilizatorului pentru auto-categorizare
    const { data: keywords, error: keywordsError } = await supabaseAdmin
      .from("user_keywords")
      .select("*")
      .eq("user_id", user.id);

    if (keywordsError) throw keywordsError;

    const userKeywords: UserKeyword[] = keywords ?? [];

    // 4. Construiește array-ul de insert
    let categorizedCount = 0;

    const rows = transactions.map((t: ImportTransaction) => {
      const categoryId = autoCategorizaTransactie(t.description, userKeywords);
      if (categoryId) categorizedCount++;

      return {
        id: createId(),
        user_id: user.id,
        bank_id: t.bankId || null,
        category_id: categoryId,
        date: t.date,
        description: t.description.trim(),
        amount: Number(t.amount),
        currency: t.currency.trim().toUpperCase(),
      };
    });

    // 5. Insert bulk
    const { error: insertError } = await supabaseAdmin
      .from("transactions")
      .insert(rows);

    if (insertError) throw insertError;

    // 6. Răspuns
    return NextResponse.json(
      {
        message: "Import finalizat cu succes",
        total: rows.length,
        categorized: categorizedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[TRANSACTIONS_IMPORT] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
