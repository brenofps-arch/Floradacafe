-- Execute este script no SQL Editor do Supabase (depois da migration_07).
-- Registra quantas pessoas confirmadas nao compareceram, para ajustar o valor
-- final esperado (a entrada de 50% ja paga fica retida, mas o restante dessas
-- pessoas nao e cobrado).

alter table public.bookings
  add column if not exists qtd_nao_compareceram integer not null default 0;

alter table public.bookings
  drop constraint if exists bookings_qtd_nao_compareceram_check;

alter table public.bookings
  add constraint bookings_qtd_nao_compareceram_check check (qtd_nao_compareceram >= 0);
