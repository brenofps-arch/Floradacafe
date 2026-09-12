-- Execute este script no SQL Editor do Supabase (depois da migration_04).
-- Adiciona: comprovante de PIX por pagamento, e perfis de acesso (administrador/colaborador).

-- 1) Comprovante (print do PIX) anexado a um pagamento
alter table public.booking_payments
  add column if not exists comprovante_url text;

-- 2) Bucket de armazenamento para os comprovantes
insert into storage.buckets (id, name, public)
values ('comprovantes', 'comprovantes', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload comprovantes" on storage.objects;
create policy "Authenticated users can upload comprovantes"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'comprovantes');

drop policy if exists "Authenticated users can update comprovantes" on storage.objects;
create policy "Authenticated users can update comprovantes"
  on storage.objects for update to authenticated
  using (bucket_id = 'comprovantes');

drop policy if exists "Authenticated users can view comprovantes" on storage.objects;
create policy "Authenticated users can view comprovantes"
  on storage.objects for select to authenticated
  using (bucket_id = 'comprovantes');

-- 3) Perfis de acesso: administrador (dono, vê faturamento) e colaborador (funcionário, não vê)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'colaborador' check (role in ('administrador', 'colaborador')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

-- Cria automaticamente um perfil "colaborador" para cada novo usuário criado no Supabase Auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role) values (new.id, 'colaborador')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cria um perfil para os usuários que você já cadastrou antes desta migração.
insert into public.profiles (id, role)
select id, 'colaborador' from auth.users
on conflict (id) do nothing;

-- IMPORTANTE: troque o e-mail abaixo pelo seu e-mail de dono/administrador e rode este UPDATE
-- separadamente (pode rodar depois, quantas vezes precisar, para promover outras contas):
--
-- update public.profiles set role = 'administrador'
-- where id = (select id from auth.users where email = 'SEU-EMAIL-AQUI@exemplo.com');
