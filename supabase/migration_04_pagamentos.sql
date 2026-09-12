-- Execute este script no SQL Editor do Supabase (depois da migration_03).
-- Cria o histórico de pagamentos por forma (dinheiro, pix, crédito, débito),
-- permitindo dividir o pagamento de uma reserva entre várias formas.

create table if not exists public.booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  forma_pagamento text not null check (forma_pagamento in ('dinheiro', 'pix', 'credito', 'debito')),
  valor numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists booking_payments_booking_id_idx on public.booking_payments (booking_id);

alter table public.booking_payments enable row level security;

drop policy if exists "Authenticated users can view payments" on public.booking_payments;
create policy "Authenticated users can view payments"
  on public.booking_payments for select to authenticated using (true);

drop policy if exists "Authenticated users can insert payments" on public.booking_payments;
create policy "Authenticated users can insert payments"
  on public.booking_payments for insert to authenticated with check (true);

drop policy if exists "Authenticated users can delete payments" on public.booking_payments;
create policy "Authenticated users can delete payments"
  on public.booking_payments for delete to authenticated using (true);
