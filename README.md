# Cafeteria — Agendamentos

Sistema simples para controlar agendamentos de clientes da cafeteria (via WhatsApp), o pagamento da entrada (50%) e o saldo restante pago no dia.

## O que o sistema faz

- Cadastro de agendamento: nome, telefone, data, quantidade de pessoas, valor total (fixo) e valor pago de entrada.
- Lista de clientes com busca por nome/telefone, filtro por data e por status (falta pagar / pago total).
- No dia da visita: você abre o registro do cliente e clica em **Registrar pagamento** para lançar o valor restante — o status muda automaticamente para "Pago total".
- Login para você e para funcionários (contas criadas no painel do Supabase).

Compras extras (café, bebidas etc.) não entram neste controle — apenas o valor do agendamento/entrada, conforme combinado.

## 1. Criar o banco de dados (Supabase)

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e um novo projeto.
2. No painel do projeto, vá em **SQL Editor** → **New query**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
3. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - **anon public key**

## 2. Configurar o projeto

```bash
cp .env.example .env
```

Edite `.env` e cole a URL e a chave copiadas:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

Instale as dependências e rode localmente:

```bash
npm install
npm run dev
```

## 3. Criar seu usuário e o de funcionários

No painel do Supabase, vá em **Authentication → Users → Add user** e crie um usuário com e-mail e senha para você e para cada funcionário que vai acessar o sistema. Todos que tiverem login enxergam e podem editar todos os agendamentos.

## 4. Publicar online (opcional)

Para acessar de qualquer lugar (não só no seu computador), publique gratuitamente na [Vercel](https://vercel.com) ou [Netlify](https://netlify.com):

1. Suba este projeto para um repositório no GitHub.
2. Importe o repositório na Vercel/Netlify.
3. Configure as mesmas variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) no painel de deploy.
4. Publique — você recebe um link para acessar do celular também.

## Scripts

```bash
npm run dev      # ambiente de desenvolvimento
npm run build    # build de produção
npm run preview  # servir o build localmente
```
