-- Categoria do produto no cardapio publico. NULL = nao aparece na pagina publica.
alter table public.menu_items
  add column if not exists categoria text check (categoria in ('bebidas', 'alcoolicas', 'cafes'));

-- Classificacao inicial pelo nome (ajuste depois pelo app, em Cardapio > Editar).
update public.menu_items set categoria = 'alcoolicas'
  where categoria is null and (nome ilike 'cerveja%' or nome ilike 'drink com%');
update public.menu_items set categoria = 'bebidas'
  where categoria is null and (nome ilike 'água%' or nome ilike 'agua%' or nome ilike 'refrigerante%'
    or nome ilike 'suco%' or nome ilike 'drink sem%');
update public.menu_items set categoria = 'cafes'
  where categoria is null and lower(nome) not in ('café', 'cafe especial')
    and (nome ilike 'caf%' or nome ilike 'capuccino%' or nome ilike 'cappuccino%' or nome ilike 'macchiato%');
