import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Returns the application health status and environment info.
 * No auth required — used by CI, load balancers, and local dev smoke tests.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      backend: "not_configured",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "unknown",
      env: process.env.NODE_ENV,
    },
    { status: 200 }
  );
}
