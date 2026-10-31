import { pendingEndpoint } from "@/lib/api/backend";

// Contract retained for backend implementation; no simulated reads or writes.
export const GET = pendingEndpoint({});
export const PUT = pendingEndpoint({ requiredRole: "ADMIN" });
