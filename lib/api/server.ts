import { createClient } from "@/lib/supabase/server";

const HEXADECIMAL_RADIX = 16;

export class ApiRouteError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new ApiRouteError(401, "unauthorized", "Authentication required.");
  }

  return { supabase, user };
}

export function jsonResponse<T>(
  data: T,
  init?: ResponseInit & { meta?: unknown; included?: unknown },
) {
  return Response.json(
    {
      data,
      ...(init?.meta !== undefined ? { meta: init.meta } : {}),
      ...(init?.included !== undefined ? { included: init.included } : {}),
    },
    init,
  );
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return Response.json(
    {
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status },
  );
}

export function withNoContent(headers?: HeadersInit) {
  return new Response(null, { status: 204, headers });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiRouteError) {
    return jsonError(error.status, error.code, error.message, error.details);
  }

  console.error(error);
  return jsonError(500, "internal_error", "An unexpected error occurred.");
}

export function applyMetadataHeaders(
  headers: Headers,
  metadata: Record<string, string | number | null | undefined>,
) {
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined && value !== null) {
      headers.set(key, String(value));
    }
  }
  return headers;
}

export function buildAttachmentContentDisposition(filename: string) {
  const fallback = filename
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/["\\]/g, "_")
    .trim() || "download";
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(HEXADECIMAL_RADIX).toUpperCase()}`,
  );

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
