"use client";

import React from "react";
import Link from "next/link";
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
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? "font-semibold text-text"
                    : "hover:text-text cursor-pointer"
                }
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Search, Streak, Points, Bell, Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Search Input with ⌘K badge */}
        <div className="hidden md:flex items-center relative">
          <svg
            className="w-4 h-4 text-text-faint absolute left-3 pointer-events-none"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search anything..."
            aria-label="Search platform"
            className="w-48 lg:w-64 pl-9 pr-8 py-1.5 bg-background border border-border text-xs rounded-xl focus-visible:outline-none focus-visible:border-primary text-text placeholder:text-text-faint"
          />
          <kbd className="absolute right-2.5 text-[10px] font-mono text-text-faint bg-surface border border-border px-1.5 py-0.5 rounded-md pointer-events-none shadow-2xs">
            ⌘K
          </kbd>
        </div>

        {isAdmin ? (
          /* Admin badge */
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning-bg text-warning-text border border-warning-border">
            <span
              className="h-1.5 w-1.5 rounded-full bg-warning-dot animate-pulse"
              aria-hidden="true"
            />
            <span>Admin mode</span>
          </div>
        ) : (
          /* Member streak & points chips */
          <>
            <Link
              href="/streaks"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning-bg text-streak border border-warning-border hover:brightness-95 transition-all"
            >
              <span className="text-sm" aria-hidden="true">
                🔥
              </span>
              <span>12 day streak</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-lavender/60 text-primary border border-lavender-border hover:bg-lavender transition-colors"
            >
              <span className="text-[10px]" aria-hidden="true">
                ◆
              </span>
              <span>1,240 pts</span>
            </Link>
          </>
        )}

        {/* Notifications */}
        <button
          className="p-2 text-text-muted hover:text-text hover:bg-border-subtle rounded-xl relative transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="h-2 w-2 rounded-full bg-primary absolute top-2 right-2 ring-2 ring-surface" />
        </button>

        {/* User Avatar */}
        <Link href={isAdmin ? "/admin" : "/profile"}>
          <Avatar
            name={isAdmin ? "Lena V." : "Arjun Varma"}
            size="sm"
            colorScheme={isAdmin ? "orange" : "purple"}
            className="cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
          />
        </Link>
      </div>
    </header>
  );
};
