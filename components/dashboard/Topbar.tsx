"use client";

import React from "react";
import { Bell, Search, Menu, Settings, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  onMenuClick: () => void;
  profile: any;
  onSignOut: () => void;
}

export const DashboardTopbar = ({ onMenuClick, profile, onSignOut }: TopbarProps) => {
  return (
    <header className="sticky top-0 z-40 h-[72px] bg-landing-bg/85 backdrop-blur-xl border-b border-landing-rule-soft flex items-center justify-between px-8">
      {/* Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-landing-bg-deep transition-colors"
        >
          <Menu className="h-5 w-5 text-landing-ink-soft" />
        </button>
        
        <div className="hidden sm:flex items-center gap-2.5 font-jetbrains text-[11px] tracking-[0.1em] uppercase text-landing-ink-mute">
          <span>Hospyia</span>
          <span className="opacity-50">/</span>
          <span className="text-landing-ink">Panel</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="hidden md:flex flex-1 max-w-[420px] mx-10 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-landing-ink-mute" />
        <input 
          type="text" 
          placeholder="Buscar propiedades, reservas..." 
          className="w-full bg-landing-bg-deep border border-transparent rounded-full py-2.5 pl-11 pr-4 text-sm text-landing-ink placeholder:text-landing-ink-mute focus:outline-none focus:bg-white focus:border-landing-navy-soft focus:shadow-[0_0_0_4px_rgba(59,91,189,0.1)] transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 font-jetbrains text-[10px] px-2 py-1 bg-white border border-landing-rule rounded-md text-landing-ink-mute">⌘K</kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-landing-ink-soft hover:bg-landing-bg-deep transition-all relative">
          <Bell className="h-[18px] w-[18px] stroke-[1.75]" />
          <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-landing-mint-deep border-2 border-landing-bg"></div>
        </button>

        <div className="h-8 w-px bg-landing-rule-soft mx-1 hidden sm:block"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 p-1 pr-3 rounded-full hover:bg-landing-bg-deep transition-all">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-landing-navy to-landing-mint-deep text-white flex items-center justify-center text-[10px] font-bold">
                {profile?.full_name?.[0] || profile?.email?.[0] || "U"}
              </div>
              <span className="hidden sm:block text-xs font-medium text-landing-ink">
                {profile?.full_name?.split(' ')[0] || "Usuario"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 p-1 bg-white border border-landing-rule-soft shadow-2xl rounded-2xl">
            <div className="px-3 py-3 mb-1 bg-landing-bg-deep rounded-xl">
              <p className="text-sm font-bold text-landing-ink truncate">{profile?.full_name || "Usuario"}</p>
              <p className="text-xs text-landing-ink-mute truncate">{profile?.email}</p>
            </div>
            <DropdownMenuItem className="rounded-lg py-2 focus:bg-landing-bg-deep cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg py-2 focus:bg-landing-bg-deep cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-landing-rule-soft" />
            <DropdownMenuItem 
              onClick={onSignOut}
              className="rounded-lg py-2 text-landing-rose focus:text-landing-rose focus:bg-landing-rose-tint/30 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
