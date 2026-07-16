const MAX_BODY_BYTES = 12_000;

export function isString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

export function isOptionalString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new Response(JSON.stringify({ error: "application/json is required" }), {
      status: 415,
      headers: { "content-type": "application/json" },
    });
  }
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    throw new Response(JSON.stringify({ error: "request body is too large" }), {
      status: 413,
      headers: { "content-type": "application/json" },
    });
  }
  const value = (await request.json()) as unknown;
  if (!isRecord(value)) {
    throw new Response(JSON.stringify({ error: "JSON object is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  return value;
}

export function apiFailure(error: unknown): Response {
  if (error instanceof Response) return error;
  console.error("QuietDo API error", error);
  return Response.json({ error: "temporarily unavailable" }, { status: 503 });
}
