import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "./_components/sidebar-nav";
import { LogoutButton } from "./_components/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.name || user.email?.split("@")[0] || "Utilizator";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white shadow-sm border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-200">
          <span className="text-2xl">💰</span>
          <span className="text-lg font-bold text-gray-900">Vibe Budget</span>
        </div>

        {/* Navigație */}
        <div className="flex-1 py-4 overflow-y-auto">
          <SidebarNav />
        </div>

        {/* User + Logout */}
        <div className="border-t border-gray-200 p-3">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-gray-600">Conectat ca</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header — Mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <span className="font-bold text-gray-900">Vibe Budget</span>
          </div>
          <LogoutButton />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
