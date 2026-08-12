CREATE TABLE `caregivers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `dose_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medication_id` integer NOT NULL,
	`scheduled_date` text NOT NULL,
	`scheduled_time` text NOT NULL,
	`confirmed_at` text,
	`photo_key` text,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`senior_id` integer NOT NULL,
	`name` text NOT NULL,
	`dosage` text NOT NULL,
	`schedule_times` text NOT NULL,
	`instructions` text DEFAULT '' NOT NULL,
	`requires_photo` integer DEFAULT true NOT NULL,
	`color` text DEFAULT 'sage' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seniors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`caregiver_id` integer NOT NULL,
	`invite_code` text NOT NULL
);
