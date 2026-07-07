create extension if not exists pgcrypto;

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

alter table kf_product_categories add column if not exists name_vi text;
alter table kf_product_categories add column if not exists name_en text;
update kf_product_categories
set name_vi = coalesce(nullif(name_vi, ''), name)
where name_vi is null or name_vi = '';

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

create index if not exists kf_product_categories_visible_sort_idx
  on kf_product_categories (visible, sort_order);
