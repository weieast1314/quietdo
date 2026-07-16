CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`anonymous_id` text NOT NULL,
	`session_id` text NOT NULL,
	`name` text NOT NULL,
	`properties` text DEFAULT '{}' NOT NULL,
	`occurred_at` integer NOT NULL,
	`schema_version` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_events_anonymous_id_idx` ON `analytics_events` (`anonymous_id`);--> statement-breakpoint
CREATE INDEX `analytics_events_occurred_at_idx` ON `analytics_events` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_name_idx` ON `analytics_events` (`name`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`anonymous_id` text NOT NULL,
	`type` text NOT NULL,
	`rating` integer NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`occurred_at` integer NOT NULL,
	`schema_version` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_occurred_at_idx` ON `feedback` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `feedback_type_idx` ON `feedback` (`type`);