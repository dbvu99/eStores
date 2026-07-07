-- Klever Fruit clone starter schema.
-- Products are public B2C catalog data. Customer accounts and orders are private.
-- Product inventory rule: inventory_quantity = null means unlimited/untracked stock.

create extension if not exists pgcrypto;

create table if not exists kf_customer_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text unique,
  phone text unique,
  full_name text not null,
  password_hash text,
  accepts_marketing boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'disabled', 'deleted')),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists kf_customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references kf_customer_accounts(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  ward text,
  district text,
  city text not null,
  country text not null default 'Vietnam',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists kf_customer_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references kf_customer_accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists kf_customer_password_resets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references kf_customer_accounts(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists kf_roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists kf_customer_roles (
  customer_id uuid not null references kf_customer_accounts(id) on delete cascade,
  role_id uuid not null references kf_roles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (customer_id, role_id)
);

create table if not exists kf_customer_wishlist (
  customer_id uuid not null references kf_customer_accounts(id) on delete cascade,
  product_slug text not null,
  created_at timestamptz not null default now(),
  primary key (customer_id, product_slug)
);

create table if not exists kf_product_reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references kf_customer_accounts(id) on delete cascade,
  product_slug text not null,
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  body text not null default '',
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, product_slug)
);

insert into kf_roles (slug, name, description)
values
  ('customer', 'Customer', 'Can view and manage their own account and orders.'),
  ('admin', 'Admin', 'Can manage inventory, customer records, and all orders.')
on conflict (slug) do nothing;

create table if not exists kf_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  origin text not null,
  description text not null default '',
  price_vnd integer not null check (price_vnd >= 0),
  compare_at_vnd integer check (compare_at_vnd is null or compare_at_vnd >= 0),
  image_url text,
  gift_ready boolean not null default false,
  in_stock boolean not null default true,
  inventory_quantity integer check (inventory_quantity is null or inventory_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists kf_media_assets (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  content_type text not null,
  size_bytes integer not null default 0 check (size_bytes >= 0),
  public_url text not null,
  alt_text text,
  created_by uuid references kf_customer_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists kf_product_images (
  product_id uuid not null references kf_products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (product_id, image_url)
);

create table if not exists kf_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references kf_customer_accounts(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  delivery_address text not null,
  notes text,
  subtotal_vnd integer not null check (subtotal_vnd >= 0),
  delivery_vnd integer not null default 0 check (delivery_vnd >= 0),
  discount_vnd integer not null default 0 check (discount_vnd >= 0),
  voucher_code text,
  total_vnd integer not null check (total_vnd >= 0),
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'packing', 'delivering', 'completed', 'cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists kf_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references kf_orders(id) on delete cascade,
  product_id uuid references kf_products(id) on delete set null,
  product_slug text not null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_vnd integer not null check (unit_price_vnd >= 0),
  total_price_vnd integer not null check (total_price_vnd >= 0),
  inventory_reserved boolean not null default false,
  inventory_reserved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists kf_products_visible_category_idx
  on kf_products (visible, category, sort_order);

create index if not exists kf_products_origin_price_idx
  on kf_products (origin, price_vnd);

create index if not exists kf_products_inventory_idx
  on kf_products (in_stock, inventory_quantity);

create index if not exists kf_media_assets_created_idx
  on kf_media_assets (created_at desc);

create index if not exists kf_product_images_product_sort_idx
  on kf_product_images (product_id, sort_order);

create index if not exists kf_orders_customer_created_idx
  on kf_orders (customer_id, created_at desc);

create index if not exists kf_customer_addresses_customer_idx
  on kf_customer_addresses (customer_id);

create index if not exists kf_customer_sessions_customer_idx
  on kf_customer_sessions (customer_id);

create index if not exists kf_customer_password_resets_email_idx
  on kf_customer_password_resets (email, created_at desc);

create index if not exists kf_customer_roles_role_idx
  on kf_customer_roles (role_id);

create index if not exists kf_customer_wishlist_customer_idx
  on kf_customer_wishlist (customer_id, created_at desc);

create index if not exists kf_product_reviews_product_idx
  on kf_product_reviews (product_slug, visible, created_at desc);

create index if not exists kf_product_reviews_customer_idx
  on kf_product_reviews (customer_id, created_at desc);

-- Supabase RLS outline:
-- alter table kf_products enable row level security;
-- create policy "Public products are readable" on kf_products
--   for select using (visible = true);
--
-- alter table kf_customer_accounts enable row level security;
-- create policy "Customers can read own account" on kf_customer_accounts
--   for select using (auth.uid() = auth_user_id);
--
-- alter table kf_customer_addresses enable row level security;
-- create policy "Customers can manage own addresses" on kf_customer_addresses
--   using (
--     exists (
--       select 1 from kf_customer_accounts
--       where kf_customer_accounts.id = kf_customer_addresses.customer_id
--       and kf_customer_accounts.auth_user_id = auth.uid()
--     )
--   );
