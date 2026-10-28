"use client";

import React, { useState } from "react";
import { MemberSidebar } from "./MemberSidebar";
import { AdminSidebar } from "./AdminSidebar";
import { TopNav } from "./TopNav";

export interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs: string[];
  variant?: "member" | "admin";
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  breadcrumbs,
  variant = "member",
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex shrink-0">
        {variant === "admin" ? <AdminSidebar /> : <MemberSidebar />}
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-xs flex animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-64 h-full shrink-0 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {variant === "admin" ? (
              <AdminSidebar onCloseMobile={() => setMobileOpen(false)} />
            ) : (
              <MemberSidebar onCloseMobile={() => setMobileOpen(false)} />
            )}
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <TopNav
          breadcrumbs={breadcrumbs}
          isAdmin={variant === "admin"}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};
