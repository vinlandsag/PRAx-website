"use client";

import React from "react";
import Link from "next/link";
import { useWorkspace } from "@/lib/workspace/use-workspace";
import { usePathname } from "next/navigation";
import { Avatar } from "../ui/Avatar";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export const memberNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
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
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    label: "Tasks",
    href: "/tasks",
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    label: "My Submissions",
    href: "/submissions",
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
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    label: "Personal Space",
    href: "/space",
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
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
    ),
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
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
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    label: "Streaks",
    href: "/streaks",
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
          d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
        />
      </svg>
    ),
  },
  {
    label: "Chat",
    href: "/chat",
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
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
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
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
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
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function MemberSidebarContent({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const { data } = useWorkspace();

  return (
    <aside className="w-64 bg-sidebar text-white flex flex-col justify-between shrink-0 h-screen select-none border-r border-sidebar-hover">
      {/* Brand Header */}
      <div>
        <div className="p-6 pb-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-brand-accent flex items-center justify-center font-bold text-white text-base shadow-xs group-hover:scale-105 transition-transform">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wider text-white">PRAX</span>
              <span className="text-[10px] tracking-widest text-sidebar-text uppercase font-semibold -mt-1">
                WORKSPACE
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

        {/* Navigation Category */}
        <div className="px-6 py-2">
          <span className="text-[10px] font-bold tracking-widest text-sidebar-muted uppercase">
            WORKSPACE
          </span>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Member navigation" className="px-3 py-1 flex flex-col gap-1">
          {memberNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

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
                {item.badge && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-white">
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
        {/* Micro motivational prompt from PDF */}
        <div className="px-3 py-2 rounded-xl bg-sidebar-hover/40 border border-sidebar-hover/80 flex items-center gap-2">
          <span className="text-primary text-xs" aria-hidden="true">
            ✦
          </span>
          <span className="text-[11px] text-sidebar-quote font-medium leading-tight">
            Keep shipping. Keep growing.
          </span>
        </div>

        {/* Member profile widget */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-sidebar-hover/50 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              name={data?.profile.name || "Member"}
              src={data?.profile.avatarUrl || undefined}
              size="sm"
              colorScheme="purple"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {data?.profile.name || "Member"}
              </span>
              <span className="text-[10px] text-sidebar-subtext truncate">
                {data?.user.role === "ADMIN" ? "Administrator" : "Builder"}
              </span>
            </div>
          </div>
          {data?.user.role === "ADMIN" && (
            <Link
              href="/admin"
              title="Switch to Admin workspace"
              className="text-[10px] text-sidebar-text hover:text-white px-2 py-1 rounded-md bg-sidebar-hover border border-sidebar-active shrink-0 ml-1"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

export const MemberSidebar: React.FC<{ onCloseMobile?: () => void }> = (props) => (
  <React.Suspense fallback={<aside className="w-64 bg-sidebar shrink-0 h-screen" />}>
    <MemberSidebarContent {...props} />
  </React.Suspense>
);
