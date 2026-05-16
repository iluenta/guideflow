"use client";

import React, { useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { GlobalErrorHandler } from "@/components/global-error-handler";
import { useInactivity } from "@/hooks/use-inactivity";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardTopbar } from "@/components/dashboard/Topbar";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  X,
  Home,
  CalendarCheck,
  Receipt,
  Landmark,
  MoreHorizontal,
  Calendar,
  BarChart3,
  Users,
  Settings,
  Radio,
  CreditCard,
  UserCog,
  Wallet,
  Eye,
  ShieldCheck,
  Building2,
  Bot,
} from "lucide-react";
import { TENANT_ROLE_PERMISSIONS, type TenantRole } from "@/lib/permissions";

// Items principales del bottom nav (máximo 4 + "Más")
const mobileNavMain = [
  { name: "Inicio",    href: "/dashboard",          icon: Home },
  { name: "Reservas",  href: "/dashboard/bookings", icon: CalendarCheck, resource: "reservations", action: "view" },
  { name: "Gastos",    href: "/dashboard/expenses", icon: Receipt,       resource: "finances",     action: "view" },
  { name: "Tesorería", href: "/dashboard/treasury", icon: Landmark,      resource: "finances",     action: "view" },
] as const;

// Items secundarios que van en el Drawer "Más"
const mobileNavMore = [
  { name: "Propiedades",     href: "/dashboard/properties",              icon: Building2 },
  { name: "Calendario",      href: "/dashboard/calendar",                icon: Calendar,   resource: "reservations", action: "view" },
  { name: "Analíticas",      href: "/dashboard/analytics",               icon: BarChart3,  resource: "finances",     action: "reports" },
  { name: "Accesos",         href: "/dashboard/analytics/links",         icon: Eye,        resource: "guests",       action: "view" },
  { name: "Equipo",          href: "/dashboard/team",                    icon: Users,      resource: "members",      action: "invite" },
  { name: "Seguridad",       href: "/dashboard/security",                icon: ShieldCheck, resource: "settings",   action: "view" },
  { name: "Ajustes",         href: "/dashboard/settings",                icon: Settings,   resource: "settings",    action: "edit" },
  { name: "Canales",         href: "/dashboard/settings/channels",       icon: Radio,      resource: "settings",    action: "edit" },
  { name: "Métodos de pago", href: "/dashboard/settings/payment-methods", icon: CreditCard, resource: "settings",  action: "edit" },
  { name: "Proveedores",     href: "/dashboard/settings/providers",      icon: UserCog,    resource: "settings",    action: "edit" },
  { name: "Cuentas",         href: "/dashboard/settings/accounts",       icon: Wallet,     resource: "finances",    action: "view" },
  { name: "Uso IA",          href: "/dashboard/settings/ai-usage",      icon: Bot,        resource: "settings",    action: "view" },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get('year');
  const withYear = (path: string) => yearParam ? `${path}?year=${yearParam}` : path;
  const { profile, loading: profileLoading } = useUserProfile();

  const tenantRole = (profile?.tenant_role ?? 'viewer') as TenantRole;

  function isPermitted(item: object) {
    const r = 'resource' in item ? (item as { resource?: string }).resource : undefined;
    const a = 'action'   in item ? (item as { action?:   string }).action   : undefined;
    if (!r) return true;
    const perms = TENANT_ROLE_PERMISSIONS[tenantRole]?.[r as keyof typeof TENANT_ROLE_PERMISSIONS.owner] as Record<string, boolean> | undefined;
    return perms?.[a as string] === true;
  }

  const visibleMain = mobileNavMain.filter(isPermitted);
  const visibleMore = mobileNavMore.filter(isPermitted);

  useInactivity({ timeoutMinutes: 1440 });

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/login");
    } catch {
      router.push("/auth/login");
    }
  };

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <div className="min-h-screen bg-landing-bg font-poppins flex flex-col">
      <GlobalErrorHandler />

      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-400 text-yellow-900 text-center text-xs font-bold py-1 tracking-widest uppercase pointer-events-none select-none">
          ⚠ ENTORNO LOCAL — DESARROLLO ⚠
        </div>
      )}


      {/* SIDEBAR (Desktop) */}
      <DashboardSidebar
        collapsed={collapsed}
        profile={profile}
        onSignOut={handleSignOut}
      />

      {/* MAIN CONTENT AREA */}
      <div className={cn(
        "transition-all duration-300 ease-in-out flex-1 w-full flex flex-col min-h-0",
        collapsed ? "lg:pl-[72px]" : "lg:pl-[248px]"
      )}>
        <DashboardTopbar
          onMenuClick={() => {}}
          profile={profile}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 w-full max-w-full px-4 sm:px-8 pb-24 lg:pb-8">
          <div className="w-full max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>

        {/* Sidebar Toggle Button (Floating) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "fixed bottom-8 left-[calc(248px-12px)] z-50 hidden lg:flex h-6 w-6 items-center justify-center rounded-full bg-white border border-landing-rule shadow-md text-landing-ink-mute hover:text-landing-navy transition-all duration-300",
            collapsed && "left-[calc(72px-12px)] rotate-180"
          )}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>


      {/* BOTTOM NAV (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-landing-rule-soft lg:hidden safe-area-pb">
        <div className="grid grid-cols-5 h-16">
          {visibleMain.map(item => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={withYear(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-colors",
                  active ? "text-landing-navy" : "text-landing-ink-mute"
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "stroke-[2.25]")} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
          {/* Relleno si hay menos de 4 items visibles (ej. viewer sin finanzas) */}
          {visibleMain.length < 4 && Array.from({ length: 4 - visibleMain.length }).map((_, i) => (
            <div key={i} />
          ))}
          {/* Botón Más */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-landing-ink-mute"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">Más</span>
          </button>
        </div>
      </nav>

      {/* DRAWER "Más" */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <VisuallyHidden.Root>
            <DrawerTitle>Más opciones</DrawerTitle>
          </VisuallyHidden.Root>
          <div className="p-4 pb-8 space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 pb-2">
              Más opciones
            </p>
            {visibleMore.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={withYear(item.href)}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 rounded-xl text-[14px] font-medium transition-colors",
                    "h-12 min-h-[44px]",
                    active
                      ? "text-landing-navy bg-[#eef2fb]"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-landing-navy" : "text-slate-400")} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
