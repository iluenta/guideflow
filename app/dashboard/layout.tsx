"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { GlobalErrorHandler } from "@/components/global-error-handler";
import { useInactivity } from "@/hooks/use-inactivity";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardTopbar } from "@/components/dashboard/Topbar";
import { X } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();

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

        <main className="flex-1 p-8 max-w-[1440px] mx-auto w-full">
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
      {/* (Simplified for now, can be improved) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-landing-rule-soft transform transition-transform duration-300 lg:hidden",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile sidebar content would go here, similar to desktop but always expanded */}
        <div className="h-[72px] flex items-center justify-between px-5 border-b border-landing-rule-soft">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-landing-navy-tint rounded-lg flex items-center justify-center">
                 <span className="text-landing-navy font-bold">H</span>
              </div>
              <span className="font-bold text-landing-navy">Hospyia</span>
           </div>
           <button onClick={() => setMobileSidebarOpen(false)} className="p-2 text-landing-ink-mute hover:text-landing-ink">
              <X className="h-5 w-5" />
           </button>
        </div>
        <div className="p-4">
           {/* Navigation items can be reused here */}
           <p className="text-xs text-landing-ink-mute text-center mt-10 italic">Navegación móvil en desarrollo...</p>
        </div>
      </aside>
    </div>
  );
}