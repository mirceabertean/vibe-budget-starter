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
    const { data: banks, error } = await supabaseAdmin
      .from("banks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // 3. Răspuns
    return NextResponse.json({ banks });
  } catch (error) {
    console.error("[BANKS_GET] Error:", error);
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
    const { name, color } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Numele băncii este obligatoriu" }, { status: 400 });
    }

    // 3. Creare
    const { data: bank, error } = await supabaseAdmin
      .from("banks")
      .insert({
        id: createId(),
        user_id: user.id,
        name: name.trim(),
        color: color || "#6366f1",
      })
      .select()
      .single();

    if (error) throw error;

    // 4. Răspuns
    return NextResponse.json({ bank }, { status: 201 });
  } catch (error) {
    console.error("[BANKS_POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
