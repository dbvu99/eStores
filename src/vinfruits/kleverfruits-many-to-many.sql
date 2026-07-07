create extension if not exists pgcrypto;

-- Users can have multiple roles through this join table.
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

insert into kf_roles (slug, name, description)
values
  ('customer', 'Customer', 'Can view and manage their own account and orders.'),
  ('admin', 'Admin', 'Can manage inventory, customer records, and all orders.')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description;

create index if not exists kf_customer_roles_role_idx
  on kf_customer_roles (role_id);

-- Products can belong to multiple categories through this join table.
-- Keep kf_products.category for now as a legacy/display fallback until the app
-- reads from this join table everywhere.
create table if not exists kf_product_category_assignments (
  product_id uuid not null references kf_products(id) on delete cascade,
  category_id uuid not null references kf_product_categories(id) on delete cascade,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (product_id, category_id)
);

create unique index if not exists kf_product_category_assignments_one_primary_idx
  on kf_product_category_assignments (product_id)
  where is_primary = true;

create index if not exists kf_product_category_assignments_category_idx
  on kf_product_category_assignments (category_id, sort_order);

-- Backfill each existing product's current single category into the new
-- many-to-many assignment table as the primary category.
insert into kf_product_category_assignments (
  product_id,
  category_id,
  is_primary,
  sort_order
)
select
  product.id,
  category.id,
  true,
  product.sort_order
from kf_products product
join kf_product_categories category
  on lower(category.name) = lower(product.category)
where product.category is not null
  and product.category <> ''
on conflict (product_id, category_id) do update
set is_primary = excluded.is_primary,
    sort_order = excluded.sort_order;

-- Ensure every existing account has the customer role unless another role has
-- already been assigned manually.
insert into kf_customer_roles (customer_id, role_id)
select account.id, role.id
from kf_customer_accounts account
cross join kf_roles role
where role.slug = 'customer'
  and not exists (
    select 1
    from kf_customer_roles existing_role
    where existing_role.customer_id = account.id
  )
on conflict do nothing;
