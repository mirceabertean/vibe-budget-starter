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

    // 2. Logică
    const { data: currencies, error } = await supabaseAdmin
      .from("currencies")
      .select("*")
      .eq("user_id", user.id)
      .order("code", { ascending: true });

    if (error) throw error;

    // 3. Răspuns
    return NextResponse.json({ currencies });
  } catch (error) {
    console.error("[CURRENCIES_GET] Error:", error);
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
    const { code, name, symbol } = body;

    if (!code || code.trim() === "") {
      return NextResponse.json({ error: "Codul valutei este obligatoriu" }, { status: 400 });
    }
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Numele valutei este obligatoriu" }, { status: 400 });
    }
    if (!symbol || symbol.trim() === "") {
      return NextResponse.json({ error: "Simbolul valutei este obligatoriu" }, { status: 400 });
    }

    // 3. Verificare duplicat
    const { data: existing } = await supabaseAdmin
      .from("currencies")
      .select("id")
      .eq("user_id", user.id)
      .eq("code", code.trim().toUpperCase())
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Valuta există deja" }, { status: 400 });
    }

    // 4. Creare
    const { data: currency, error } = await supabaseAdmin
      .from("currencies")
      .insert({
        id: createId(),
        user_id: user.id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        symbol: symbol.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    // 5. Răspuns
    return NextResponse.json({ currency }, { status: 201 });
  } catch (error) {
    console.error("[CURRENCIES_POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
