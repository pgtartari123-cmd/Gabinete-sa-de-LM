-- GABINETE DIGITAL
-- Estrutura inicial do banco Supabase/PostgreSQL.
-- Execute este arquivo no SQL Editor do projeto Supabase.

create extension if not exists pgcrypto;

create table if not exists public.cidadaos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  nome_mae text,
  data_nascimento date,
  cpf text,
  cartao_sus text,
  telefone text,
  bairro text,
  endereco text,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.demandas (
  id uuid primary key default gen_random_uuid(),
  cidadao_id uuid not null references public.cidadaos(id) on delete cascade,
  descricao text not null,
  tipo text not null default 'Outro',
  procedimento text,
  status text not null default 'Pendente',
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  concluido_em timestamptz,
  constraint demandas_status_check check (status in ('Pendente','Em andamento','Concluído'))
);

create table if not exists public.agenda (
  id uuid primary key default gen_random_uuid(),
  assunto text not null,
  data date not null,
  hora time,
  tipo text not null default 'Outro',
  status text not null default 'Pendente',
  observacoes text,
  criado_em timestamptz not null default now(),
  constraint agenda_status_check check (status in ('Pendente','Concluído'))
);

create index if not exists cidadaos_nome_idx on public.cidadaos using gin (to_tsvector('portuguese', coalesce(nome,'')));
create index if not exists cidadaos_cpf_idx on public.cidadaos (cpf);
create index if not exists cidadaos_bairro_idx on public.cidadaos (bairro);
create index if not exists demandas_cidadao_idx on public.demandas (cidadao_id);
create index if not exists demandas_status_idx on public.demandas (status);
create index if not exists demandas_tipo_idx on public.demandas (tipo);
create index if not exists agenda_data_idx on public.agenda (data);

create or replace function public.atualizar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists cidadaos_atualizado_em on public.cidadaos;
create trigger cidadaos_atualizado_em before update on public.cidadaos for each row execute function public.atualizar_atualizado_em();

drop trigger if exists demandas_atualizado_em on public.demandas;
create trigger demandas_atualizado_em before update on public.demandas for each row execute function public.atualizar_atualizado_em();

-- Segurança da API: somente usuários autenticados podem acessar os dados.
alter table public.cidadaos enable row level security;
alter table public.demandas enable row level security;
alter table public.agenda enable row level security;

-- Grants explícitos para o papel autenticado.
revoke all on table public.cidadaos from anon;
revoke all on table public.demandas from anon;
revoke all on table public.agenda from anon;
grant select, insert, update, delete on table public.cidadaos to authenticated;
grant select, insert, update, delete on table public.demandas to authenticated;
grant select, insert, update, delete on table public.agenda to authenticated;

-- Políticas idempotentes: todos os usuários autenticados do gabinete podem trabalhar nos dados.
drop policy if exists "cidadaos_authenticated_all" on public.cidadaos;
drop policy if exists "cidadaos_authenticated_select" on public.cidadaos;
drop policy if exists "cidadaos_authenticated_insert" on public.cidadaos;
drop policy if exists "cidadaos_authenticated_update" on public.cidadaos;
drop policy if exists "cidadaos_authenticated_delete" on public.cidadaos;
create policy "cidadaos_authenticated_select" on public.cidadaos for select to authenticated using (true);
create policy "cidadaos_authenticated_insert" on public.cidadaos for insert to authenticated with check (true);
create policy "cidadaos_authenticated_update" on public.cidadaos for update to authenticated using (true) with check (true);
create policy "cidadaos_authenticated_delete" on public.cidadaos for delete to authenticated using (true);

drop policy if exists "demandas_authenticated_all" on public.demandas;
drop policy if exists "demandas_authenticated_select" on public.demandas;
drop policy if exists "demandas_authenticated_insert" on public.demandas;
drop policy if exists "demandas_authenticated_update" on public.demandas;
drop policy if exists "demandas_authenticated_delete" on public.demandas;
create policy "demandas_authenticated_select" on public.demandas for select to authenticated using (true);
create policy "demandas_authenticated_insert" on public.demandas for insert to authenticated with check (true);
create policy "demandas_authenticated_update" on public.demandas for update to authenticated using (true) with check (true);
create policy "demandas_authenticated_delete" on public.demandas for delete to authenticated using (true);

drop policy if exists "agenda_authenticated_all" on public.agenda;
drop policy if exists "agenda_authenticated_select" on public.agenda;
drop policy if exists "agenda_authenticated_insert" on public.agenda;
drop policy if exists "agenda_authenticated_update" on public.agenda;
drop policy if exists "agenda_authenticated_delete" on public.agenda;
create policy "agenda_authenticated_select" on public.agenda for select to authenticated using (true);
create policy "agenda_authenticated_insert" on public.agenda for insert to authenticated with check (true);
create policy "agenda_authenticated_update" on public.agenda for update to authenticated using (true) with check (true);
create policy "agenda_authenticated_delete" on public.agenda for delete to authenticated using (true);

-- Categorias: Saúde, Educação, Assistência Social, Infraestrutura, Emprego,
-- Documentação, Transporte, Habitação e Outro.
