-- Execute este script no SQL Editor do Supabase (depois da migration_08).
-- Substitui a contagem unica de "nao compareceram" por duas colunas
-- (adultos e criancas), para descontar o valor certo de cada categoria.

alter table public.bookings
  add column if not exists qtd_adultos_nao_compareceram integer not null default 0,
  add column if not exists qtd_criancas_nao_compareceram integer not null default 0;

alter table public.bookings
  drop constraint if exists bookings_qtd_adultos_nao_compareceram_check;
alter table public.bookings
  add constraint bookings_qtd_adultos_nao_compareceram_check check (qtd_adultos_nao_compareceram >= 0);

alter table public.bookings
  drop constraint if exists bookings_qtd_criancas_nao_compareceram_check;
alter table public.bookings
  add constraint bookings_qtd_criancas_nao_compareceram_check check (qtd_criancas_nao_compareceram >= 0);

-- Migra o dado antigo (contagem unica) para adultos, como aproximacao.
update public.bookings
set qtd_adultos_nao_compareceram = qtd_nao_compareceram
where qtd_nao_compareceram > 0;

alter table public.bookings
  drop constraint if exists bookings_qtd_nao_compareceram_check;
alter table public.bookings
  drop column if exists qtd_nao_compareceram;
