# Configuração do Supabase — Gabinete Digital

## 1. Criar as tabelas

No projeto Supabase do Gabinete, abra **SQL Editor → New query**.

Abra o arquivo `supabase/schema.sql` deste repositório, copie todo o conteúdo, cole no SQL Editor e execute.

Isso cria:

- `cidadaos` — cadastro das pessoas atendidas;
- `demandas` — uma ou várias demandas para cada cidadão;
- `agenda` — compromissos do gabinete;
- índices para busca e filtros;
- atualização automática do campo `atualizado_em`;
- RLS para permitir acesso somente a usuários autenticados.

## 2. Segurança

Não coloque `service_role key` no código do site.

A próxima etapa de integração deve usar a chave pública `anon`/publishable e Supabase Auth. As políticas do banco já estão preparadas para usuários autenticados.

## 3. Estado atual do site

O site continua funcionando localmente com `localStorage`. Isso evita quebrar a versão que já está funcionando enquanto a integração com o Supabase é concluída.

## 4. Próxima etapa

Depois que o SQL for executado, a aplicação será ligada ao Supabase para que os cadastros deixem de ficar apenas no aparelho e passem a ser compartilhados entre os computadores/celulares autorizados do gabinete.
