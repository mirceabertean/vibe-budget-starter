"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./logout-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/transactions", label: "Tranzacții", icon: "💳" },
  { href: "/dashboard/banks", label: "Bănci", icon: "🏦" },
  { href: "/dashboard/categories", label: "Categorii", icon: "📁" },
  { href: "/dashboard/currencies", label: "Valute", icon: "💱" },
  { href: "/dashboard/upload", label: "Upload", icon: "📤" },
  { href: "/dashboard/reports", label: "Rapoarte", icon: "📈" },
  { href: "/dashboard/settings", label: "Setări cont", icon: "⚙️" },
];

interface MobileHeaderProps {
  displayName: string;
}

export function MobileHeader({ displayName }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Închide drawer-ul la schimbarea paginii
  useEffect(() => { setOpen(false); }, [pathname]);

  // Blochează scroll când drawer-ul e deschis
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Header mobil */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow-sm border-b border-gray-200 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            aria-label="Deschide meniul"
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mr-1"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-xl">💰</span>
          <span className="font-bold text-gray-900">Vibe Budget</span>
        </div>
        <LogoutButton />
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header drawer */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-lg font-bold text-gray-900">Vibe Budget</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Închide meniul"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigare */}
        <nav className="flex-1 py-4 overflow-y-auto px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors mb-0.5 ${
                  isActive
                    ? "bg-teal-50 text-teal-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-gray-200 p-3">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-gray-500">Conectat ca</p>
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </>
  );
}
