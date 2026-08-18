CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL,
  category text NOT NULL,
  colors text[] NOT NULL DEFAULT '{}',
  sizes text[] NOT NULL DEFAULT '{}',
  image_url text NOT NULL DEFAULT '',
  badge text,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly viewable"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can place an order"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

INSERT INTO public.products (slug, name, description, price, category, colors, sizes, image_url, badge, featured) VALUES
('linen-overshirt','Heavy Linen Overshirt','Garment-washed European linen with a relaxed drape and horn buttons. Softens with every wear.',185.00,'Shirts','{Sand,Ivory,Clay}','{XS,S,M,L,XL}','','New',true),
('oversized-poplin-shirt','Oversized Poplin Shirt','Crisp organic cotton poplin cut generously through the body with a dropped shoulder.',120.00,'Shirts','{Ivory,Sky}','{XS,S,M,L,XL}','',null,true),
('merino-crew-knit','Merino Crew Knit','Fine-gauge extra-soft merino, fully fashioned for a clean shoulder line.',165.00,'Knitwear','{Oat,Charcoal,Clay}','{S,M,L,XL}','',null,true),
('cashmere-cardigan','Boxy Cashmere Cardigan','Grade-A Mongolian cashmere in a boxy, collarless silhouette.',320.00,'Knitwear','{Cream,Camel}','{S,M,L}','','Limited',true),
('wide-leg-trouser','Wide Leg Wool Trouser','Fluid wool blend with a pressed crease and hidden hook closure.',210.00,'Trousers','{Stone,Black}','{26,28,30,32,34}','',null,true),
('pleated-chino','Pleated Cotton Chino','Double-pleated heavyweight cotton twill with a tapered leg.',140.00,'Trousers','{Sand,Olive}','{28,30,32,34,36}','',null,false),
('bias-slip-dress','Bias Cut Slip Dress','Sand-washed silk cut on the bias so it moves with you.',245.00,'Dresses','{Champagne,Espresso}','{XS,S,M,L}','','New',true),
('poplin-midi-dress','Poplin Midi Dress','Structured cotton midi with a cinched waist and deep side pockets.',195.00,'Dresses','{Ivory,Sand}','{XS,S,M,L}','',null,false),
('quilted-liner-jacket','Quilted Liner Jacket','Lightweight quilted shell with a soft brushed lining for layering seasons.',280.00,'Outerwear','{Khaki,Black}','{S,M,L,XL}','',null,true),
('wool-chore-coat','Wool Chore Coat','Melton wool workwear coat with three patch pockets and a soft collar.',390.00,'Outerwear','{Camel,Charcoal}','{S,M,L,XL}','','Limited',false),
('leather-belt','Vegetable Tanned Belt','Full-grain Italian leather that patinas beautifully with time.',85.00,'Accessories','{Tan,Black}','{S,M,L}','',null,false),
('cotton-scarf','Handloomed Cotton Scarf','Airy handloomed cotton with hand-knotted fringe.',65.00,'Accessories','{Sand,Sage}','{One Size}','',null,false);