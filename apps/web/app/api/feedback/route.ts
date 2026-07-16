import { getDb } from "@/db";
import { feedback } from "@/db/schema";
import {
  apiFailure,
  isOptionalString,
  isString,
  readJsonObject,
} from "@/app/api/request-validation";

const FEEDBACK_TYPES = new Set(["like", "idea", "bug"]);

export async function POST(request: Request) {
  try {
    const payload = await readJsonObject(request);
    if (
      !isString(payload.id, 100) ||
      !isString(payload.anonymousId, 100) ||
      typeof payload.type !== "string" ||
      !FEEDBACK_TYPES.has(payload.type) ||
      typeof payload.rating !== "number" ||
      !Number.isInteger(payload.rating) ||
      payload.rating < 1 ||
      payload.rating > 5 ||
      !isOptionalString(payload.content, 2_000) ||
      !isOptionalString(payload.email, 200) ||
      typeof payload.occurredAt !== "number" ||
      !Number.isSafeInteger(payload.occurredAt) ||
      payload.schemaVersion !== 1
    ) {
      return Response.json({ error: "invalid feedback" }, { status: 400 });
    }

    await getDb()
      .insert(feedback)
      .values({
        id: payload.id,
        anonymousId: payload.anonymousId,
        type: payload.type,
        rating: payload.rating,
        content: payload.content,
        email: payload.email,
        occurredAt: payload.occurredAt,
        schemaVersion: payload.schemaVersion,
      })
      .onConflictDoNothing({ target: feedback.id });

    return Response.json({ accepted: true }, { status: 202 });
  } catch (error) {
    return apiFailure(error);
  }
}
