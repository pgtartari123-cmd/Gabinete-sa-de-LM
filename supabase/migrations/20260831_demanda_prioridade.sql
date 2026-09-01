-- GABINETE DIGITAL — prioridade das demandas
-- Aplicado no projeto Supabase do gabinete.

alter table public.demandas add column if not exists prioridade text not null default 'Normal';

drop constraint if exists demandas_prioridade_check;
alter table public.demandas add constraint demandas_prioridade_check
  check (prioridade in ('Baixa','Normal','Alta','Urgente'));

create index if not exists demandas_prioridade_idx on public.demandas (prioridade);
create index if not exists atendimentos_cidadao_data_idx on public.atendimentos (cidadao_id, data_atendimento desc);
