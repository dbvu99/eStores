insert into kf_orders (
  id,
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
  total_vnd,
  status,
  payment_status,
  created_at,
  updated_at
)
values
  ('11111111-1111-4111-8111-111111111111', 'KF-MOCK-1001', null, 'Mock Customer One', 'mock.customer.one@example.com', '555-0101', '100 Demo Street, Ho Chi Minh City', 'Leave at reception.', 958000, 0, 0, 958000, 'new', 'pending', now() - interval '2 days', now() - interval '2 days'),
  ('22222222-2222-4222-8222-222222222222', 'KF-MOCK-1002', null, 'Mock Customer Two', 'mock.customer.two@example.com', '555-0102', '200 Demo Avenue, Hanoi', 'Gift note included.', 1499000, 42000, 0, 1541000, 'confirmed', 'pending', now() - interval '1 day', now() - interval '1 day'),
  ('33333333-3333-4333-8333-333333333333', 'KF-MOCK-1003', null, 'Mock Customer Three', 'mock.customer.three@example.com', '555-0103', '300 Demo Road, Da Nang', null, 777000, 0, 0, 777000, 'packing', 'paid', now() - interval '6 hours', now() - interval '6 hours')
on conflict (order_number) do update
set customer_name = excluded.customer_name,
    customer_email = excluded.customer_email,
    customer_phone = excluded.customer_phone,
    delivery_address = excluded.delivery_address,
    notes = excluded.notes,
    subtotal_vnd = excluded.subtotal_vnd,
    delivery_vnd = excluded.delivery_vnd,
    discount_vnd = excluded.discount_vnd,
    total_vnd = excluded.total_vnd,
    status = excluded.status,
    payment_status = excluded.payment_status,
    updated_at = now();

insert into kf_order_items (
  id,
  order_id,
  product_id,
  product_slug,
  product_name,
  quantity,
  unit_price_vnd,
  total_price_vnd,
  inventory_reserved,
  inventory_reserved_at
)
values
  ('aaaaaaaa-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', null, 'rainier-cherry-gift-box', 'Rainier Cherry Gift Box', 2, 479000, 958000, false, null),
  ('aaaaaaaa-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', null, 'thank-you-fruit-basket', 'Thank You Fruit Basket', 1, 1499000, 1499000, false, null),
  ('aaaaaaaa-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', null, 'blueberries-family-pack', 'Blueberries Family Pack', 3, 229000, 687000, false, null),
  ('aaaaaaaa-4444-4444-8444-444444444444', '33333333-3333-4333-8333-333333333333', null, 'cold-pressed-orange-juice', 'Cold Pressed Orange Juice', 1, 89000, 89000, false, null)
on conflict (id) do update
set product_slug = excluded.product_slug,
    product_name = excluded.product_name,
    quantity = excluded.quantity,
    unit_price_vnd = excluded.unit_price_vnd,
    total_price_vnd = excluded.total_price_vnd;
