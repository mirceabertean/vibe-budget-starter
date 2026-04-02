import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getCurrentUser(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    if (error || !authUser) return null;

    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, email, name, native_currency")
      .eq("id", authUser.id)
      .limit(1);

    if (!users || users.length === 0) return null;

    return {
      id: users[0].id,
      email: users[0].email,
      name: users[0].name,
      nativeCurrency: users[0].native_currency,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}
