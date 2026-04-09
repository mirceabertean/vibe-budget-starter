import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createId } from "@paralleldrive/cuid2";

export async function GET(request: NextRequest) {
  try {
    // 1. Autentificare
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Query params
    const { searchParams } = request.nextUrl;
    const bankId = searchParams.get("bank_id");
    const categoryId = searchParams.get("category_id");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const search = searchParams.get("search");

    // 3. Query cu JOIN-uri
    let query = supabaseAdmin
      .from("transactions")
      .select(`
        *,
        banks (id, name, color),
        categories (id, name, icon, type)
      `)
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (bankId) query = query.eq("bank_id", bankId);
    if (categoryId === "__none__") query = query.is("category_id", null);
    else if (categoryId) query = query.eq("category_id", categoryId);
    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);
    if (search) query = query.ilike("description", `%${search}%`);

    const { data: transactions, error } = await query;

    if (error) throw error;

    // 4. Răspuns
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("[TRANSACTIONS_GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autentificare
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validare
    const body = await request.json();
    const { date, description, amount, currency, bank_id, category_id } = body;

    if (!date || date.trim() === "") {
      return NextResponse.json({ error: "Data este obligatorie" }, { status: 400 });
    }
    if (!description || description.trim() === "") {
      return NextResponse.json({ error: "Descrierea este obligatorie" }, { status: 400 });
    }
    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) === 0) {
      return NextResponse.json({ error: "Suma nu poate fi zero sau invalidă" }, { status: 400 });
    }
    if (!currency || currency.trim() === "") {
      return NextResponse.json({ error: "Valuta este obligatorie" }, { status: 400 });
    }

    // Suma vine cu semn direct: negativă = cheltuială, pozitivă = venit
    const finalAmount = Number(amount);

    // 3. Creare
    const { data: transaction, error } = await supabaseAdmin
      .from("transactions")
      .insert({
        id: createId(),
        user_id: user.id,
        bank_id: bank_id || null,
        category_id: category_id || null,
        date: date.trim(),
        description: description.trim(),
        amount: finalAmount,
        currency: currency.trim().toUpperCase(),
      })
      .select(`
        *,
        banks (id, name, color),
        categories (id, name, icon, type)
      `)
      .single();

    if (error) throw error;

    // 4. Răspuns
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("[TRANSACTIONS_POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
