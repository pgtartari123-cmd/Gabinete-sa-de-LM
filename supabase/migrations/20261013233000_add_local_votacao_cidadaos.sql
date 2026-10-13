-- Persiste os dados do local de votação para que o Mapa Eleitoral compare cadastros
-- entre dispositivos sem depender apenas do armazenamento local do navegador.
alter table public.cidadaos
  add column if not exists local_votacao text,
  add column if not exists codigo_local_votacao text;
