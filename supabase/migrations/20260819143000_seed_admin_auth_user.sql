-- Idempotently create/reset the requested MD Attire admin Auth user.
-- Apply this migration to the live Supabase project if test@yopmail.com
-- returns "Invalid login credentials".

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id
  FROM auth.users
  WHERE lower(email) = 'test@yopmail.com'
  LIMIT 1;

  IF admin_id IS NULL THEN
    admin_id := '00000000-0000-4000-8000-000000000001'::uuid;

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_super_admin,
      is_sso_user,
      is_anonymous
    )
    VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'test@yopmail.com',
      extensions.crypt('Kaifee@1', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"MD Attire Admin"}'::jsonb,
      now(),
      now(),
      false,
      false,
      false
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = extensions.crypt('Kaifee@1', extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"MD Attire Admin"}'::jsonb,
      updated_at = now(),
      deleted_at = NULL
    WHERE id = admin_id;
  END IF;

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    admin_id,
    admin_id,
    admin_id::text,
    jsonb_build_object('sub', admin_id::text, 'email', 'test@yopmail.com', 'email_verified', true),
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider_id, provider) DO UPDATE
  SET
    user_id = EXCLUDED.user_id,
    identity_data = EXCLUDED.identity_data,
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
