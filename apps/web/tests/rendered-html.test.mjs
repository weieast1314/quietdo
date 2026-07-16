import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("production output contains the QuietDo application and metadata", async () => {
  const [serverBundle, clientAssets, manifest, serviceWorker] = await Promise.all([
    readFile(new URL("dist/server/index.js", projectRoot), "utf8"),
    readdir(new URL("dist/client/assets/", projectRoot)),
    readFile(new URL("dist/client/manifest.webmanifest", projectRoot), "utf8"),
    readFile(new URL("dist/client/sw.js", projectRoot), "utf8"),
  ]);

  assert.match(serverBundle, /QuietDo · 轻作 — 会思考的本地任务工作台/);
  assert.match(serverBundle, /manifest\.webmanifest/);
  assert.ok(clientAssets.some((name) => name.startsWith("taskflow-app-") && name.endsWith(".js")));
  assert.equal(JSON.parse(manifest).short_name, "QuietDo");
  assert.match(serviceWorker, /quietdo-shell-v5/);
});

test("starter preview is removed and product metadata is present", async () => {
  const [page, layout, packageJson, hostingConfig] = await Promise.all([
    readFile(new URL("app/page.tsx", projectRoot), "utf8"),
    readFile(new URL("app/layout.tsx", projectRoot), "utf8"),
    readFile(new URL("package.json", projectRoot), "utf8"),
    readFile(new URL(".openai/hosting.json", projectRoot), "utf8"),
  ]);

  assert.match(page, /<TaskFlowApp \/>/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /QuietDo · 轻作 — 会思考的本地任务工作台/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.equal(JSON.parse(hostingConfig).d1, "DB");
  await assert.rejects(access(new URL("app/_sites-preview/SkeletonPreview.tsx", projectRoot)));
});

test("D1 migration defines idempotent event and feedback tables", async () => {
  const migration = await readFile(
    new URL("drizzle/0000_outgoing_domino.sql", projectRoot),
    "utf8",
  );
  assert.match(migration, /CREATE TABLE `analytics_events`/);
  assert.match(migration, /CREATE TABLE `feedback`/);
  assert.match(migration, /`id` text PRIMARY KEY NOT NULL/);
});
