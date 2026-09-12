-- Execute este script no SQL Editor do Supabase (depois da migration_02).
-- Adiciona o período (manhã/tarde) de cada agendamento.

alter table public.bookings
  add column if not exists periodo text not null default 'tarde';

alter table public.bookings
  drop constraint if exists bookings_periodo_check;

alter table public.bookings
  add constraint bookings_periodo_check check (periodo in ('manha', 'tarde'));

create index if not exists bookings_data_periodo_idx on public.bookings (data_agendamento, periodo);
