-- Execute este script no SQL Editor do Supabase (depois da migration_06).
-- Cria o cardápio de produtos (nome + valor base) para agilizar o lançamento de produtos extras.

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;

drop policy if exists "Authenticated users can view menu items" on public.menu_items;
create policy "Authenticated users can view menu items"
  on public.menu_items for select to authenticated using (true);

drop policy if exists "Authenticated users can insert menu items" on public.menu_items;
create policy "Authenticated users can insert menu items"
  on public.menu_items for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update menu items" on public.menu_items;
create policy "Authenticated users can update menu items"
  on public.menu_items for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete menu items" on public.menu_items;
create policy "Authenticated users can delete menu items"
  on public.menu_items for delete to authenticated using (true);
