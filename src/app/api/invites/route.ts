import { pendingEndpoint } from "@/lib/api/backend";

// Contract retained for backend implementation; no simulated reads or writes.
export const GET = pendingEndpoint({ requiredRole: "ADMIN" });
export const POST = pendingEndpoint({ requiredRole: "ADMIN" });
