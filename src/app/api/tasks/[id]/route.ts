import { pendingEndpoint } from "@/lib/api/backend";

export const GET = pendingEndpoint({});
export const PATCH = pendingEndpoint({ requiredRole: "ADMIN" });
