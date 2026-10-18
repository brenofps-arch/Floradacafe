-- Foto de cada produto do cardapio (exibida na pagina publica).
alter table public.menu_items add column if not exists foto_url text;

insert into storage.buckets (id, name, public)
values ('cardapio', 'cardapio', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload cardapio fotos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'cardapio');

create policy "Authenticated users can update cardapio fotos"
  on storage.objects for update to authenticated
  using (bucket_id = 'cardapio');
