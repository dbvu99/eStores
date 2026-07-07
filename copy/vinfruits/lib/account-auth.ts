import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { getPoolDuc } from "@codex-testing/libs/db";
import { inferProductFilters, type FruitProduct } from "@vinfuit/fruitData";
import { VINFRUITS_STORAGE_BUCKET } from "@vinfuit/lib/storage";
import { evaluateVoucher } from "@vinfuit/lib/vouchers";

const getPool = getPoolDuc;

const PASSWORD_ROUNDS = 12;
const SESSION_COOKIE = "kf_customer_session";
let ensureKleverAuthTablesPromise: Promise<void> | null = null;

export type CustomerPublic = {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
};

export type ProductCategory = {
  slug: string;
  name: string;
  name_vi: string | null;
  name_en: string | null;
  source_path: string;
  sort_order: number;
};

export type CustomerAddress = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  ward: string | null;
  district: string | null;
  city: string;
  country: string;
  is_default: boolean;
};

export type ProductReview = {
  id: string;
  productSlug: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  isOwnReview: boolean;
};

export type ProductReviewSummary = {
  count: number;
  average: number;
};

export type MediaAsset = {
  id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  public_url: string;
  alt_text: string | null;
  created_at: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toCustomer(row: {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  roles?: string[] | null;
}): CustomerPublic {
  return {
    id: row.id,
    name: row.full_name || "",
    email: row.email || "",
    phone: row.phone || "",
    roles: Array.isArray(row.roles) ? row.roles.filter(Boolean) : [],
  };
}

async function runEnsureKleverAuthTables() {
  const pool = getPool();
  await pool.query(`
    select pg_advisory_xact_lock(hashtext('vinfruits_schema_bootstrap'));

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

    create table if not exists kf_product_categories (
      id uuid primary key default gen_random_uuid(),
      slug text not null unique,
      name text not null,
      name_vi text,
      name_en text,
      source_path text not null,
      sort_order integer not null default 0,
      visible boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists kf_products (
      id uuid primary key default gen_random_uuid(),
      slug text not null unique,
      name text not null,
      category text not null default '',
      origin text not null default '',
      description text not null default '',
      price_vnd integer not null default 0 check (price_vnd >= 0),
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

    create table if not exists kf_product_category_assignments (
      product_id uuid not null references kf_products(id) on delete cascade,
      category_id uuid not null references kf_product_categories(id) on delete cascade,
      is_primary boolean not null default false,
      sort_order integer not null default 0,
      created_at timestamptz not null default now(),
      primary key (product_id, category_id)
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

    alter table kf_orders add column if not exists voucher_code text;
    alter table kf_product_categories add column if not exists name_vi text;
    alter table kf_product_categories add column if not exists name_en text;
    update kf_product_categories
    set name_vi = coalesce(nullif(name_vi, ''), name)
    where name_vi is null or name_vi = '';

    insert into kf_roles (slug, name, description)
    values
      ('customer', 'Customer', 'Can view and manage their own account and orders.'),
      ('admin', 'Admin', 'Can manage inventory, customer records, and all orders.')
    on conflict (slug) do nothing;

    insert into kf_product_categories (slug, name, name_vi, name_en, source_path, sort_order)
    values
      ('trai-cay-dang-mua', 'Trái Cây Đang Mùa', 'Trái Cây Đang Mùa', 'Seasonal Fruit', '/collections/trai-cay-dang-mua', 10),
      ('cherry', 'Cherry Nhập Khẩu', 'Cherry Nhập Khẩu', 'Imported Cherries', '/collections/cherry', 20),
      ('nho-sua-han-quoc', 'Nho Sữa Hàn Quốc', 'Nho Sữa Hàn Quốc', 'Korean Shine Muscat', '/collections/nho-sua-han-quoc', 30),
      ('nho', 'Nho Nhập Khẩu', 'Nho Nhập Khẩu', 'Imported Grapes', '/collections/nho', 40),
      ('dau-tay', 'Dâu Tây', 'Dâu Tây', 'Strawberries', '/collections/dau-tay', 50),
      ('viet-quat', 'Việt Quất Nhập Khẩu', 'Việt Quất Nhập Khẩu', 'Imported Blueberries', '/collections/viet-quat', 60),
      ('kiwi', 'Kiwi Nhập Khẩu', 'Kiwi Nhập Khẩu', 'Imported Kiwi', '/collections/kiwi', 70),
      ('man', 'Mận Nhập Khẩu', 'Mận Nhập Khẩu', 'Imported Plums', '/collections/man', 80),
      ('dao-xuan-dao', 'Đào, Xuân Đào Nhập Khẩu', 'Đào, Xuân Đào Nhập Khẩu', 'Imported Peaches and Nectarines', '/collections/dao-xuan-dao', 90),
      ('tao', 'Táo Nhập Khẩu', 'Táo Nhập Khẩu', 'Imported Apples', '/collections/tao', 100),
      ('cam-quyt', 'Cam, Quýt', 'Cam, Quýt', 'Oranges and Mandarins', '/collections/cam-quyt', 110),
      ('trai-cay-viet-nam', 'Trái cây Việt Nam', 'Trái cây Việt Nam', 'Vietnamese Fruit', '/collections/trai-cay-viet-nam', 120),
      ('trai-cay-cat-san', 'Trái Cây Cắt Sẵn', 'Trái Cây Cắt Sẵn', 'Fresh-Cut Fruit', '/collections/trai-cay-cat-san', 130),
      ('do-uong', 'Đồ Uống', 'Đồ Uống', 'Drinks', '/collections/do-uong', 140),
      ('gift-card', 'Thẻ Quà Tặng', 'Thẻ Quà Tặng', 'Gift Card', '/collections/gift-card', 150)
    on conflict (slug) do update
    set name = excluded.name,
        name_vi = excluded.name_vi,
        name_en = excluded.name_en,
        source_path = excluded.source_path,
        sort_order = excluded.sort_order,
        visible = true,
        updated_at = now();

    create index if not exists kf_customer_sessions_customer_idx
      on kf_customer_sessions (customer_id);

    create index if not exists kf_customer_addresses_customer_idx
      on kf_customer_addresses (customer_id);

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

    create index if not exists kf_product_categories_visible_sort_idx
      on kf_product_categories (visible, sort_order);

    create index if not exists kf_products_visible_category_idx
      on kf_products (visible, category, sort_order);

    create index if not exists kf_products_inventory_idx
      on kf_products (in_stock, inventory_quantity);

    create index if not exists kf_media_assets_created_idx
      on kf_media_assets (created_at desc);

    create index if not exists kf_product_images_product_sort_idx
      on kf_product_images (product_id, sort_order);

    create unique index if not exists kf_product_category_assignments_one_primary_idx
      on kf_product_category_assignments (product_id)
      where is_primary = true;

    create index if not exists kf_product_category_assignments_category_idx
      on kf_product_category_assignments (category_id, sort_order);

    create index if not exists kf_orders_customer_created_idx
      on kf_orders (customer_id, created_at desc);
  `);
}

export async function ensureKleverAuthTables() {
  ensureKleverAuthTablesPromise ||= runEnsureKleverAuthTables().catch(
    (error) => {
      ensureKleverAuthTablesPromise = null;
      throw error;
    },
  );

  return ensureKleverAuthTablesPromise;
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  await ensureKleverAuthTables();
  const rows = await getPool().query(
    `select slug,
            coalesce(nullif(name_vi, ''), name, nullif(name_en, '')) as name,
            name_vi,
            name_en,
            source_path,
            sort_order
     from kf_product_categories
     where visible = true
     order by sort_order, coalesce(nullif(name_vi, ''), name, nullif(name_en, ''))`,
  );
  return rows.rows;
}

export async function getWishlistForCustomer(user: CustomerPublic) {
  await ensureKleverAuthTables();
  const rows = await getPool().query(
    `select product_slug
     from kf_customer_wishlist
     where customer_id = $1
     order by created_at desc`,
    [user.id],
  );
  return rows.rows.map((row) => row.product_slug as string);
}

export async function addWishlistItemForCustomer(
  user: CustomerPublic,
  productSlug: string,
) {
  const slug = productSlug.trim();
  if (!slug) throw new Error("Product is required.");
  await ensureKleverAuthTables();
  await getPool().query(
    `insert into kf_customer_wishlist (customer_id, product_slug)
     values ($1, $2)
     on conflict (customer_id, product_slug) do nothing`,
    [user.id, slug],
  );
  return getWishlistForCustomer(user);
}

export async function removeWishlistItemForCustomer(
  user: CustomerPublic,
  productSlug: string,
) {
  const slug = productSlug.trim();
  if (!slug) throw new Error("Product is required.");
  await ensureKleverAuthTables();
  await getPool().query(
    `delete from kf_customer_wishlist
     where customer_id = $1 and product_slug = $2`,
    [user.id, slug],
  );
  return getWishlistForCustomer(user);
}

function toProductReview(row: {
  id: string;
  product_slug: string;
  customer_name: string | null;
  rating: number | string;
  title: string | null;
  body: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  is_own_review: boolean | null;
}): ProductReview {
  return {
    id: row.id,
    productSlug: row.product_slug,
    customerName: row.customer_name || "Customer",
    rating: Number(row.rating),
    title: row.title || "",
    body: row.body || "",
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row.updated_at,
    isOwnReview: Boolean(row.is_own_review),
  };
}

export async function getReviewsForProduct(
  productSlug: string,
  user: CustomerPublic | null = null,
) {
  const slug = productSlug.trim();
  if (!slug) throw new Error("Product is required.");

  await ensureKleverAuthTables();
  const pool = getPool();
  const [reviewRows, summaryRows] = await Promise.all([
    pool.query(
      `select review.id,
              review.product_slug,
              account.full_name as customer_name,
              review.rating,
              review.title,
              review.body,
              review.created_at,
              review.updated_at,
              review.customer_id = $2 as is_own_review
       from kf_product_reviews review
       join kf_customer_accounts account on account.id = review.customer_id
       where review.product_slug = $1
         and review.visible = true
       order by review.created_at desc
       limit 100`,
      [slug, user?.id || null],
    ),
    pool.query(
      `select count(*)::integer as count,
              coalesce(round(avg(rating)::numeric, 1), 0)::float as average
       from kf_product_reviews
       where product_slug = $1
         and visible = true`,
      [slug],
    ),
  ]);

  const reviews = reviewRows.rows.map(toProductReview);
  const summaryRow = summaryRows.rows[0] || { count: 0, average: 0 };
  const summary: ProductReviewSummary = {
    count: Number(summaryRow.count) || 0,
    average: Number(summaryRow.average) || 0,
  };

  return {
    reviews,
    summary,
    ownReview: reviews.find((review) => review.isOwnReview) || null,
  };
}

export async function saveReviewForCustomer(
  user: CustomerPublic,
  input: {
    productSlug: string;
    rating: number;
    title?: string;
    body?: string;
  },
) {
  const slug = input.productSlug.trim();
  const rating = Math.round(Number(input.rating));
  const title = (input.title || "").trim().slice(0, 120);
  const body = (input.body || "").trim().slice(0, 1200);

  if (!slug) throw new Error("Product is required.");
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  await ensureKleverAuthTables();
  await getPool().query(
    `insert into kf_product_reviews (
       customer_id,
       product_slug,
       rating,
       title,
       body,
       visible
     ) values ($1, $2, $3, $4, $5, true)
     on conflict (customer_id, product_slug) do update
     set rating = excluded.rating,
         title = excluded.title,
         body = excluded.body,
         visible = true,
         updated_at = now()`,
    [user.id, slug, rating, title, body],
  );

  return getReviewsForProduct(slug, user);
}

export async function deleteReviewForCustomer(
  user: CustomerPublic,
  productSlug: string,
) {
  const slug = productSlug.trim();
  if (!slug) throw new Error("Product is required.");

  await ensureKleverAuthTables();
  await getPool().query(
    `delete from kf_product_reviews
     where customer_id = $1 and product_slug = $2`,
    [user.id, slug],
  );

  return getReviewsForProduct(slug, user);
}

async function getCustomerRoles(customerId: string) {
  const roles = await getPool().query(
    `select role.slug
     from kf_customer_roles customer_role
     join kf_roles role on role.id = customer_role.role_id
     where customer_role.customer_id = $1
     order by role.slug`,
    [customerId],
  );
  return roles.rows.map((row) => row.slug as string);
}

async function assignDefaultCustomerRole(customerId: string) {
  await getPool().query(
    `insert into kf_customer_roles (customer_id, role_id)
     select $1, id from kf_roles where slug = 'customer'
     on conflict do nothing`,
    [customerId],
  );
}

export async function registerCustomer(input: {
  name: string;
  phone: string;
  email: string;
  password: string;
}) {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = normalizeEmail(input.email);

  if (!name || !phone || !email || !input.password) {
    throw new Error("Name, phone, email, and password are required.");
  }

  if (!email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  await ensureKleverAuthTables();
  const pool = getPool();
  const existing = await pool.query(
    `select id from kf_customer_accounts where lower(email) = $1 or phone = $2 limit 1`,
    [email, phone],
  );

  if (existing.rowCount) {
    throw new Error("An account with this email or phone already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_ROUNDS);
  const inserted = await pool.query(
    `insert into kf_customer_accounts (
      email,
      phone,
      full_name,
      password_hash,
      status
    ) values ($1, $2, $3, $4, 'active')
    returning id, full_name, email, phone`,
    [email, phone, name, passwordHash],
  );

  await assignDefaultCustomerRole(inserted.rows[0].id);
  return toCustomer({ ...inserted.rows[0], roles: ["customer"] });
}

export async function authenticateCustomer(input: {
  login: string;
  password: string;
}) {
  const login = input.login.trim().toLowerCase();
  if (!login || !input.password) {
    throw new Error("Email or phone and password are required.");
  }

  await ensureKleverAuthTables();
  const pool = getPool();
  const found = await pool.query(
    `select id, full_name, email, phone, password_hash, status
     from kf_customer_accounts
     where lower(coalesce(email, '')) = $1 or lower(coalesce(phone, '')) = $1
     limit 1`,
    [login],
  );

  const user = found.rows[0];
  if (!user || user.status !== "active") {
    return null;
  }

  const ok = await bcrypt.compare(input.password, user.password_hash || "");
  return ok
    ? toCustomer({ ...user, roles: await getCustomerRoles(user.id) })
    : null;
}

export async function createCustomerSession(customer: CustomerPublic) {
  await ensureKleverAuthTables();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await getPool().query(
    `insert into kf_customer_sessions (customer_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [customer.id, hashToken(token), expiresAt.toISOString()],
  );

  return { token, expiresAt };
}

export async function getCustomerBySessionToken(token: string) {
  if (!token) return null;
  await ensureKleverAuthTables();

  const found = await getPool().query(
    `select account.id, account.full_name, account.email, account.phone
     from kf_customer_sessions session
     join kf_customer_accounts account on account.id = session.customer_id
     where session.token_hash = $1
       and session.expires_at > now()
       and account.status = 'active'
     limit 1`,
    [hashToken(token)],
  );

  return found.rows[0]
    ? toCustomer({
        ...found.rows[0],
        roles: await getCustomerRoles(found.rows[0].id),
      })
    : null;
}

export async function updateCustomerProfile(
  user: CustomerPublic,
  input: {
    name: string;
    email: string;
    phone: string;
  },
) {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone.trim();

  if (!name || !email || !phone) {
    throw new Error("Name, email, and phone are required.");
  }

  if (!email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  await ensureKleverAuthTables();
  const pool = getPool();
  const existing = await pool.query(
    `select id
     from kf_customer_accounts
     where id <> $1 and (lower(email) = $2 or phone = $3)
     limit 1`,
    [user.id, email, phone],
  );

  if (existing.rowCount) {
    throw new Error("Another account already uses this email or phone.");
  }

  const updated = await pool.query(
    `update kf_customer_accounts
     set full_name = $1,
         email = $2,
         phone = $3,
         updated_at = now()
     where id = $4 and status = 'active'
     returning id, full_name, email, phone`,
    [name, email, phone, user.id],
  );

  if (!updated.rows[0]) {
    throw new Error("Unable to update this account.");
  }

  return toCustomer({
    ...updated.rows[0],
    roles: await getCustomerRoles(user.id),
  });
}

export async function updateCustomerPassword(
  user: CustomerPublic,
  input: {
    currentPassword: string;
    password: string;
  },
) {
  if (!input.currentPassword || !input.password) {
    throw new Error("Current password and new password are required.");
  }

  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  await ensureKleverAuthTables();
  const pool = getPool();
  const found = await pool.query(
    `select password_hash
     from kf_customer_accounts
     where id = $1 and status = 'active'
     limit 1`,
    [user.id],
  );

  const currentHash = found.rows[0]?.password_hash || "";
  const passwordMatches = await bcrypt.compare(
    input.currentPassword,
    currentHash,
  );

  if (!passwordMatches) {
    throw new Error("Current password is incorrect.");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_ROUNDS);
  await pool.query(
    `update kf_customer_accounts
     set password_hash = $1,
         updated_at = now()
     where id = $2`,
    [passwordHash, user.id],
  );
}

function normalizeAddressInput(input: Partial<CustomerAddress>) {
  const label = (input.label || "Home").trim() || "Home";
  const recipientName = (input.recipient_name || "").trim();
  const phone = (input.phone || "").trim();
  const addressLine1 = (input.address_line_1 || "").trim();
  const addressLine2 = (input.address_line_2 || "").trim();
  const ward = (input.ward || "").trim();
  const district = (input.district || "").trim();
  const city = (input.city || "").trim();
  const country = (input.country || "Vietnam").trim() || "Vietnam";

  if (!recipientName || !phone || !addressLine1 || !city) {
    throw new Error("Recipient, phone, address, and city are required.");
  }

  return {
    id: typeof input.id === "string" ? input.id.trim() : "",
    label,
    recipientName,
    phone,
    addressLine1,
    addressLine2: addressLine2 || null,
    ward: ward || null,
    district: district || null,
    city,
    country,
    isDefault: Boolean(input.is_default),
  };
}

export async function getCustomerAddresses(
  user: CustomerPublic,
): Promise<CustomerAddress[]> {
  await ensureKleverAuthTables();
  const rows = await getPool().query(
    `select id, label, recipient_name, phone, address_line_1, address_line_2,
            ward, district, city, country, is_default
     from kf_customer_addresses
     where customer_id = $1
     order by is_default desc, updated_at desc, created_at desc`,
    [user.id],
  );

  return rows.rows;
}

export async function saveCustomerAddress(
  user: CustomerPublic,
  input: Partial<CustomerAddress>,
) {
  const address = normalizeAddressInput(input);
  await ensureKleverAuthTables();

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("begin");

    const countResult = await client.query(
      `select count(*)::int as count
       from kf_customer_addresses
       where customer_id = $1`,
      [user.id],
    );
    const shouldBeDefault =
      address.isDefault || Number(countResult.rows[0]?.count || 0) === 0;

    if (shouldBeDefault) {
      await client.query(
        `update kf_customer_addresses
         set is_default = false,
             updated_at = now()
         where customer_id = $1`,
        [user.id],
      );
    }

    const saved = address.id
      ? await client.query(
          `update kf_customer_addresses
           set label = $1,
               recipient_name = $2,
               phone = $3,
               address_line_1 = $4,
               address_line_2 = $5,
               ward = $6,
               district = $7,
               city = $8,
               country = $9,
               is_default = case when $10 then true else is_default end,
               updated_at = now()
           where id = $11 and customer_id = $12
           returning id, label, recipient_name, phone, address_line_1,
                     address_line_2, ward, district, city, country, is_default`,
          [
            address.label,
            address.recipientName,
            address.phone,
            address.addressLine1,
            address.addressLine2,
            address.ward,
            address.district,
            address.city,
            address.country,
            shouldBeDefault,
            address.id,
            user.id,
          ],
        )
      : await client.query(
          `insert into kf_customer_addresses (
             customer_id,
             label,
             recipient_name,
             phone,
             address_line_1,
             address_line_2,
             ward,
             district,
             city,
             country,
             is_default
           ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           returning id, label, recipient_name, phone, address_line_1,
                     address_line_2, ward, district, city, country, is_default`,
          [
            user.id,
            address.label,
            address.recipientName,
            address.phone,
            address.addressLine1,
            address.addressLine2,
            address.ward,
            address.district,
            address.city,
            address.country,
            shouldBeDefault,
          ],
        );

    if (!saved.rows[0]) {
      throw new Error("Address was not found.");
    }

    await client.query("commit");
    return saved.rows[0] as CustomerAddress;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function setDefaultCustomerAddress(
  user: CustomerPublic,
  addressId: string,
) {
  const id = addressId.trim();
  if (!id) throw new Error("Address is required.");

  await ensureKleverAuthTables();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    const found = await client.query(
      `select id from kf_customer_addresses where id = $1 and customer_id = $2`,
      [id, user.id],
    );
    if (!found.rows[0]) throw new Error("Address was not found.");

    await client.query(
      `update kf_customer_addresses
       set is_default = false,
           updated_at = now()
       where customer_id = $1`,
      [user.id],
    );
    await client.query(
      `update kf_customer_addresses
       set is_default = true,
           updated_at = now()
       where id = $1 and customer_id = $2`,
      [id, user.id],
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteCustomerAddress(
  user: CustomerPublic,
  addressId: string,
) {
  const id = addressId.trim();
  if (!id) throw new Error("Address is required.");

  await ensureKleverAuthTables();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    const deleted = await client.query(
      `delete from kf_customer_addresses
       where id = $1 and customer_id = $2
       returning is_default`,
      [id, user.id],
    );
    if (!deleted.rows[0]) throw new Error("Address was not found.");

    if (deleted.rows[0].is_default) {
      await client.query(
        `update kf_customer_addresses
         set is_default = true,
             updated_at = now()
         where id = (
           select id
           from kf_customer_addresses
           where customer_id = $1
           order by updated_at desc, created_at desc
           limit 1
         )`,
        [user.id],
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export function isAdminCustomer(user: CustomerPublic | null) {
  return Boolean(user?.roles.includes("admin"));
}

export type CheckoutItemInput = {
  slug: string;
  name: string;
  price: number;
  quantity: number;
};

export type CheckoutInput = {
  customer: CustomerPublic | null;
  form: {
    name: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
  };
  cart: CheckoutItemInput[];
  subtotal: number;
  delivery: number;
  voucherCode?: string;
};

function orderNumber() {
  return `KF-${Date.now()}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

export async function createCheckoutOrder(input: CheckoutInput) {
  const form = {
    name: String(input.form.name || "").trim(),
    phone: String(input.form.phone || "").trim(),
    email: String(input.form.email || "").trim().toLowerCase(),
    address: String(input.form.address || "").trim(),
    notes: String(input.form.notes || "").trim(),
  };

  if (!input.cart.length) throw new Error("Giỏ hàng của bạn đang trống.");
  if (!form.name || !form.phone || !form.address) {
    throw new Error("Name, phone, and delivery address are required.");
  }

  const normalizedItems = input.cart.map((item) => ({
    slug: String(item.slug || "").trim(),
    quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
  }));
  if (normalizedItems.some((item) => !item.slug)) {
    throw new Error("One or more cart items are invalid.");
  }

  await ensureKleverAuthTables();
  const pool = getPool();
  const client = await pool.connect();
  const number = orderNumber();

  try {
    await client.query("begin");

    const orderItems: Array<{
      productId: string;
      slug: string;
      name: string;
      price: number;
      quantity: number;
      inventoryQuantity: number | null;
    }> = [];

    for (const item of normalizedItems) {
      const product = await client.query(
        `select id, slug, name, price_vnd, inventory_quantity, in_stock, visible
         from kf_products
         where slug = $1
         for update`,
        [item.slug],
      );
      const productRow = product.rows[0];

      if (!productRow || productRow.visible === false) {
        throw new Error("One or more cart items are no longer available.");
      }
      if (
        productRow.in_stock === false ||
        Number(productRow.inventory_quantity) === 0
      ) {
        throw new Error(`${productRow.name} is out of stock.`);
      }
      if (
        productRow.inventory_quantity !== null &&
        Number(productRow.inventory_quantity) < item.quantity
      ) {
        throw new Error(`${productRow.name} does not have enough inventory.`);
      }

      orderItems.push({
        productId: productRow.id,
        slug: productRow.slug,
        name: productRow.name,
        price: Math.max(0, Math.round(Number(productRow.price_vnd) || 0)),
        quantity: item.quantity,
        inventoryQuantity:
          productRow.inventory_quantity === null
            ? null
            : Number(productRow.inventory_quantity),
      });
    }

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const delivery = subtotal > 499000 || subtotal === 0 ? 0 : 42000;
    const voucher = input.voucherCode
      ? evaluateVoucher(input.voucherCode, subtotal, delivery)
      : null;
    if (input.voucherCode && !voucher?.valid) {
      throw new Error(voucher?.message || "Mã giảm giá không hợp lệ.");
    }
    const discount = voucher?.discount || 0;
    const total = subtotal + delivery - discount;

    const order = await client.query(
      `insert into kf_orders (
        order_number,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        delivery_address,
        notes,
        subtotal_vnd,
        delivery_vnd,
        discount_vnd,
        voucher_code,
        total_vnd
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      returning id, order_number, created_at`,
      [
        number,
        input.customer?.id || null,
        form.name,
        form.email || input.customer?.email || null,
        form.phone,
        form.address,
        form.notes || null,
        subtotal,
        delivery,
        discount,
        voucher?.code || null,
        total,
      ],
    );

    for (const item of orderItems) {
      let inventoryReserved = false;

      if (item.inventoryQuantity !== null) {
        await client.query(
          `update kf_products
           set inventory_quantity = inventory_quantity - $1,
               in_stock = inventory_quantity - $1 > 0,
               updated_at = now()
           where id = $2`,
          [item.quantity, item.productId],
        );
        inventoryReserved = true;
      }

      await client.query(
        `insert into kf_order_items (
          order_id,
          product_id,
          product_slug,
          product_name,
          quantity,
          unit_price_vnd,
          total_price_vnd,
          inventory_reserved,
          inventory_reserved_at
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, case when $8 then now() else null end)`,
        [
          order.rows[0].id,
          item.productId,
          item.slug,
          item.name,
          item.quantity,
          item.price,
          item.price * item.quantity,
          inventoryReserved,
        ],
      );
    }

    await client.query("commit");
    return {
      id: order.rows[0].id as string,
      orderNumber: order.rows[0].order_number as string,
      createdAt: order.rows[0].created_at as string,
      subtotal,
      delivery,
      discount,
      voucherCode: voucher?.code || "",
      total,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrdersForCustomer(user: CustomerPublic) {
  await ensureKleverAuthTables();
  const rows = await getPool().query(
    `select
       orders.id,
       orders.order_number,
       orders.customer_name,
       orders.customer_email,
       orders.customer_phone,
       orders.delivery_address,
       orders.status,
       orders.payment_status,
       orders.subtotal_vnd,
       orders.delivery_vnd,
       orders.total_vnd,
       orders.created_at,
       coalesce(
         json_agg(
           json_build_object(
             'slug', items.product_slug,
             'name', items.product_name,
             'quantity', items.quantity,
             'unitPrice', items.unit_price_vnd,
             'total', items.total_price_vnd
           )
         ) filter (where items.id is not null),
         '[]'
       ) as items
     from kf_orders orders
     left join kf_order_items items on items.order_id = orders.id
     where ($2::boolean = true or orders.customer_id = $1)
     group by orders.id
     order by orders.created_at desc
     limit 100`,
    [user.id, isAdminCustomer(user)],
  );
  return rows.rows;
}

export async function getCustomerRecordsForAdmin(user: CustomerPublic) {
  if (!isAdminCustomer(user)) throw new Error("Admin access is required.");
  await ensureKleverAuthTables();
  const rows = await getPool().query(
    `select account.id, account.full_name, account.email, account.phone,
            account.status, account.created_at,
            coalesce(array_agg(role.slug order by role.slug) filter (where role.slug is not null), '{}') as roles
     from kf_customer_accounts account
     left join kf_customer_roles customer_role on customer_role.customer_id = account.id
     left join kf_roles role on role.id = customer_role.role_id
     group by account.id
     order by account.created_at desc
     limit 200`,
  );
  return rows.rows;
}

export async function getInventoryForAdmin(user: CustomerPublic) {
  if (!isAdminCustomer(user)) throw new Error("Admin access is required.");
  await ensureKleverAuthTables();
  const rows = await getPool().query(
    `select product.id, product.slug, product.name, product.category,
            product.origin, product.price_vnd, product.compare_at_vnd,
            product.description, product.image_url, product.gift_ready,
            product.inventory_quantity, product.in_stock, product.visible,
            product.sort_order, product.updated_at,
            (
              select coalesce(array_agg(product_image.image_url order by product_image.sort_order), '{}')
              from kf_product_images product_image
              where product_image.product_id = product.id
            ) as image_urls,
            coalesce(
              array_agg(category.slug order by assignment.is_primary desc, assignment.sort_order, category.name)
                filter (where category.slug is not null),
              '{}'
            ) as category_slugs
     from kf_products product
     left join kf_product_category_assignments assignment
       on assignment.product_id = product.id
     left join kf_product_categories category
       on category.id = assignment.category_id
     group by product.id
     order by product.sort_order, product.name
     limit 500`,
  );
  return rows.rows;
}

function publicProductFromRow(row: {
  slug: string;
  name: string;
  category: string | null;
  origin: string | null;
  description: string | null;
  price_vnd: number | string;
  compare_at_vnd: number | string | null;
  image_url: string | null;
  image_urls?: string[] | null;
  gift_ready: boolean | null;
  in_stock: boolean | null;
  inventory_quantity: number | string | null;
  category_slugs?: string[] | null;
}): FruitProduct {
  const price = Number(row.price_vnd || 0);
  const compareAt =
    row.compare_at_vnd === null || row.compare_at_vnd === undefined
      ? undefined
      : Number(row.compare_at_vnd);
  const stockQuantity =
    row.inventory_quantity === null || row.inventory_quantity === undefined
      ? null
      : Number(row.inventory_quantity);
  const product: FruitProduct = {
    slug: row.slug,
    name: row.name,
    category: row.category || "",
    categorySlugs: Array.isArray(row.category_slugs) ? row.category_slugs : [],
    origin: row.origin || "",
    description: row.description || "",
    details: [],
    price,
    compareAt,
    badge:
      compareAt && compareAt > price
        ? `-${Math.round(((compareAt - price) / compareAt) * 100)}%`
        : undefined,
    image:
      (Array.isArray(row.image_urls) ? row.image_urls[0] : "") ||
      row.image_url ||
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80",
    images: Array.from(
      new Set(
        [
          ...(Array.isArray(row.image_urls) ? row.image_urls : []),
          row.image_url || "",
        ].filter(Boolean),
      ),
    ),
    giftReady: Boolean(row.gift_ready),
    inStock: row.in_stock !== false && stockQuantity !== 0,
    stockQuantity,
  };

  return {
    ...product,
    ...inferProductFilters(product),
  };
}

export async function getProductsForStorefront(): Promise<FruitProduct[]> {
  await ensureKleverAuthTables();
  const rows = await getPool().query(
    `select product.slug, product.name, product.category, product.origin,
            product.description, product.price_vnd, product.compare_at_vnd,
            product.image_url, product.gift_ready, product.inventory_quantity,
            product.in_stock,
            (
              select coalesce(array_agg(product_image.image_url order by product_image.sort_order), '{}')
              from kf_product_images product_image
              where product_image.product_id = product.id
            ) as image_urls,
            coalesce(
              array_agg(category.slug order by assignment.is_primary desc, assignment.sort_order, category.name)
                filter (where category.slug is not null),
              '{}'
            ) as category_slugs
     from kf_products product
     left join kf_product_category_assignments assignment
       on assignment.product_id = product.id
     left join kf_product_categories category
       on category.id = assignment.category_id and category.visible = true
     where product.visible = true
     group by product.id
     order by product.sort_order, product.name
     limit 500`,
  );
  return rows.rows.map(publicProductFromRow);
}

export async function getMediaAssetsForAdmin(
  user: CustomerPublic,
): Promise<MediaAsset[]> {
  if (!isAdminCustomer(user)) throw new Error("Admin access is required.");
  await ensureKleverAuthTables();
  const publicStoragePattern = `%/storage/v1/object/public/${VINFRUITS_STORAGE_BUCKET}/%`;
  const signedStoragePattern = `%/storage/v1/object/sign/${VINFRUITS_STORAGE_BUCKET}/%`;
  const rows = await getPool().query(
    `with uploaded_assets as (
       select
         id::text,
         file_name,
         content_type,
         size_bytes,
         public_url,
         alt_text,
         created_at,
         0 as source_order
       from kf_media_assets
       where public_url like $1 or public_url like $2
     ),
     product_asset_urls as (
       select
         product.id as product_id,
         product.name as product_name,
         product.image_url as public_url,
         product.updated_at as created_at,
         0 as image_order
       from kf_products product
       where nullif(product.image_url, '') is not null
         and (product.image_url like $1 or product.image_url like $2)

       union all

       select
         product.id as product_id,
         product.name as product_name,
         product_image.image_url as public_url,
         greatest(product.updated_at, product_image.created_at) as created_at,
         product_image.sort_order + 1 as image_order
       from kf_product_images product_image
       join kf_products product on product.id = product_image.product_id
       where nullif(product_image.image_url, '') is not null
         and (product_image.image_url like $1 or product_image.image_url like $2)
     ),
     product_assets as (
       select distinct on (public_url)
         ('product-' || md5(public_url)) as id,
         regexp_replace(lower(product_name), '[^a-z0-9]+', '-', 'g') ||
           case when image_order = 0 then '-primary' else '-' || image_order::text end ||
           '.jpg' as file_name,
         'image/supabase-storage' as content_type,
         0 as size_bytes,
         public_url,
         product_name as alt_text,
         created_at,
         1 as source_order
       from product_asset_urls
       where not exists (
         select 1 from uploaded_assets uploaded
         where uploaded.public_url = product_asset_urls.public_url
       )
       order by public_url, image_order, created_at desc
     )
     select id, file_name, content_type, size_bytes, public_url, alt_text, created_at
     from (
       select * from uploaded_assets
       union all
       select * from product_assets
     ) media_library
     order by source_order, created_at desc, file_name
     limit 500`,
    [publicStoragePattern, signedStoragePattern],
  );
  return rows.rows;
}

export async function saveMediaAssetForAdmin(
  user: CustomerPublic,
  input: {
    fileName: string;
    contentType: string;
    sizeBytes: number;
    publicUrl: string;
    altText?: string;
  },
) {
  if (!isAdminCustomer(user)) throw new Error("Admin access is required.");
  const fileName = input.fileName.trim() || "upload";
  const contentType = input.contentType.trim();
  const publicUrl = input.publicUrl.trim();
  if (!contentType.startsWith("image/")) {
    throw new Error("Only image uploads are supported.");
  }
  if (!publicUrl) throw new Error("Image data is required.");

  await ensureKleverAuthTables();
  const saved = await getPool().query(
    `insert into kf_media_assets (
       file_name,
       content_type,
       size_bytes,
       public_url,
       alt_text,
       created_by
     ) values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [
      fileName,
      contentType,
      Math.max(0, Math.round(Number(input.sizeBytes) || 0)),
      publicUrl,
      input.altText?.trim() || null,
      user.id,
    ],
  );
  return saved.rows[0]?.id as string | undefined;
}

export async function updateOrderForAdmin(
  user: CustomerPublic,
  input: {
    orderId: string;
    status?: string;
    paymentStatus?: string;
  },
) {
  if (!isAdminCustomer(user)) throw new Error("Admin access is required.");
  const orderId = input.orderId.trim();
  if (!orderId) throw new Error("Order is required.");

  const statuses = new Set([
    "new",
    "confirmed",
    "packing",
    "delivering",
    "completed",
    "cancelled",
  ]);
  const paymentStatuses = new Set(["pending", "paid", "failed", "refunded"]);
  const status = input.status?.trim();
  const paymentStatus = input.paymentStatus?.trim();

  if (status && !statuses.has(status)) throw new Error("Invalid order status.");
  if (paymentStatus && !paymentStatuses.has(paymentStatus)) {
    throw new Error("Invalid payment status.");
  }

  await ensureKleverAuthTables();
  await getPool().query(
    `update kf_orders
     set status = coalesce($2, status),
         payment_status = coalesce($3, payment_status),
         updated_at = now()
     where id = $1`,
    [orderId, status || null, paymentStatus || null],
  );
}

export async function getCategoriesForAdmin(user: CustomerPublic) {
  if (!isAdminCustomer(user)) throw new Error("Admin access is required.");
  await ensureKleverAuthTables();
  const rows = await getPool().query(
    `select id,
            slug,
            coalesce(nullif(name_vi, ''), name, nullif(name_en, '')) as name,
            name_vi,
            name_en,
            source_path,
            sort_order,
            visible,
            updated_at
     from kf_product_categories
     order by sort_order, coalesce(nullif(name_vi, ''), name, nullif(name_en, ''))
     limit 500`,
  );
  return rows.rows;
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const categoryEnglishNames = new Map([
  ["trái cây đang mùa", "Seasonal Fruit"],
  ["cherry nhập khẩu", "Imported Cherries"],
  ["nho sữa hàn quốc", "Korean Shine Muscat"],
  ["nho nhập khẩu", "Imported Grapes"],
  ["dâu tây", "Strawberries"],
  ["việt quất nhập khẩu", "Imported Blueberries"],
  ["kiwi nhập khẩu", "Imported Kiwi"],
  ["mận nhập khẩu", "Imported Plums"],
  ["đào, xuân đào nhập khẩu", "Imported Peaches and Nectarines"],
  ["táo nhập khẩu", "Imported Apples"],
  ["cam, quýt", "Oranges and Mandarins"],
  ["trái cây việt nam", "Vietnamese Fruit"],
  ["trái cây cắt sẵn", "Fresh-Cut Fruit"],
  ["đồ uống", "Drinks"],
  ["thẻ quà tặng", "Gift Card"],
]);

function translateCategoryName(input: string) {
  return categoryEnglishNames.get(input.trim().toLowerCase()) || null;
}

export async function saveCategoryForAdmin(
  user: CustomerPublic,
  input: {
    id?: string;
    slug?: string;
    name: string;
    nameVi?: string;
    nameEn?: string;
    sourcePath?: string;
    sortOrder?: number;
    visible?: boolean;
  },
) {
  if (!isAdminCustomer(user)) throw new Error("Admin access is required.");
  const nameVi = input.nameVi?.trim() || input.name.trim();
  const nameEn = input.nameEn?.trim() || translateCategoryName(nameVi);
  const name = nameVi || nameEn || input.name.trim();
  const slug = slugify(input.slug || name);
  if (!name || !slug) throw new Error("Category name is required.");

  await ensureKleverAuthTables();
  const saved = input.id
    ? await getPool().query(
        `update kf_product_categories
         set slug = $1,
             name = $2,
             name_vi = $3,
             name_en = $4,
             source_path = $5,
             sort_order = $6,
             visible = $7,
             updated_at = now()
         where id = $8
         returning id`,
        [
          slug,
          name,
          nameVi || name,
          nameEn,
          input.sourcePath?.trim() || `/collections/${slug}`,
          Math.max(0, Math.round(Number(input.sortOrder) || 0)),
          input.visible !== false,
          input.id,
        ],
      )
    : await getPool().query(
        `insert into kf_product_categories (
         slug,
         name,
         name_vi,
         name_en,
         source_path,
         sort_order,
         visible
         ) values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (slug) do update
         set name = excluded.name,
             name_vi = excluded.name_vi,
             name_en = excluded.name_en,
             source_path = excluded.source_path,
             sort_order = excluded.sort_order,
             visible = excluded.visible,
             updated_at = now()
         returning id`,
        [
          slug,
          name,
          nameVi || name,
          nameEn,
          input.sourcePath?.trim() || `/collections/${slug}`,
          Math.max(0, Math.round(Number(input.sortOrder) || 0)),
          input.visible !== false,
        ],
      );

  return saved.rows[0]?.id as string | undefined;
}

export async function saveProductForAdmin(
  user: CustomerPublic,
  input: {
    id?: string;
    slug?: string;
    name: string;
    category?: string;
    categorySlugs?: string[];
    origin: string;
    description?: string;
    priceVnd: number;
    compareAtVnd?: number | null;
    imageUrl?: string;
    imageUrls?: string[];
    giftReady?: boolean;
    inStock?: boolean;
    inventoryQuantity?: number | null;
    visible?: boolean;
    sortOrder?: number;
  },
) {
  if (!isAdminCustomer(user)) throw new Error("Admin access is required.");
  const name = input.name.trim();
  const slug = slugify(input.slug || name);
  const origin = input.origin.trim();
  const categorySlugs = Array.from(
    new Set(
      (input.categorySlugs || [])
        .map((value) => slugify(value))
        .filter(Boolean),
    ),
  );
  const imageUrls = Array.from(
    new Set(
      [input.imageUrl || "", ...(input.imageUrls || [])]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
  const primaryImageUrl = imageUrls[0] || "";

  if (!name || !slug || !origin) {
    throw new Error("Product name, slug, and origin are required.");
  }

  await ensureKleverAuthTables();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    const primaryCategory = categorySlugs[0] || slugify(input.category || "");
    let categoryName = input.category?.trim() || "";

    if (primaryCategory) {
      const category = await client.query(
        `select name from kf_product_categories where slug = $1 limit 1`,
        [primaryCategory],
      );
      categoryName = category.rows[0]?.name || categoryName;
    }

    const saved = input.id
      ? await client.query(
          `update kf_products
           set slug = $1,
               name = $2,
               category = $3,
               origin = $4,
               description = $5,
               price_vnd = $6,
               compare_at_vnd = $7,
               image_url = $8,
               gift_ready = $9,
               in_stock = $10,
               inventory_quantity = $11,
               visible = $12,
               sort_order = $13,
               updated_at = now()
           where id = $14
           returning id`,
          [
            slug,
            name,
            categoryName,
            origin,
            input.description?.trim() || "",
            Math.max(0, Math.round(Number(input.priceVnd) || 0)),
            input.compareAtVnd === null || input.compareAtVnd === undefined
              ? null
              : Math.max(0, Math.round(Number(input.compareAtVnd) || 0)),
            primaryImageUrl || null,
            Boolean(input.giftReady),
            input.inStock !== false,
            input.inventoryQuantity === null ||
            input.inventoryQuantity === undefined
              ? null
              : Math.max(0, Math.round(Number(input.inventoryQuantity) || 0)),
            input.visible !== false,
            Math.max(0, Math.round(Number(input.sortOrder) || 0)),
            input.id,
          ],
        )
      : await client.query(
          `insert into kf_products (
             slug,
             name,
             category,
             origin,
             description,
             price_vnd,
             compare_at_vnd,
             image_url,
             gift_ready,
             in_stock,
             inventory_quantity,
             visible,
             sort_order
           ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           on conflict (slug) do update
           set name = excluded.name,
               category = excluded.category,
               origin = excluded.origin,
               description = excluded.description,
               price_vnd = excluded.price_vnd,
               compare_at_vnd = excluded.compare_at_vnd,
               image_url = excluded.image_url,
               gift_ready = excluded.gift_ready,
               in_stock = excluded.in_stock,
               inventory_quantity = excluded.inventory_quantity,
               visible = excluded.visible,
               sort_order = excluded.sort_order,
               updated_at = now()
           returning id`,
          [
            slug,
            name,
            categoryName,
            origin,
            input.description?.trim() || "",
            Math.max(0, Math.round(Number(input.priceVnd) || 0)),
            input.compareAtVnd === null || input.compareAtVnd === undefined
              ? null
              : Math.max(0, Math.round(Number(input.compareAtVnd) || 0)),
            primaryImageUrl || null,
            Boolean(input.giftReady),
            input.inStock !== false,
            input.inventoryQuantity === null ||
            input.inventoryQuantity === undefined
              ? null
              : Math.max(0, Math.round(Number(input.inventoryQuantity) || 0)),
            input.visible !== false,
            Math.max(0, Math.round(Number(input.sortOrder) || 0)),
          ],
        );

    const productId = saved.rows[0]?.id;
    if (!productId) throw new Error("Unable to save product.");

    await client.query(
      `delete from kf_product_category_assignments where product_id = $1`,
      [productId],
    );

    for (const [index, categorySlug] of categorySlugs.entries()) {
      await client.query(
        `insert into kf_product_category_assignments (
           product_id,
           category_id,
           is_primary,
           sort_order
         )
         select $1, id, $3, $4
         from kf_product_categories
         where slug = $2
         on conflict (product_id, category_id) do update
         set is_primary = excluded.is_primary,
             sort_order = excluded.sort_order`,
        [productId, categorySlug, index === 0, index * 10],
      );
    }

    await client.query(`delete from kf_product_images where product_id = $1`, [
      productId,
    ]);

    for (const [index, imageUrl] of imageUrls.entries()) {
      await client.query(
        `insert into kf_product_images (
           product_id,
           image_url,
           alt_text,
           sort_order
         ) values ($1, $2, $3, $4)
         on conflict (product_id, image_url) do update
         set alt_text = excluded.alt_text,
             sort_order = excluded.sort_order`,
        [productId, imageUrl, name, index * 10],
      );
    }

    await client.query("commit");
    return productId as string;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteCustomerSession(token: string) {
  if (!token) return;
  await ensureKleverAuthTables();
  await getPool().query(
    `delete from kf_customer_sessions where token_hash = $1`,
    [hashToken(token)],
  );
}

export async function createPasswordResetRequest(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!email) {
    throw new Error("Email is required.");
  }

  await ensureKleverAuthTables();
  const pool = getPool();
  const found = await pool.query(
    `select id from kf_customer_accounts where lower(email) = $1 and status = 'active' limit 1`,
    [email],
  );

  if (!found.rows[0]?.id) {
    return null;
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await pool.query(
    `insert into kf_customer_password_resets (
      customer_id,
      email,
      token_hash,
      expires_at
    ) values ($1, $2, $3, $4)`,
    [found.rows[0].id, email, hashToken(token), expiresAt.toISOString()],
  );

  return { token, expiresAt: expiresAt.toISOString() };
}

export async function resetPasswordWithToken(input: {
  token: string;
  password: string;
}) {
  const token = input.token.trim();
  if (!token || !input.password) {
    throw new Error("Reset token and new password are required.");
  }

  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  await ensureKleverAuthTables();
  const pool = getPool();
  const found = await pool.query(
    `select id, customer_id
     from kf_customer_password_resets
     where token_hash = $1
       and used_at is null
       and expires_at > now()
     limit 1`,
    [hashToken(token)],
  );

  const reset = found.rows[0];
  if (!reset?.id || !reset.customer_id) {
    throw new Error("This password reset link is invalid or has expired.");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_ROUNDS);
  const client = await pool.connect();

  try {
    await client.query("begin");
    await client.query(
      `update kf_customer_accounts set password_hash = $1, updated_at = now()
       where id = $2`,
      [passwordHash, reset.customer_id],
    );
    await client.query(
      `update kf_customer_password_resets set used_at = now() where id = $1`,
      [reset.id],
    );
    await client.query(
      `delete from kf_customer_sessions where customer_id = $1`,
      [reset.customer_id],
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export function setCustomerSessionCookie(
  cookies: {
    set: (
      name: string,
      value: string,
      options: Record<string, unknown>,
    ) => void;
  },
  token: string,
) {
  cookies.set(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearCustomerSessionCookie(cookies: {
  delete: (name: string, options: Record<string, unknown>) => void;
}) {
  cookies.delete(SESSION_COOKIE, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
  });
}

export function getSessionTokenFromCookies(cookies: {
  get: (name: string) => { value: string } | undefined;
}) {
  return cookies.get(SESSION_COOKIE)?.value || "";
}
