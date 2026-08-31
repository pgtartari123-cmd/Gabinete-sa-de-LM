-- CORREÇÃO RÁPIDA — GABINETE DIGITAL
-- Execute este arquivo uma vez no SQL Editor do Supabase.

alter table public.cidadaos enable row level security;
alter table public.demandas enable row level security;
alter table public.agenda enable row level security;

revoke all on table public.cidadaos from anon;
revoke all on table public.demandas from anon;
revoke all on table public.agenda from anon;

grant select, insert, update, delete on table public.cidadaos to authenticated;
grant select, insert, update, delete on table public.demandas to authenticated;
grant select, insert, update, delete on table public.agenda to authenticated;

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

select 'OK — RLS, permissões e políticas corrigidas.' as resultado;
