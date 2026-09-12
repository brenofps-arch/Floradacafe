-- Execute este script no SQL Editor do Supabase (projeto já existente da Florada Café).
-- Ele adapta o banco para: preços por categoria de pessoa, produtos extras e configuração de preços.

-- 1) Novas colunas de quantidade por categoria de pessoa
alter table public.bookings
  add column if not exists qtd_adultos integer not null default 0,
  add column if not exists qtd_criancas integer not null default 0,
  add column if not exists qtd_gratuitos integer not null default 0,
  add column if not exists valor_pessoas numeric(10, 2) not null default 0;

-- 2) Migra dados antigos (se existirem): trata reservas antigas como "adultos"
update public.bookings
set qtd_adultos = quantidade_pessoas, valor_pessoas = valor_total
where quantidade_pessoas is not null and qtd_adultos = 0;

-- 3) Remove as colunas antigas (o total agora é calculado automaticamente)
alter table public.bookings drop column if exists quantidade_pessoas;
alter table public.bookings drop column if exists valor_total;

-- 4) Produtos extras vendidos em uma reserva (café, bebidas etc.)
create table if not exists public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  descricao text not null,
  quantidade numeric(10, 2) not null default 1,
  valor_unitario numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.booking_items enable row level security;

drop policy if exists "Authenticated users can view items" on public.booking_items;
create policy "Authenticated users can view items"
  on public.booking_items for select to authenticated using (true);

drop policy if exists "Authenticated users can insert items" on public.booking_items;
create policy "Authenticated users can insert items"
  on public.booking_items for insert to authenticated with check (true);

drop policy if exists "Authenticated users can delete items" on public.booking_items;
create policy "Authenticated users can delete items"
  on public.booking_items for delete to authenticated using (true);

-- 5) Configuração de preços por pessoa (compartilhada entre todos os usuários)
create table if not exists public.settings (
  id integer primary key default 1,
  valor_adulto numeric(10, 2) not null default 90,
  valor_crianca numeric(10, 2) not null default 45,
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

insert into public.settings (id, valor_adulto, valor_crianca)
values (1, 90, 45)
on conflict (id) do nothing;

alter table public.settings enable row level security;

drop policy if exists "Authenticated users can view settings" on public.settings;
create policy "Authenticated users can view settings"
  on public.settings for select to authenticated using (true);

drop policy if exists "Authenticated users can update settings" on public.settings;
create policy "Authenticated users can update settings"
  on public.settings for update to authenticated using (true) with check (true);
