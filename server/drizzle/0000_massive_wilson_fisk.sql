CREATE OR REPLACE FUNCTION public.get_auth_user_id() 
RETURNS text AS $$
BEGIN
  RETURN auth.user_id();
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to everyone
GRANT EXECUTE ON FUNCTION public.get_auth_user_id() TO public;

CREATE TYPE "public"."security_level" AS ENUM('RLS', 'DB', 'Dedicated');--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"security_level" "security_level" DEFAULT 'RLS' NOT NULL,
	"auth_id" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tenant_auth_id_unique" UNIQUE("auth_id")
);
--> statement-breakpoint
ALTER TABLE "tenant" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tenant_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"auth_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_user_email_unique" UNIQUE("email"),
	CONSTRAINT "tenant_user_auth_id_unique" UNIQUE("auth_id")
);
--> statement-breakpoint
CREATE TABLE "fruits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"tenant_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fruits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenant_user" ADD CONSTRAINT "tenant_user_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fruits" ADD CONSTRAINT "fruits_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenant_name_idx" ON "tenant" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tenant_security_level_idx" ON "tenant" USING btree ("security_level");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_auth_id_idx" ON "tenant" USING btree ("auth_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_email_idx" ON "tenant_user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_auth_id_idx" ON "tenant_user" USING btree ("auth_id");--> statement-breakpoint
CREATE INDEX "admin_name_idx" ON "tenant_user" USING btree ("name");--> statement-breakpoint
CREATE INDEX "admin_org_id_idx" ON "tenant_user" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fruits_name_idx" ON "fruits" USING btree ("name");--> statement-breakpoint
CREATE INDEX "fruits_color_idx" ON "fruits" USING btree ("color");--> statement-breakpoint
CREATE INDEX "fruits_tenant_id_idx" ON "fruits" USING btree ("tenant_id");--> statement-breakpoint
CREATE POLICY "tenant_rls_policy" ON "tenant" AS PERMISSIVE FOR ALL TO "nucleus_owner" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "fruits_rls_owner_policy" ON "fruits" AS PERMISSIVE FOR ALL TO "nucleus_owner" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "fruits_org_isolation_policy" ON "fruits" AS PERMISSIVE FOR ALL TO public USING (tenant_id IN (
        SELECT tenant_id FROM "tenant_user" WHERE auth_id = public.get_auth_user_id()
      )) WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM "tenant_user" WHERE auth_id = public.get_auth_user_id()
      ));