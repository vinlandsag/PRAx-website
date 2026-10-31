import { pendingEndpoint } from "@/lib/api/backend";

export const GET = pendingEndpoint({ requiredRole: "ADMIN" });
export const PATCH = pendingEndpoint({ requiredRole: "ADMIN" });
