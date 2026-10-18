-- Produtos repetidos que so mudam de quantidade viram uma linha com colunas Pequeno/Grande.
alter table public.menu_items
  add column if not exists grupo text,
  add column if not exists tamanho text check (tamanho in ('pequeno', 'grande'));

-- Classificacao inicial (ajuste pelo app, em Cardapio > Editar).
update public.menu_items set grupo = 'Café chemics', tamanho = 'pequeno' where nome ilike 'Café chemics (200%';
update public.menu_items set grupo = 'Café chemics', tamanho = 'grande' where nome ilike 'Café chemics (400%';
