"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Building2, 
  CalendarCheck, 
  Calendar, 
  BarChart3, 
  ShieldCheck, 
  Settings,
  LogOut,
  User
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const navigation = [
  { name: "Inicio", href: "/dashboard", icon: Home },
  { name: "Propiedades", href: "/dashboard/properties", icon: Building2 },
  { name: "Reservas", href: "/dashboard/bookings", icon: CalendarCheck },
  { name: "Calendario", href: "/dashboard/calendar", icon: Calendar },
  { name: "Analiticas", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Seguridad", href: "/dashboard/security", icon: ShieldCheck },
  { name: "Ajustes", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  profile: any;
  onSignOut: () => void;
}

export const DashboardSidebar = ({ collapsed, profile, onSignOut }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col bg-white border-r border-landing-rule-soft transition-all duration-300 ease-in-out",
      collapsed ? "w-[72px]" : "w-[248px]"
    )}>
      {/* Header */}
      <div className="h-[72px] flex items-center gap-3 px-5 border-b border-landing-rule-soft overflow-hidden">
        <div className="w-[34px] h-[34px] flex items-center justify-center bg-landing-navy-tint rounded-xl shrink-0">
          <Logo size={22} />
        </div>
        {!collapsed && (
          <span className="text-[19px] font-bold tracking-tight text-landing-navy whitespace-nowrap">
            Hospyia
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-1 overflow-y-auto">
        {!collapsed && (
          <div className="font-jetbrains text-[10px] tracking-[0.14em] uppercase text-landing-ink-mute px-3 py-3">
            Principal
          </div>
        )}
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                    isActive 
                      ? "bg-landing-navy text-white shadow-lg shadow-landing-navy/20" 
                      : "text-landing-ink-soft hover:bg-landing-bg-deep hover:text-landing-ink"
                  )}
                >
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0 stroke-[1.75]", isActive ? "text-white" : "text-landing-ink-soft")} />
                  
                  {!collapsed && (
                    <span className="whitespace-nowrap overflow-hidden opacity-100 transition-all duration-300">
                      {item.name}
                    </span>
                  )}

                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-landing-mint" />
                  )}

                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-landing-ink text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-opacity">
                      {item.name}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Upgrade Card */}
      {!collapsed && (
        <div className="p-4 border-t border-landing-rule-soft">
          <div className="bg-gradient-to-br from-landing-navy to-landing-navy-soft text-white p-4 rounded-2xl relative overflow-hidden group cursor-pointer transition-transform hover:-translate-y-1">
            <div className="absolute -top-5 -right-5 w-20 h-20 bg-landing-mint/20 rounded-full blur-2xl"></div>
            <div className="font-jetbrains text-[10px] tracking-widest uppercase opacity-70 mb-1">Plan Pro</div>
            <h4 className="font-bold text-sm leading-tight mb-3 text-white">Sube de nivel tu gestión</h4>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-landing-mint w-2/3"></div>
            </div>
            <div className="flex justify-between font-jetbrains text-[9px] opacity-80">
              <span>2/3 Propiedades</span>
              <span>67%</span>
            </div>
          </div>
        </div>
      )}

      {/* User Section */}
      <div className="p-4 border-t border-landing-rule-soft">
        <div className={cn(
          "flex items-center gap-3 p-2.5 rounded-xl hover:bg-landing-bg-deep transition-all cursor-pointer group",
          collapsed ? "justify-center" : ""
        )}>
          <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-landing-navy to-landing-mint-deep text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm group-hover:shadow-md transition-all">
            {profile?.full_name?.[0] || profile?.email?.[0] || "U"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-landing-ink truncate">{profile?.full_name || "Usuario"}</p>
              <p className="text-[10px] text-landing-ink-mute truncate">{profile?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={onSignOut} className="p-1.5 rounded-lg text-landing-ink-mute hover:text-landing-rose hover:bg-landing-rose-tint/50 transition-all">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
