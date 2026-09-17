-- Execute este script no SQL Editor do Supabase (depois da migration_09).
-- Cria um log de auditoria: registra automaticamente quem criou, editou ou
-- excluiu um agendamento. So administradores podem ver esse log.

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  actor_id uuid,
  actor_email text,
  summary text,
  data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists "Administradores podem ver o log" on public.audit_log;
create policy "Administradores podem ver o log"
  on public.audit_log for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrador'));

-- Funcao que grava um registro no log a cada insercao, edicao ou exclusao de agendamento.
create or replace function public.log_booking_change()
returns trigger as $$
declare
  v_actor uuid := auth.uid();
  v_email text;
begin
  select email into v_email from auth.users where id = v_actor;

  if (tg_op = 'DELETE') then
    insert into public.audit_log (table_name, record_id, action, actor_id, actor_email, summary, data)
    values (
      'bookings', old.id, 'delete', v_actor, v_email,
      old.nome || ' - ' || old.data_agendamento || ' (' || old.periodo || ')',
      to_jsonb(old)
    );
    return old;
  elsif (tg_op = 'UPDATE') then
    insert into public.audit_log (table_name, record_id, action, actor_id, actor_email, summary, data)
    values (
      'bookings', new.id, 'update', v_actor, v_email,
      new.nome || ' - ' || new.data_agendamento || ' (' || new.periodo || ')',
      jsonb_build_object('antes', to_jsonb(old), 'depois', to_jsonb(new))
    );
    return new;
  elsif (tg_op = 'INSERT') then
    insert into public.audit_log (table_name, record_id, action, actor_id, actor_email, summary, data)
    values (
      'bookings', new.id, 'insert', v_actor, v_email,
      new.nome || ' - ' || new.data_agendamento || ' (' || new.periodo || ')',
      to_jsonb(new)
    );
    return new;
  end if;
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists bookings_audit_trigger on public.bookings;
create trigger bookings_audit_trigger
  after insert or update or delete on public.bookings
  for each row execute function public.log_booking_change();
