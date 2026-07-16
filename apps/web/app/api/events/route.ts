import { getDb } from "@/db";
import { analyticsEvents } from "@/db/schema";
import {
  apiFailure,
  isRecord,
  isString,
  readJsonObject,
} from "@/app/api/request-validation";

export async function POST(request: Request) {
  try {
    const payload = await readJsonObject(request);
    if (
      !isString(payload.id, 100) ||
      !isString(payload.anonymousId, 100) ||
      !isString(payload.sessionId, 100) ||
      !isString(payload.name, 64) ||
      !/^[a-z][a-z0-9_]*$/.test(payload.name) ||
      !isRecord(payload.properties) ||
      typeof payload.occurredAt !== "number" ||
      !Number.isSafeInteger(payload.occurredAt) ||
      payload.schemaVersion !== 1
    ) {
      return Response.json({ error: "invalid event" }, { status: 400 });
    }
    const properties = JSON.stringify(payload.properties);
    if (properties.length > 4_000) {
      return Response.json({ error: "event properties are too large" }, { status: 400 });
    }

    await getDb()
      .insert(analyticsEvents)
      .values({
        id: payload.id,
        anonymousId: payload.anonymousId,
        sessionId: payload.sessionId,
        name: payload.name,
        properties,
        occurredAt: payload.occurredAt,
        schemaVersion: payload.schemaVersion,
      })
      .onConflictDoNothing({ target: analyticsEvents.id });

    return Response.json({ accepted: true }, { status: 202 });
  } catch (error) {
    return apiFailure(error);
  }
}
