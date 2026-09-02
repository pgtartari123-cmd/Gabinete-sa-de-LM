# Supabase — Gabinete LM

## Estado atual

A integração do Gabinete LM com o Supabase já está configurada. O sistema utiliza autenticação, banco em nuvem, RLS e funções protegidas para o gerenciamento de usuários.

## Componentes principais

- `cidadaos` — cadastro das pessoas atendidas;
- `demandas` — demandas e procedimentos vinculados aos cidadãos;
- `agenda` — compromissos do gabinete;
- `equipe_membros` — membros autorizados da equipe;
- `perfis_usuario` — perfil e permissões do usuário.

## Segurança

O frontend usa somente a chave pública (`anon`/publishable). **Nunca coloque `service_role` ou secret keys no site.**

As tabelas principais possuem RLS. As funções de autorização usam `SECURITY DEFINER` com `search_path` controlado, e a execução para usuários anônimos foi removida.

Em termos operacionais, o fluxo é:

1. administrador entra no sistema;
2. administrador cria um membro da equipe;
3. o membro recebe usuário e senha;
4. o membro entra pelo mesmo endereço do Gabinete LM;
5. o perfil determina as opções visíveis no sistema;
6. o banco aplica as regras de acesso independentemente da interface.

## Desenvolvimento e produção

Durante o desenvolvimento, utilize somente dados fictícios.

Antes do uso com dados reais, faça a revisão final de produção, incluindo backup, recuperação de conta, domínio/HTTPS, políticas internas de acesso e procedimentos de proteção de dados.

## Migrações

As alterações estruturais do banco são aplicadas por migrações do Supabase. Não é necessário executar novamente migrações já aplicadas apenas para testar o sistema.
