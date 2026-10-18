-- Permite que a pagina publica (QR code das mesas) leia o cardapio sem login.
create policy "Anon can view menu items"
  on public.menu_items for select to anon using (true);
