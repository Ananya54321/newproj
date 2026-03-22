-- ============================================================
-- FUREVER — Phase 5: Marketplace
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ─── Add category column to products ──────────────────────────────────────────
alter table public.products
  add column if not exists category text check (
    category in ('food','treats','toys','accessories','grooming','health','bedding','other')
  );

-- ─── order_status enum ────────────────────────────────────────────────────────
do $$ begin
  create type order_status as enum (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

-- ─── orders ───────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id               uuid          primary key default gen_random_uuid(),
  user_id          uuid          not null references public.profiles(id) on delete cascade,
  store_id         uuid          not null references public.stores(id) on delete cascade,
  status           order_status  not null default 'pending',
  total_amount     numeric(12,2) not null,
  shipping_address text,
  notes            text,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

create index if not exists idx_orders_user_id  on public.orders(user_id);
create index if not exists idx_orders_store_id on public.orders(store_id);

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

-- ─── order_items ──────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id          uuid          primary key default gen_random_uuid(),
  order_id    uuid          not null references public.orders(id) on delete cascade,
  product_id  uuid          not null references public.products(id),
  quantity    integer       not null check (quantity > 0),
  unit_price  numeric(10,2) not null,
  created_at  timestamptz   not null default now()
);

create index if not exists idx_order_items_order_id   on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- orders policies
create policy "users_select_own_orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "store_owners_select_orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.stores
      where id = store_id and owner_id = auth.uid()
    )
  );

create policy "authenticated_insert_orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "users_cancel_own_orders"
  on public.orders for update
  using (auth.uid() = user_id);

create policy "store_owners_update_orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.stores
      where id = store_id and owner_id = auth.uid()
    )
  );

-- order_items policies
create policy "users_select_own_order_items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where id = order_id and user_id = auth.uid()
    )
  );

create policy "store_owners_select_order_items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      join public.stores s on s.id = o.store_id
      where o.id = order_id and s.owner_id = auth.uid()
    )
  );

create policy "authenticated_insert_order_items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where id = order_id and user_id = auth.uid()
    )
  );

-- ─── Products RLS (add store_owner write policies if not present) ──────────────
do $$ begin
  create policy "store_owners_insert_products"
    on public.products for insert
    with check (
      exists (
        select 1 from public.stores
        where id = store_id and owner_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "store_owners_update_products"
    on public.products for update
    using (
      exists (
        select 1 from public.stores
        where id = store_id and owner_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "store_owners_delete_products"
    on public.products for delete
    using (
      exists (
        select 1 from public.stores
        where id = store_id and owner_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;
