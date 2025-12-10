CREATE TABLE "quotes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" text NOT NULL,
	"addon_ids" json DEFAULT '[]'::json,
	"contract_term" text DEFAULT '1month',
	"contact" json NOT NULL,
	"totals" json NOT NULL,
	"eximia_contact_id" text,
	"ghl_invoice_id" text,
	"ghl_customer_id" text,
	"payment_url" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
