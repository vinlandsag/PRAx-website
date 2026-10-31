export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...options });
  if (response.status === 204) return undefined as T;
  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiRequestError(
      "The service returned an unreadable response. Please try again.",
      response.status
    );
  }
  if (!response.ok) {
    throw new ApiRequestError(
      result?.error?.message || "Could not complete the request.",
      response.status,
      result?.error?.code
    );
  }
  return result as T;
}
