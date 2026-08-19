-- Reset a manually seeded admin Auth user that can make Supabase Auth return
-- "Database error querying schema" or "Database error finding users".
--
-- After this runs, sign in with test@yopmail.com / Kaifee@1. The app's
-- server-side admin seed uses the Supabase Auth Admin API to recreate the
-- Auth user and admin role in the supported format.

DO $$
DECLARE
  admin_email constant text := 'test@yopmail.com';
  fixed_admin_id constant uuid := '00000000-0000-4000-8000-000000000001'::uuid;
  admin_ids uuid[];
  admin_id_texts text[];
BEGIN
  SELECT COALESCE(array_agg(id), '{}'::uuid[])
  INTO admin_ids
  FROM auth.users
  WHERE lower(email) = admin_email OR id = fixed_admin_id;

  SELECT array_agg(id::text)
  INTO admin_id_texts
  FROM unnest(admin_ids || fixed_admin_id) AS id;

  DELETE FROM public.user_roles
  WHERE user_id = fixed_admin_id OR user_id = ANY(admin_ids);

  IF to_regclass('auth.identities') IS NOT NULL THEN
    DELETE FROM auth.identities
    WHERE user_id::text = ANY(admin_id_texts)
       OR lower(identity_data ->> 'email') = admin_email;
  END IF;

  IF to_regclass('auth.sessions') IS NOT NULL THEN
    DELETE FROM auth.sessions
    WHERE user_id::text = ANY(admin_id_texts);
  END IF;

  IF to_regclass('auth.refresh_tokens') IS NOT NULL THEN
    DELETE FROM auth.refresh_tokens
    WHERE user_id::text = ANY(admin_id_texts);
  END IF;

  IF to_regclass('auth.mfa_factors') IS NOT NULL THEN
    DELETE FROM auth.mfa_factors
    WHERE user_id::text = ANY(admin_id_texts);
  END IF;

  IF to_regclass('auth.one_time_tokens') IS NOT NULL THEN
    DELETE FROM auth.one_time_tokens
    WHERE user_id::text = ANY(admin_id_texts);
  END IF;

  DELETE FROM auth.users
  WHERE id = fixed_admin_id OR id = ANY(admin_ids) OR lower(email) = admin_email;
END $$;
