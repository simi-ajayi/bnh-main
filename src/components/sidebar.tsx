"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bot,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/actions";
import type { Role, SessionUser } from "@/lib/auth";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["user", "admin", "superadmin"] },
  { href: "/submissions/new", label: "Monthly update", icon: FileText, roles: ["user", "admin", "superadmin"] },
  { href: "/compliance", label: "Compliance agent", icon: Bot, roles: ["admin", "superadmin"] },
  { href: "/governance", label: "Governance prompt", icon: ShieldCheck, roles: ["admin", "superadmin"] },
  { href: "/access", label: "Access control", icon: UsersRound, roles: ["superadmin"] },
] as const;

function Navigation({ session, close }: { session: SessionUser; close?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="mt-9 space-y-1.5">
      {items
        .filter((item) => (item.roles as readonly Role[]).includes(session.role))
        .map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={`sidebar-link group ${active ? "sidebar-link-active" : ""}`}
            >
              <Icon className="sidebar-icon" size={18} strokeWidth={1.7} />
              <span>{item.label}</span>
              <ChevronRight className="ml-auto opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-60" size={14} />
            </Link>
          );
        })}
    </nav>
  );
}

function SidebarContent({ session, close }: { session: SessionUser; close?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xs font-bold tracking-[0.16em] text-[#172338]">BNH</div>
        <div>
          <p className="text-sm font-semibold tracking-[-0.01em] text-white">Portfolio Intelligence</p>
          <p className="mt-0.5 text-[11px] text-white/40">Executive reporting</p>
        </div>
      </div>
      <Navigation session={session} close={close} />
      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="mb-4 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d7b56d] text-xs font-semibold text-[#172338]">
            {session.name.split(" ").map((part) => part[0]).join("")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{session.name}</p>
            <p className="mt-0.5 text-[11px] capitalize text-white/40">{session.role}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button className="sidebar-link group w-full" type="submit">
            <LogOut className="sidebar-icon group-hover:-translate-x-0.5" size={18} strokeWidth={1.7} />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar({ session }: { session: SessionUser }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] bg-[#111c2d] px-5 py-7 lg:block">
        <SidebarContent session={session} />
      </aside>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#172338] text-[10px] font-bold tracking-[0.14em] text-white">BNH</div>
          <span className="text-sm font-semibold text-slate-900">Portfolio Intelligence</span>
        </div>
        <button className="icon-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
      </header>
      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-[285px] bg-[#111c2d] px-5 py-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button className="absolute left-[232px] top-5 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18} /></button>
            <SidebarContent session={session} close={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
