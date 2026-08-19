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
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42P01" ||
    message.includes("user_roles") ||
    message.includes("database error querying schema")
  );
}

function isAuthStorageError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("database error querying schema") ||
    message.includes("database error finding users")
  );
}

function serviceErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return String(error);
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
      console.info("[AdminSeed] Creating or repairing admin Auth user");
      const createResult = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "MD Attire Admin" },
      });

      if (createResult.error && isMissingMigrationError(createResult.error)) {
        console.error("[AdminSeed] Supabase Auth schema error during createUser", {
          message: createResult.error.message,
          status: createResult.error.status,
          code: createResult.error.code,
        });
        return {
          ok: false,
          reason: "missing_migration",
          message:
            "Supabase Auth returned a database error while creating the admin user. Run the latest reset admin Auth SQL, then sign in again.",
        };
      }

      if (createResult.data.user) {
        userId = createResult.data.user.id;
      } else {
        if (createResult.error) {
          console.info(
            "[AdminSeed] createUser did not create a new user; looking for existing user",
            {
              message: createResult.error.message,
              status: createResult.error.status,
              code: createResult.error.code,
            },
          );
        }

        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (listError) {
          console.error("[AdminSeed] Could not list Auth users", {
            message: listError.message,
            status: listError.status,
            code: listError.code,
          });
          return {
            ok: false,
            reason: isAuthStorageError(listError) ? "missing_migration" : "failed",
            message: isAuthStorageError(listError)
              ? "Supabase Auth has a broken admin user record. Run the latest reset admin Auth SQL, then sign in again."
              : `Could not list Supabase Auth users: ${listError.message}. Check APP_SUPABASE_SERVICE_ROLE_KEY.`,
          };
        }

        const existing = users.users.find((user) => user.email?.toLowerCase() === ADMIN_EMAIL);
        if (!existing) {
          console.error("[AdminSeed] Admin user was not created and not found", {
            createError: createResult.error?.message,
          });
          return {
            ok: false,
            reason: "failed",
            message: createResult.error?.message ?? "Could not create admin user.",
          };
        }

        userId = existing.id;
        console.info("[AdminSeed] Updating existing admin Auth user", { userId });
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: "MD Attire Admin" },
        });
        if (updateError) {
          console.error("[AdminSeed] Could not update admin Auth user", {
            userId,
            message: updateError.message,
            status: updateError.status,
            code: updateError.code,
          });
          return {
            ok: false,
            reason: "failed",
            message: `Could not update admin Auth user: ${updateError.message}. Check APP_SUPABASE_SERVICE_ROLE_KEY or recreate test@yopmail.com in Supabase Auth.`,
          };
        }
      }

      console.info("[AdminSeed] Upserting admin role", { userId });
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

      if (roleError) {
        console.error("[AdminSeed] Could not upsert admin role", roleError);
        return {
          ok: false,
          reason: isMissingMigrationError(roleError) ? "missing_migration" : "failed",
          message: isMissingMigrationError(roleError)
            ? "The admin Auth user was created, but the user_roles table is missing. Apply the database migrations."
            : roleError.message,
        };
      }

      console.info("[AdminSeed] Admin repair complete", { userId });
      return { ok: true };
    } catch (error) {
      console.error("[AdminSeed] Admin repair crashed", {
        message: serviceErrorMessage(error),
        error,
      });

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
