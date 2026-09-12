-- Execute este script no SQL Editor do Supabase (depois da migration_05).
-- Adiciona o nome de quem pagou em cada pagamento, e permite editar pagamentos já registrados.

alter table public.booking_payments
  add column if not exists pagante text;

drop policy if exists "Authenticated users can update payments" on public.booking_payments;
create policy "Authenticated users can update payments"
  on public.booking_payments for update to authenticated
  using (true)
  with check (true);
