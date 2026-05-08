"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { GlobalErrorHandler } from "@/components/global-error-handler";
import { useInactivity } from "@/hooks/use-inactivity";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardTopbar } from "@/components/dashboard/Topbar";
import { X, Home, Building2, BarChart3, Users, Settings } from "lucide-react";
import { TENANT_ROLE_PERMISSIONS, type TenantRole } from "@/lib/permissions";

// Entradas del bottom nav móvil (subconjunto de las del sidebar)
const mobileNav = [
  { name: "Inicio",      href: "/dashboard",             icon: Home },
  { name: "Propiedades", href: "/dashboard/properties",  icon: Building2 },
  { name: "Analíticas",  href: "/dashboard/analytics",   icon: BarChart3,  resource: "finances",  action: "reports" },
  { name: "Equipo",      href: "/dashboard/team",         icon: Users,      resource: "members",   action: "invite" },
  { name: "Ajustes",     href: "/dashboard/settings",    icon: Settings,   resource: "settings",  action: "edit" },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();

  const tenantRole = (profile?.tenant_role ?? 'viewer') as TenantRole;
  const visibleMobileNav = mobileNav.filter(item => {
    if (!('resource' in item)) return true;
    const perms = TENANT_ROLE_PERMISSIONS[tenantRole]?.[item.resource] as Record<string, boolean> | undefined;
    return perms?.[item.action] === true;
  });

  useInactivity({ timeoutMinutes: 1440 });

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/login");
    } catch {
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-landing-bg font-poppins">
      <GlobalErrorHandler />

      {/* MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-landing-ink/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR (Desktop) */}
      <DashboardSidebar 
        collapsed={collapsed} 
        profile={profile} 
        onSignOut={handleSignOut} 
      />

      {/* MAIN CONTENT AREA */}
      <div className={cn(
        "transition-all duration-300 ease-in-out min-h-screen flex flex-col",
        collapsed ? "lg:pl-[72px]" : "lg:pl-[248px]"
      )}>
        <DashboardTopbar 
          onMenuClick={() => setMobileSidebarOpen(true)}
          profile={profile}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 p-8 pb-24 lg:pb-8 max-w-[1440px] mx-auto w-full">
          {children}
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

      {/* MOBILE SIDEBAR */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-landing-rule-soft transform transition-transform duration-300 lg:hidden",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-[72px] flex items-center justify-between px-5 border-b border-landing-rule-soft">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-landing-navy-tint rounded-lg flex items-center justify-center">
              <span className="text-landing-navy font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-landing-navy">Hospyia</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="p-2 text-landing-ink-mute hover:text-landing-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-3 flex flex-col gap-1">
          {visibleMobileNav.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-landing-navy text-white"
                    : "text-landing-ink-soft hover:bg-landing-bg-deep hover:text-landing-ink"
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* BOTTOM NAV (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-landing-rule-soft lg:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {visibleMobileNav.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px]",
                  isActive ? "text-landing-navy" : "text-landing-ink-mute"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.25]")} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}