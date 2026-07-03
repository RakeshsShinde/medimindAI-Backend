CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password" text,
	"avatar" text,
	"auth_provider" varchar(20) DEFAULT 'local',
	"default_currency" varchar(10) DEFAULT 'INR',
	"created_at" timestamp DEFAULT now(),
	"token_version" integer DEFAULT 0,
	"provider_id" varchar(255),
	"role" varchar,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
