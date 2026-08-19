import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_EMAIL = "test@yopmail.com";
const ADMIN_PASSWORD = "Kaifee@1";

const adminSeedSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type AdminSeedResult =
  | { ok: true }
  | {
      ok: false;
      reason: "wrong_credentials" | "missing_service_role" | "missing_migration" | "failed";
      message: string;
    };

function isMissingServiceRoleError(error: unknown) {
  return error instanceof Error && error.message.includes("APP_SUPABASE_SERVICE_ROLE_KEY");
}

function isMissingMigrationError(error: { code?: string; message?: string } | null) {
  return error?.code === "42P01" || error?.message?.includes("user_roles") === true;
}

export const ensureAdminAccount = createServerFn({ method: "POST" })
  .validator(adminSeedSchema)
  .handler(async ({ data }): Promise<AdminSeedResult> => {
    if (data.email.trim().toLowerCase() !== ADMIN_EMAIL || data.password !== ADMIN_PASSWORD) {
      return {
        ok: false,
        reason: "wrong_credentials",
        message: "This auto-seed only runs for the configured admin login.",
      };
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      let userId: string | undefined;
      const createResult = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "MD Attire Admin" },
      });

      if (createResult.data.user) {
        userId = createResult.data.user.id;
      } else {
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (listError) {
          return { ok: false, reason: "failed", message: listError.message };
        }

        const existing = users.users.find((user) => user.email?.toLowerCase() === ADMIN_EMAIL);
        if (!existing) {
          return {
            ok: false,
            reason: "failed",
            message: createResult.error?.message ?? "Could not create admin user.",
          };
        }

        userId = existing.id;
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: "MD Attire Admin" },
        });
        if (updateError) {
          return { ok: false, reason: "failed", message: updateError.message };
        }
      }

      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

      if (roleError) {
        return {
          ok: false,
          reason: isMissingMigrationError(roleError) ? "missing_migration" : "failed",
          message: isMissingMigrationError(roleError)
            ? "The admin Auth user was created, but the user_roles table is missing. Apply the database migrations."
            : roleError.message,
        };
      }

      return { ok: true };
    } catch (error) {
      if (isMissingServiceRoleError(error)) {
        return {
          ok: false,
          reason: "missing_service_role",
          message:
            "Add APP_SUPABASE_SERVICE_ROLE_KEY in Lovable Cloud secrets so the server can seed Supabase Auth.",
        };
      }

      return {
        ok: false,
        reason: "failed",
        message: error instanceof Error ? error.message : "Could not seed admin user.",
      };
    }
  });
