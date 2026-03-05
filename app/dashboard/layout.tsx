"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home, Calendar, Building2, BookOpen, BarChart3, Settings,
  X, Bell, User, CalendarCheck, LogOut, ShieldCheck, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/actions/auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { GlobalErrorHandler } from "@/components/global-error-handler";
import { useInactivity } from "@/hooks/use-inactivity";
import { Logo } from "@/components/ui/logo";

const navigation = [
  { name: "Inicio", href: "/dashboard", icon: Home },
  { name: "Propiedades", href: "/dashboard/properties", icon: Building2 },
  { name: "Reservas", href: "/dashboard/bookings", icon: CalendarCheck },
  { name: "Calendario", href: "/dashboard/calendar", icon: Calendar },
  { name: "Guias", href: "/dashboard/guides", icon: BookOpen },
  { name: "Analiticas", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Seguridad", href: "/dashboard/security", icon: ShieldCheck },
  { name: "Ajustes", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();

  useInactivity({ timeoutMinutes: 1440 });

  const handleSignOut = async () => {
    try { await signOut(); router.push("/auth/login"); }
    catch { router.push("/auth/login"); }
  };

  // Ancho del sidebar: expandido 256px, colapsado 72px
  const sidebarW = collapsed ? "w-[72px]" : "w-64";
  const mainPl = collapsed ? "lg:pl-[72px]" : "lg:pl-64";

  const NavItem = ({ item, onClick }: { item: typeof navigation[0]; onClick?: () => void }) => {
    const isActive = pathname === item.href;
    return (
      <li>
        <Link
          href={item.href}
          onClick={onClick}
          title={collapsed ? item.name : undefined}
          className={cn(
            "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
            isActive
              ? "bg-[#316263] text-white shadow-md shadow-[#316263]/20"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" />

          {/* Texto — se oculta cuando está colapsado */}
          <span className={cn(
            "whitespace-nowrap overflow-hidden transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            {item.name}
          </span>

          {/* Indicador activo (punto) */}
          {isActive && !collapsed && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
          )}

          {/* Tooltip cuando está colapsado */}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg
                            opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50
                            shadow-lg transition-opacity duration-150">
              {item.name}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
            </div>
          )}
        </Link>
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <GlobalErrorHandler />

      {/* ── MOBILE OVERLAY ───────────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── MOBILE SIDEBAR ───────────────────────────────────────── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 shadow-xl",
        "transform transition-transform duration-300 lg:hidden",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={30} className="rounded-xl shadow-sm" />
            <span className="text-lg font-black text-slate-900 tracking-tight">GuideFlow</span>
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-3">
          <ul className="space-y-0.5">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} onClick={() => setMobileSidebarOpen(false)} />
            ))}
          </ul>
        </nav>
      </aside>

      {/* ── DESKTOP SIDEBAR (colapsable) ─────────────────────────── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col bg-white border-r border-slate-100",
        "transition-all duration-300 ease-in-out",
        sidebarW
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-slate-100 px-4 overflow-hidden">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <Logo size={30} className="rounded-xl shadow-sm shrink-0" />
            <span className={cn(
              "text-lg font-black text-slate-900 tracking-tight whitespace-nowrap transition-all duration-300",
              collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
            )}>
              GuideFlow
            </span>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </ul>
        </nav>

        {/* Perfil usuario */}
        <div className={cn(
          "border-t border-slate-100 p-3 overflow-hidden transition-all duration-300",
        )}>
          <div className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-xl",
            collapsed ? "justify-center" : ""
          )}>
            <div className="h-8 w-8 rounded-full bg-[#316263]/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-[#316263]" />
            </div>
            <div className={cn(
              "min-w-0 transition-all duration-300",
              collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
            )}>
              <p className="text-xs font-semibold text-slate-900 truncate">
                {profile?.full_name || profile?.email || "Usuario"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Toggle button — pegado al borde derecho del sidebar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-20 h-6 w-6 rounded-full bg-white border border-slate-200",
            "flex items-center justify-center shadow-sm",
            "text-slate-400 hover:text-[#316263] hover:border-[#316263]/30 transition-all duration-200",
            "z-10"
          )}
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronLeft className="h-3.5 w-3.5" />
          }
        </button>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className={cn("transition-all duration-300 ease-in-out", mainPl)}>

        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 lg:px-8">

          {/* Logo móvil */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex lg:hidden items-center gap-2">
              <Logo size={28} className="rounded-xl shadow-sm" />
              <span className="text-lg font-black text-slate-900 tracking-tight">GuideFlow</span>
            </Link>
          </div>

          {/* Campana + usuario */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#316263]" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#316263]/10">
                    <User className="h-4 w-4 text-[#316263]" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-[100] bg-white shadow-xl border border-slate-200">
                {profileLoading ? (
                  <div className="px-2 py-1.5 text-sm text-slate-400">Cargando...</div>
                ) : profile ? (
                  <>
                    <div className="px-2 py-1.5 text-sm">
                      <p className="font-medium text-slate-900">{profile.full_name || profile.email}</p>
                      <p className="text-xs text-slate-400">{profile.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Mi perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Configuración</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] p-4 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 lg:hidden px-4 h-20 flex items-center justify-between shadow-[0_-4px_20px_-1px_rgba(0,0,0,0.06)]">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 min-w-[56px] transition-colors",
                  isActive ? "text-[#316263]" : "text-slate-400"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  isActive ? "bg-[#316263]/10" : "hover:bg-slate-100"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}