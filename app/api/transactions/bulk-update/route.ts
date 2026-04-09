import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest) {
  try {
    // 1. Autentificare
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validare
    const body = await request.json();
    const { ids, category_id, bank_id } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Lista de ID-uri este obligatorie" }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Includem doar câmpurile trimise explicit (undefined = nu modificăm)
    if (category_id !== undefined) updateData.category_id = category_id;
    if (bank_id !== undefined) updateData.bank_id = bank_id;

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json({ error: "Nicio modificare specificată" }, { status: 400 });
    }

    // 3. Update bulk
    const { error } = await supabaseAdmin
      .from("transactions")
      .update(updateData)
      .in("id", ids)
      .eq("user_id", user.id);

    if (error) throw error;

    // 4. Răspuns
    return NextResponse.json({ updated: ids.length });
  } catch (error) {
    console.error("[TRANSACTIONS_BULK_UPDATE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
