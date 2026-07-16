import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    anonymousId: text("anonymous_id").notNull(),
    sessionId: text("session_id").notNull(),
    name: text("name").notNull(),
    properties: text("properties").notNull().default("{}"),
    occurredAt: integer("occurred_at").notNull(),
    schemaVersion: integer("schema_version").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("analytics_events_anonymous_id_idx").on(table.anonymousId),
    index("analytics_events_occurred_at_idx").on(table.occurredAt),
    index("analytics_events_name_idx").on(table.name),
  ],
);

export const feedback = sqliteTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    anonymousId: text("anonymous_id").notNull(),
    type: text("type").notNull(),
    rating: integer("rating").notNull(),
    content: text("content").notNull().default(""),
    email: text("email").notNull().default(""),
    occurredAt: integer("occurred_at").notNull(),
    schemaVersion: integer("schema_version").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("feedback_occurred_at_idx").on(table.occurredAt),
    index("feedback_type_idx").on(table.type),
  ],
);
