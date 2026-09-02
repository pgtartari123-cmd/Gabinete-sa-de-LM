# Gabinete LM

Sistema web/PWA para gestão de atendimento de gabinete, com foco em cidadãos, demandas, agenda, equipe e acompanhamento.

## Estado atual

O Gabinete LM está em fase final de validação operacional e já possui:

- 🔐 autenticação por usuário e senha;
- 👥 gestão de membros da equipe;
- 🛡️ perfis e permissões de acesso;
- ☁️ integração com Supabase;
- 🔒 Row Level Security (RLS) nas tabelas principais;
- 👤 cadastro de cidadãos;
- 📋 uma ou várias demandas por cidadão;
- 🔢 protocolos de demanda;
- 📅 agenda;
- 🎂 aniversários;
- 📊 painel e relatórios;
- 📱 funcionamento como PWA em HTTPS;
- 🔄 sincronização com renovação de sessão/token.

## Arquitetura

A interface é publicada pelo GitHub Pages. O Supabase fornece autenticação, banco de dados, políticas de acesso e funções necessárias para a gestão de usuários da equipe.

A chave pública do cliente pode aparecer no frontend; **service role/secret keys nunca devem ser colocadas no código publicado**.

## Segurança

O banco utiliza RLS e as operações de dados exigem usuário autenticado e membro ativo do gabinete. Operações administrativas, como gerenciamento da equipe e exclusões protegidas, dependem do perfil de administrador.

As funções de autorização usam `SECURITY DEFINER` com `search_path` controlado e não possuem execução liberada para usuários anônimos.

## Testes

Os testes de desenvolvimento devem utilizar dados fictícios. Antes de inserir dados reais, recomenda-se revisar configurações de produção, domínio, backups, políticas de acesso e procedimentos internos de proteção de dados.

## Deploy

Alterações enviadas para a branch `main` são publicadas automaticamente pelo workflow do GitHub Pages.

## Próximos acabamentos

- revisão visual e responsividade;
- limpeza de arquivos legados não utilizados;
- refinamento de mensagens e estados de carregamento;
- revisão final de produção e documentação.
