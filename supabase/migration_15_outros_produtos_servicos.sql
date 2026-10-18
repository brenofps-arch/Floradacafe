-- Nova categoria "Outros Produtos e Servicos" no cardapio publico.
-- Valor 0 aparece como "Sob consulta" na pagina publica.
alter table public.menu_items drop constraint if exists menu_items_categoria_check;
alter table public.menu_items
  add constraint menu_items_categoria_check check (categoria in ('bebidas', 'alcoolicas', 'cafes', 'outros'));

update public.menu_items set categoria = 'outros'
  where nome in ('Exclusividade Cafeteria Total', 'Exclusividade Deck Lagoa', 'Mel 500ml', 'Mel 1000ml', 'Café', 'cafe especial');

insert into public.menu_items (nome, valor, categoria)
select 'Eventos', 0, 'outros'
where not exists (select 1 from public.menu_items where nome = 'Eventos');
