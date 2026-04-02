import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autentificare
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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

    const finalAmount = Number(amount);

    // 3. Actualizare
    const { data: transaction, error } = await supabaseAdmin
      .from("transactions")
      .update({
        bank_id: bank_id || null,
        category_id: category_id || null,
        date: date.trim(),
        description: description.trim(),
        amount: finalAmount,
        currency: currency.trim().toUpperCase(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select(`
        *,
        banks (id, name, color),
        categories (id, name, icon, type)
      `)
      .single();

    if (error || !transaction) {
      return NextResponse.json({ error: "Tranzacția nu a fost găsită" }, { status: 404 });
    }

    // 4. Răspuns
    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("[TRANSACTIONS_PUT] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autentificare
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 2. Ștergere
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Tranzacția nu a fost găsită" }, { status: 404 });
    }

    // 3. Răspuns
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TRANSACTIONS_DELETE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
