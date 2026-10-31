"use client";

import React from "react";
import Link from "next/link";
import { GlobalSearch } from "./GlobalSearch";
import { useWorkspace } from "@/lib/workspace/use-workspace";
import { NotificationBell } from "./NotificationBell";
import { Avatar } from "../ui/Avatar";

export interface TopNavProps {
  breadcrumbs: string[];
  isAdmin?: boolean;
  onOpenMobileMenu?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  breadcrumbs,
  isAdmin = false,
  onOpenMobileMenu,
}) => {
  const { data } = useWorkspace();
  return (
    <header className="h-16 border-b border-border bg-surface px-4 sm:px-8 flex items-center justify-between shrink-0 select-none sticky top-0 z-20">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-text-muted hover:bg-border-subtle hover:text-text cursor-pointer"
            aria-label="Open navigation menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs sm:text-sm font-medium text-text-muted"
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb}>
              {idx > 0 && <span className="text-text-faint">/</span>}
              <span className={idx === breadcrumbs.length - 1 ? "font-semibold text-text" : ""}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Search, Streak, Points, Bell, Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <GlobalSearch />

        {isAdmin && (
          <span className="rounded-full border border-warning-border bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning-text">
            Admin mode
          </span>
        )}
        <NotificationBell />

        {/* User Avatar */}
        <Link href={isAdmin ? "/admin" : "/profile"}>
          <Avatar
            name={data?.profile.name || (isAdmin ? "Admin" : "Member")}
            src={data?.profile.avatarUrl || undefined}
            size="sm"
            colorScheme={isAdmin ? "orange" : "purple"}
            className="cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
          />
        </Link>
      </div>
    </header>
  );
};
