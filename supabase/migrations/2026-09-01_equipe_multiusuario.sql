-- Gabinete Digital — Equipe multiusuário + RLS
-- Execute no SQL Editor do Supabase uma vez.

create table if not exists public.equipe_membros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  cargo text not null default 'Atendimento',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists equipe_membros_email_idx on public.equipe_membros (lower(email));

alter table public.equipe_membros enable row level security;

-- Função SECURITY DEFINER evita recursão da RLS ao consultar perfis_usuario.
create or replace function public.usuario_eh_administrador()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfis_usuario p
    where p.id = auth.uid()
      and lower(coalesce(p.perfil,'')) in ('admin','administrador')
  );
$$;

revoke all on function public.usuario_eh_administrador() from public;
grant execute on function public.usuario_eh_administrador() to authenticated;

drop policy if exists equipe_select_admin on public.equipe_membros;
drop policy if exists equipe_insert_admin on public.equipe_membros;
drop policy if exists equipe_update_admin on public.equipe_membros;
drop policy if exists equipe_delete_admin on public.equipe_membros;

authorize -- placeholder

create policy equipe_select_admin on public.equipe_membros
for select to authenticated using (public.usuario_eh_administrador());

create policy equipe_insert_admin on public.equipe_membros
for insert to authenticated with check (public.usuario_eh_administrador());

create policy equipe_update_admin on public.equipe_membros
for update to authenticated
using (public.usuario_eh_administrador())
with check (public.usuario_eh_administrador());

create policy equipe_delete_admin on public.equipe_membros
for delete to authenticated using (public.usuario_eh_administrador());

-- Sincroniza atualizado_em em alterações.
create or replace function public.atualizar_equipe_membro_timestamp()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists equipe_membros_timestamp on public.equipe_membros;
create trigger equipe_membros_timestamp
before update on public.equipe_membros
for each row execute function public.atualizar_equipe_membro_timestamp();
