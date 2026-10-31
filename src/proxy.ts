/**
 * src/middleware.ts
 *
 * Server-side route and API authorization middleware for Next.js App Router.
 * Conforms to MVP_SPEC.md §2 (Roles & Permissions), API_CONTRACTS.md (IC-04),
 * and Phase 5 RBAC specifications.
 *
 * Enforces:
 * 1. Server-authoritative route protection: Blocks direct URL and API access.
 * 2. Deny-by-default rule: Unknown roles, malformed tokens, and expired sessions are rejected.
 * 3. Lifecycle state boundaries: Pending users are restricted to /onboarding;
 *    inactive accounts (REJECTED/SUSPENDED/DISABLED) are barred from platform access.
 * 4. Admin boundary: Non-admin users attempting direct URL access to /admin/* are redirected
 *    to /dashboard; API access returns HTTP 403 FORBIDDEN.
 */

import { type NextRequest, NextResponse } from "next/server";
import { isValidRole, isValidUserStatus } from "@/lib/auth/rbac";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { apiError, errors } from "@/lib/errors";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/design-system" || pathname.startsWith("/design-system/")) {
    return process.env.NODE_ENV === "development"
      ? NextResponse.next()
      : new NextResponse("Not found", { status: 404 });
  }

  // 1. Skip public static assets and root landing page
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/artwork/") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg"
  ) {
    return NextResponse.next();
  }

  // 2. Identify route categories
  const isApiRoute = pathname.startsWith("/api");
  const isPublicApi =
    pathname === "/api/health" ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/invites/verify";

  if (isPublicApi) {
    return NextResponse.next();
  }

  const isAdminApi =
    pathname.startsWith("/api/admin") ||
    (pathname.startsWith("/api/invites") && pathname !== "/api/invites/verify");

  const isAdminPage = pathname.startsWith("/admin");
  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isMemberPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/submissions") ||
    pathname.startsWith("/streaks") ||
    pathname.startsWith("/space") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/members");

  // 3. Extract and verify session token
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySession(sessionCookie);

  // -------------------------------------------------------------
  // A. Unauthenticated Visitors
  // -------------------------------------------------------------
  if (!session || !session.user) {
    if (isApiRoute) {
      return errors.unauthenticated();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = session.user;

  // -------------------------------------------------------------
  // B. Deny-by-Default on Unknown or Tampered Roles
  // -------------------------------------------------------------
  if (!isValidRole(user.role)) {
    if (isApiRoute) {
      return errors.forbidden();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "unauthorized_role");
    return NextResponse.redirect(loginUrl);
  }

  if (!isValidUserStatus(user.status)) {
    if (isApiRoute) return errors.forbidden();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid_account_state");
    return NextResponse.redirect(loginUrl);
  }

  // -------------------------------------------------------------
  // C. Inactive Account State Check (REJECTED, SUSPENDED, DISABLED)
  // -------------------------------------------------------------
  if (user.status === "REJECTED" || user.status === "SUSPENDED" || user.status === "DISABLED") {
    if (isApiRoute) {
      return apiError(
        "ACCOUNT_NOT_ACTIVE",
        `Your account status is ${user.status.toLowerCase()}. Access is restricted.`,
        403
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "account_not_active");
    return NextResponse.redirect(loginUrl);
  }

  // -------------------------------------------------------------
  // D. Pending Approval Account State Check
  // -------------------------------------------------------------
  if (user.status === "PENDING_APPROVAL") {
    // Permitted on onboarding page and user profile check
    if (isOnboardingPage || pathname === "/api/users/me") {
      return NextResponse.next();
    }

    if (isApiRoute) {
      return errors.accountPending();
    }

    // Redirect pending users attempting to access member or admin pages
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // -------------------------------------------------------------
  // E. Approved Users Accessing Onboarding Page (Redirect to Dashboard)
  // -------------------------------------------------------------
  if (isOnboardingPage && user.status === "APPROVED") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // -------------------------------------------------------------
  // F. Admin Route Protection (Role = ADMIN required)
  // -------------------------------------------------------------
  if (isAdminApi || isAdminPage) {
    if (user.role !== "ADMIN") {
      if (isApiRoute) {
        return errors.forbidden();
      }
      // Members attempting direct URL access to admin pages get redirected to dashboard
      const dashboardUrl = new URL("/dashboard", request.url);
      dashboardUrl.searchParams.set("error", "access_denied");
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // -------------------------------------------------------------
  // G. Member Route Protection (Approved Member or Admin permitted)
  // -------------------------------------------------------------
  if (isMemberPage || isApiRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
