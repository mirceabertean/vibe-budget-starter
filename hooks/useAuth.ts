/**
 * CUSTOM HOOK: useAuth
 *
 * SCOP:
 * Hook reutilizabil pentru autentificare cu Supabase.
 * Toate paginile din dashboard îl pot folosi.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AuthUser {
  id: string;
  email: string;
  user_metadata: { name?: string; [key: string]: unknown };
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error || !authUser) {
          router.push("/login");
          return;
        }

        setUser({
          id: authUser.id,
          email: authUser.email || "",
          user_metadata: authUser.user_metadata ?? {},
        });
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  return { user, loading, supabase };
}
