import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Numele lunilor în română
const LUNI = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface CategoryRow {
  id: string;
  name: string;
  color: string;
}

interface TransactionRow {
  amount: string;
  date: string;
  category_id: string | null;
  categories: CategoryRow | CategoryRow[] | null;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Autentificare
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Query params
    const { searchParams } = request.nextUrl;
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    // 3. Fetch tranzacții cu JOIN categorii
    let query = supabaseAdmin
      .from("transactions")
      .select("amount, date, category_id, categories (id, name, color)")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);

    const { data: transactions, error } = await query;
    if (error) throw error;

    // 4. Agregare
    let totalExpenses = 0;
    let totalIncome = 0;

    // Map: categoryId → { name, color, total }
    const categoryMap = new Map<string, { name: string; color: string; total: number }>();
    // Map: "YYYY-MM" → total cheltuieli
    const monthMap = new Map<string, number>();

    for (const tx of (transactions as unknown as TransactionRow[]) ?? []) {
      const amount = parseFloat(tx.amount);
      if (isNaN(amount)) continue;

      if (amount > 0) {
        totalIncome += amount;
      } else {
        const abs = Math.abs(amount);
        totalExpenses += abs;

        // Supabase poate returna categories ca obiect sau array — normalizăm
        const cat = Array.isArray(tx.categories) ? tx.categories[0] : tx.categories;

        // Grupare pe categorie
        const key = tx.category_id ?? "__none__";
        const catName = cat?.name ?? "Fără categorie";
        const catColor = cat?.color ?? "#9ca3af";

        if (categoryMap.has(key)) {
          categoryMap.get(key)!.total += abs;
        } else {
          categoryMap.set(key, { name: catName, color: catColor, total: abs });
        }

        // Grupare pe lună
        const month = tx.date.substring(0, 7); // "YYYY-MM"
        monthMap.set(month, (monthMap.get(month) ?? 0) + abs);
      }
    }

    // 5. Construiește expensesByCategory cu procentaje
    const expensesByCategory = Array.from(categoryMap.entries()).map(([id, cat]) => ({
      categoryId: id === "__none__" ? null : id,
      categoryName: cat.name,
      categoryColor: cat.color,
      total: Math.round(cat.total * 100) / 100,
      percentage:
        totalExpenses > 0 ? Math.round((cat.total / totalExpenses) * 100 * 10) / 10 : 0,
    }));

    // Sortare descrescătoare după total
    expensesByCategory.sort((a, b) => b.total - a.total);

    // 6. Construiește expensesByMonth sortat cronologic
    const expensesByMonth = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => {
        const [year, monthIdx] = month.split("-");
        const label = `${LUNI[parseInt(monthIdx) - 1]} ${year}`;
        return { month, label, total: Math.round(total * 100) / 100 };
      });

    // 7. Răspuns
    return NextResponse.json({
      expensesByCategory,
      expensesByMonth,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
    });
  } catch (error) {
    console.error("[DASHBOARD_REPORTS] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
