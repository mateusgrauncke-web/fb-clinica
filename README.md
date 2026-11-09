# FB Clínica — estrutura inicial

Projeto inicial Next.js + TypeScript para a gestão de Fabiana Bruinsma Pilates & Fisioterapia, com identidade roxo/lilás e verde oliva.

## Incluído
- Painel inicial responsivo e atalhos de módulos
- Cliente Supabase para browser
- Página placeholder de Profissionais
- Migração SQL inicial para a tabela `profissionais` com RLS ativado (sem políticas abertas)

## Rodar localmente
1. Instale Node.js LTS.
2. Extraia o ZIP e rode `npm install`.
3. Copie `.env.example` para `.env.local`.
4. Preencha URL e chave anon/publicável do projeto Supabase `fb-clinica`.
5. Rode `npm run dev` e abra `http://localhost:3000`.

## Segurança / pendências
- Não coloque `service_role` no frontend nem em variáveis `NEXT_PUBLIC_*`.
- A migração não cria policies de acesso: por segurança, RLS bloqueia consultas até definirmos policies conforme `perfis_usuarios` e o modelo de autenticação atual.
- Antes de aplicar SQL, revisar o esquema existente. Não excluir `peixe` ou `servicos_de_pedido` até rastrear dependências.
- A tela do dashboard ainda exibe marcadores vazios; dados reais serão integrados em etapas.
