CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  image_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Product categories are publicly viewable" ON public.product_categories;
DROP POLICY IF EXISTS "Admins can insert product categories" ON public.product_categories;
DROP POLICY IF EXISTS "Admins can update product categories" ON public.product_categories;
DROP POLICY IF EXISTS "Admins can delete product categories" ON public.product_categories;

CREATE POLICY "Product categories are publicly viewable"
  ON public.product_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert product categories"
  ON public.product_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product categories"
  ON public.product_categories FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product categories"
  ON public.product_categories FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.product_categories (name, slug, sort_order)
VALUES
  ('Shirts', 'shirts', 10),
  ('Knitwear', 'knitwear', 20),
  ('Trousers', 'trousers', 30),
  ('Dresses', 'dresses', 40),
  ('Outerwear', 'outerwear', 50),
  ('Accessories', 'accessories', 60)
ON CONFLICT (name) DO UPDATE
SET slug = EXCLUDED.slug,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.product_categories (name, slug, sort_order)
SELECT DISTINCT
  trim(category),
  lower(regexp_replace(trim(category), '[^a-zA-Z0-9]+', '-', 'g')),
  999
FROM public.products
WHERE trim(category) <> ''
ON CONFLICT DO NOTHING;
