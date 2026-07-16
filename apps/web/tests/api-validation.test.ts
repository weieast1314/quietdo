import assert from "node:assert/strict";
import test from "node:test";
import {
  isOptionalString,
  isRecord,
  isString,
  readJsonObject,
} from "../app/api/request-validation";

test("request validation enforces JSON objects", async () => {
  const valid = await readJsonObject(
    new Request("https://taskflow.test/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "app_open" }),
    }),
  );
  assert.deepEqual(valid, { event: "app_open" });

  await assert.rejects(
    readJsonObject(
      new Request("https://taskflow.test/api/events", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "nope",
      }),
    ),
    (error: unknown) => error instanceof Response && error.status === 415,
  );
});

test("primitive validation applies length and shape bounds", () => {
  assert.equal(isString("task_create", 64), true);
  assert.equal(isString("", 64), false);
  assert.equal(isString("x".repeat(65), 64), false);
  assert.equal(isOptionalString("", 10), true);
  assert.equal(isRecord({ ok: true }), true);
  assert.equal(isRecord([]), false);
});
