ALTER TABLE `medications` ADD COLUMN `start_date` text;
--> statement-breakpoint
ALTER TABLE `medications` ADD COLUMN `end_date` text;
--> statement-breakpoint
ALTER TABLE `medications` ADD COLUMN `days_of_week` text NOT NULL DEFAULT '[0,1,2,3,4,5,6]';
--> statement-breakpoint
ALTER TABLE `medications` ADD COLUMN `active` integer NOT NULL DEFAULT 1;
