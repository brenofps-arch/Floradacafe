-- Execute este script no SQL Editor do seu projeto Supabase (instalação nova).
-- Se você já rodou uma versão anterior deste schema, use migration_02_precos_produtos.sql em vez deste arquivo.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null,
  data_agendamento date not null,
  periodo text not null default 'tarde' check (periodo in ('manha', 'tarde')),
  qtd_adultos integer not null default 0,
  qtd_criancas integer not null default 0,
  qtd_gratuitos integer not null default 0,
  qtd_adultos_nao_compareceram integer not null default 0 check (qtd_adultos_nao_compareceram >= 0),
  qtd_criancas_nao_compareceram integer not null default 0 check (qtd_criancas_nao_compareceram >= 0),
  valor_pessoas numeric(10, 2) not null default 0,
  valor_pago numeric(10, 2) not null default 0,
  observacao text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_data_agendamento_idx on public.bookings (data_agendamento);
create index if not exists bookings_data_periodo_idx on public.bookings (data_agendamento, periodo);

alter table public.bookings enable row level security;

-- Qualquer usuário autenticado (dono + funcionários) pode ver e gerenciar todos os agendamentos.
create policy "Authenticated users can view bookings"
  on public.bookings for select
  to authenticated
  using (true);

create policy "Authenticated users can insert bookings"
  on public.bookings for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update bookings"
  on public.bookings for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete bookings"
  on public.bookings for delete
  to authenticated
  using (true);

-- Mantém updated_at em dia automaticamente.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row
  execute function public.set_updated_at();

-- Produtos extras vendidos em uma reserva (café, bebidas etc.)
create table if not exists public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  descricao text not null,
  quantidade numeric(10, 2) not null default 1,
  valor_unitario numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.booking_items enable row level security;

create policy "Authenticated users can view items"
  on public.booking_items for select to authenticated using (true);

create policy "Authenticated users can insert items"
  on public.booking_items for insert to authenticated with check (true);

create policy "Authenticated users can delete items"
  on public.booking_items for delete to authenticated using (true);

-- Histórico de pagamentos por forma (dinheiro, pix, crédito, débito), permite dividir o pagamento.
create table if not exists public.booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  forma_pagamento text not null check (forma_pagamento in ('dinheiro', 'pix', 'credito', 'debito')),
  valor numeric(10, 2) not null,
  comprovante_url text,
  pagante text,
  created_at timestamptz not null default now()
);

create index if not exists booking_payments_booking_id_idx on public.booking_payments (booking_id);

alter table public.booking_payments enable row level security;

create policy "Authenticated users can view payments"
  on public.booking_payments for select to authenticated using (true);

create policy "Authenticated users can insert payments"
  on public.booking_payments for insert to authenticated with check (true);

create policy "Authenticated users can update payments"
  on public.booking_payments for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete payments"
  on public.booking_payments for delete to authenticated using (true);

-- Bucket de armazenamento para os comprovantes (print do PIX)
insert into storage.buckets (id, name, public)
values ('comprovantes', 'comprovantes', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload comprovantes"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'comprovantes');

create policy "Authenticated users can update comprovantes"
  on storage.objects for update to authenticated
  using (bucket_id = 'comprovantes');

create policy "Authenticated users can view comprovantes"
  on storage.objects for select to authenticated
  using (bucket_id = 'comprovantes');

-- Perfis de acesso: administrador (dono, vê faturamento) e colaborador (funcionário, não vê)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'colaborador' check (role in ('administrador', 'colaborador')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role) values (new.id, 'colaborador')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Configuração de preços por pessoa (compartilhada entre todos os usuários)
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

create policy "Authenticated users can view settings"
  on public.settings for select to authenticated using (true);

create policy "Authenticated users can update settings"
  on public.settings for update to authenticated using (true) with check (true);

-- Cardápio de produtos (nome + valor base) para agilizar o lançamento de produtos extras
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;

create policy "Authenticated users can view menu items"
  on public.menu_items for select to authenticated using (true);

create policy "Authenticated users can insert menu items"
  on public.menu_items for insert to authenticated with check (true);

create policy "Authenticated users can update menu items"
  on public.menu_items for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete menu items"
  on public.menu_items for delete to authenticated using (true);
