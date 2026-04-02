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
    const { name, type, icon, color } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Numele categoriei este obligatoriu" }, { status: 400 });
    }

    // 3. Actualizare (doar categorii non-sistem)
    const { data: category, error } = await supabaseAdmin
      .from("categories")
      .update({
        name: name.trim(),
        type,
        icon: icon || "📁",
        color: color || "#6366f1",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("is_system_category", false)
      .select()
      .single();

    if (error || !category) {
      return NextResponse.json({ error: "Categoria nu a fost găsită" }, { status: 404 });
    }

    // 4. Răspuns
    return NextResponse.json({ category });
  } catch (error) {
    console.error("[CATEGORIES_PUT] Error:", error);
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

    // 2. Ștergere (doar categorii non-sistem)
    const { data: category, error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("is_system_category", false)
      .select()
      .single();

    if (error || !category) {
      return NextResponse.json({ error: "Categoria nu poate fi ștearsă" }, { status: 404 });
    }

    // 3. Răspuns
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CATEGORIES_DELETE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
