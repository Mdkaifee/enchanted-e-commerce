-- Optional per-colour product images. Shape:
-- {
--   "Oat": "https://...",
--   "Charcoal": "https://..."
-- }

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS color_images jsonb NOT NULL DEFAULT '{}'::jsonb;
