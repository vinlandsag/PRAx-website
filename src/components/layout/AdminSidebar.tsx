"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "../ui/Avatar";
import { NavItem } from "./MemberSidebar";

export const adminNavItems: NavItem[] = [
  {
    label: "Review Queue",
    href: "/admin",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    label: "Task Manager",
    href: "/admin/tasks",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    label: "Members & Access",
    href: "/admin/members",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    label: "Points Rules",
    href: "/admin/rubric",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    label: "Chat Moderation",
    href: "/admin/moderation",
    badge: 5,
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
];

function AdminSidebarContent({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sidebar text-white flex flex-col justify-between shrink-0 h-screen select-none border-r border-sidebar-hover">
      {/* Brand Header */}
      <div>
        <div className="p-6 pb-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-brand-accent flex items-center justify-center font-bold text-white text-base shadow-xs group-hover:scale-105 transition-transform">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wider text-white">PRAX</span>
              <span className="text-[10px] tracking-widest text-sidebar-text uppercase font-semibold -mt-1">
                ADMIN
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              aria-label="Close navigation sidebar"
              className="lg:hidden text-sidebar-text hover:text-white p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Section Label */}
        <div className="px-6 py-2">
          <span className="text-[10px] font-bold tracking-widest text-sidebar-muted uppercase">
            ADMINISTRATE
          </span>
        </div>

        {/* Nav Links */}
        <nav aria-label="Admin navigation" className="px-3 py-1 flex flex-col gap-1">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin" || pathname === "/admin/review"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-white shadow-xs"
                    : "text-sidebar-text hover:text-white hover:bg-sidebar-hover"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? "text-white" : "text-sidebar-subtext"}>
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-accent text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Area */}
      <div className="p-4 border-t border-sidebar-hover/60 flex flex-col gap-3">
        {/* Switch to Member Workspace */}
        <Link
          href="/dashboard"
          className="px-3 py-2 rounded-xl text-xs text-sidebar-text hover:text-white hover:bg-sidebar-hover/60 flex items-center gap-2 transition-colors"
        >
          <span aria-hidden="true">→</span>
          <span className="font-medium">Member workspace</span>
        </Link>

        {/* Admin profile widget */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-sidebar-hover/30 border border-sidebar-hover/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name="Lena V." size="sm" colorScheme="orange" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">Lena V.</span>
              <span className="text-[10px] text-sidebar-subtext truncate">Administrator</span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Admin options"
            className="text-text-muted text-xs cursor-pointer hover:text-white p-1"
          >
            ···
          </button>
        </div>
      </div>
    </aside>
  );
}

export const AdminSidebar: React.FC<{ onCloseMobile?: () => void }> = (props) => (
  <React.Suspense fallback={<aside className="w-64 bg-sidebar shrink-0 h-screen" />}>
    <AdminSidebarContent {...props} />
  </React.Suspense>
);
