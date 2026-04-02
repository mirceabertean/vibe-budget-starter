import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    // 1. Autentificare
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch toate tranzacțiile
    const { data: transactions, error } = await supabaseAdmin
      .from("transactions")
      .select("amount, date")
      .eq("user_id", user.id);

    if (error) throw error;

    // 3. Calculează statistici generale
    let totalIncome = 0;
    let totalExpenses = 0;
    let transactionCount = transactions?.length ?? 0;

    // 4. Calculează luna curentă
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    let currentMonthIncome = 0;
    let currentMonthExpenses = 0;

    for (const tx of transactions ?? []) {
      const amount = parseFloat(tx.amount);
      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpenses += Math.abs(amount);
      }

      if (tx.date >= firstDay && tx.date <= lastDay) {
        if (amount > 0) {
          currentMonthIncome += amount;
        } else {
          currentMonthExpenses += Math.abs(amount);
        }
      }
    }

    // 5. Răspuns
    return NextResponse.json({
      stats: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        transactionCount,
        currentMonthIncome,
        currentMonthExpenses,
        currentMonthBalance: currentMonthIncome - currentMonthExpenses,
      },
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
