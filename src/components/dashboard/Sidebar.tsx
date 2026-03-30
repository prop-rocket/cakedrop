"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Palette,
  Receipt,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Employees", href: "/dashboard/employees", icon: Users },
  { label: "Branches", href: "/dashboard/branches", icon: Building2 },
  { label: "Orders", href: "/dashboard/orders", icon: Package },
  { label: "Cards", href: "/dashboard/cards", icon: Palette },
  { label: "Billing", href: "/dashboard/billing", icon: Receipt },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-button bg-primary text-white font-heading font-bold text-lg">
            C
          </div>
          <span className="font-heading text-xl font-bold text-white">
            CakeDrop
          </span>
        </div>

        {/* Navigation */}
        <nav className="mt-4 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-button px-3 py-2.5 text-sm font-body transition-colors ${
                  active
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <Icon
                  size={20}
                  className={active ? "text-primary" : "text-gray-500"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User info + sign out */}
      <div className="border-t border-white/10 px-4 py-4">
        {session?.user && (
          <div className="mb-3">
            <p className="truncate font-heading text-sm font-semibold text-white">
              {session.user.name}
            </p>
            <p className="truncate text-xs text-gray-400 font-body">
              {session.user.email}
            </p>
            {(session.user as any).companyName && (
              <p className="mt-0.5 truncate text-xs text-gray-500 font-body">
                {(session.user as any).companyName}
              </p>
            )}
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-button px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-red-400 font-body"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-button bg-dark p-2 text-white shadow-lg md:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={22} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-dark transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-5 text-gray-400 hover:text-white"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 bg-dark md:block">
        {sidebarContent}
      </aside>
    </>
  );
}
