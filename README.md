# GHD Imports — E-commerce com checkout via WhatsApp

Loja virtual da **GHD Imports** (camisas de futebol, vestuário, tênis, perfumes e acessórios) com painel
administrativo em `/admin`. O pedido é registado na base de dados com preços congelados e enviado à
equipa pelo WhatsApp.

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide |
| Estado do carrinho | Zustand + `persist` (localStorage) |
| Backend | Supabase: PostgreSQL + RLS, Auth, Storage, Realtime |
| Validação | Zod 4 (cliente, Route Handlers e Server Actions) + constraints/funções no Postgres |
| Alojamento | Vercel |

---

## 1. Arranque rápido

```bash
npm install
cp .env.example .env.local   # preencher com as chaves do Supabase
npm run dev                  # http://localhost:3000
```

Scripts: `npm run build` · `npm run typecheck` · `npm run lint`.

## 2. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. **SQL Editor** → cole e execute `supabase/migrations/20261014000000_init.sql`
   (ou `supabase db push` com a CLI). A migração cria:
   - tabelas `categories`, `products`, `product_variants`, `banners`, `store_settings`, `orders`,
     `order_items`, `order_status_history`, `admin_users`;
   - vista `product_catalog` e funções `create_order`, `admin_save_product`, `search_products`,
     `admin_dashboard_stats`;
   - políticas **RLS**, buckets públicos `products` e `banners` e as categorias iniciais.
3. Crie o primeiro administrador:
   - **Authentication → Users → Add user** (e-mail + senha);
   - no SQL Editor:
     ```sql
     insert into public.admin_users (user_id)
     select id from auth.users where email = 'admin@ghdimports.com.br';
     ```
4. Recomendado: **Authentication → Providers → Email → desativar "Allow new users to sign up"**.
5. **Database → Replication**: confirme que `product_variants` está na publicação `supabase_realtime`
   (a migração tenta adicioná-la) — é isso que atualiza o estoque ao vivo na página de produto.

## 3. Implementar na Vercel

1. Importe o repositório na Vercel (framework detetado: Next.js).
2. Em **Settings → Environment Variables** (Production e Preview) defina:

   | Variável | Onde obter | Exposta ao browser? |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Sim |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API (anon/publishable) | Sim (protegida por RLS) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (service_role/secret) | **Nunca** |
   | `NEXT_PUBLIC_SITE_URL` | O seu domínio, ex. `https://www.ghdimports.com.br` | Sim |
   | `ORDER_IP_SALT` | `openssl rand -hex 32` (opcional) | Não |

3. Deploy. Depois, no painel `/admin/configuracoes`, defina o **número de WhatsApp** de vendas.
4. Domínio: ver [`docs/dominios.md`](docs/dominios.md).

---

## 4. Estrutura de pastas

```
├── supabase/migrations/20261014000000_init.sql   # esquema, RLS, funções, buckets
├── public/brand/logo.jpg                          # logótipo oficial
├── docs/                                          # marca, domínios, copy, operação interna
└── src/
    ├── proxy.ts                         # "Middleware" do Next 16: protege /admin
    ├── app/
    │   ├── layout.tsx · globals.css     # fonte local + design tokens (@theme)
    │   ├── (store)/                     # vitrine (layout com header, footer, carrinho)
    │   │   ├── page.tsx                 # home: hero, categorias, prateleiras
    │   │   ├── catalogo/                # filtros + ordenação + paginação
    │   │   ├── produto/[slug]/          # galeria, variantes, estoque em tempo real
    │   │   ├── checkout/ · pedido-enviado/
    │   │   └── politicas/[slug]/        # sobre, entrega, trocas, privacidade, termos
    │   ├── admin/
    │   │   ├── login/                   # login (Supabase Auth)
    │   │   ├── _actions/                # Server Actions (requireAdmin + Zod)
    │   │   └── (panel)/                 # painel, pedidos, produtos, categorias, banners, configurações
    │   ├── api/
    │   │   ├── checkout/route.ts        # cria pedido + mensagem/link WhatsApp
    │   │   ├── cart/validate/route.ts   # revalida preços/estoque do carrinho
    │   │   └── search/route.ts          # pesquisa instantânea
    │   └── robots.ts · sitemap.ts
    ├── components/{store,admin,ui}/
    ├── lib/
    │   ├── supabase/{client,server,public,admin,proxy,env}.ts
    │   ├── auth.ts · validation.ts · whatsapp.ts · format.ts · constants.ts
    │   ├── data/store.ts                # leituras da vitrine com fallback de erro
    │   └── admin/action.ts              # wrapper de Server Actions + mensagens de erro do Postgres
    ├── store/cart.ts                    # Zustand (persistência, totais, revalidação)
    └── types/index.ts
```

## 5. Clientes Supabase

| Ficheiro | Chave | Uso |
| --- | --- | --- |
| `lib/supabase/client.ts` | anon + sessão (cookies) | Browser: uploads do admin, Realtime |
| `lib/supabase/server.ts` | anon + sessão (cookies) | Server Components/Actions do painel (RLS como admin) |
| `lib/supabase/public.ts` | anon, sem cookies | Leituras da vitrine (permite ISR/cache) |
| `lib/supabase/admin.ts` | service_role (`server-only`) | **Apenas** `create_order` no checkout |
| `lib/supabase/proxy.ts` | anon + cookies | Renovação de sessão no `proxy.ts` |

## 6. Modelo de segurança

- **Defesa em profundidade no /admin**: `proxy.ts` (valida JWT com `getClaims` + `admin_users`) →
  `requireAdminPage`/`requireAdmin` em cada layout/página/Server Action (`getUser` no Auth) → **RLS**.
  Estar autenticado não basta: é preciso estar em `admin_users` (protege contra sign-ups abertos).
- **Preços nunca vêm do browser**: o checkout envia só `variant_id` + quantidade. `create_order`
  (transação, `FOR UPDATE` nas variantes) recalcula preços, valida disponibilidade e estoque, e congela
  os valores em `order_items`.
- **Preços congelados**: o papel `authenticated` só tem `UPDATE` nas colunas `status` e `admin_notes`
  de `orders`; `order_items` é só de leitura.
- **Estoque por estado**: abatido quando o pedido passa a *Confirmado/Pago/Enviado/Concluído*, reposto
  se voltar atrás ou for *Cancelado* (trigger). Pedidos abandonados no WhatsApp não bloqueiam estoque.
- **Rate limiting persistente** (funciona em serverless): máx. 5 pedidos/10 min por telefone ou IP
  (IP guardado apenas como hash com sal).
- RLS: público lê só produtos/variantes/categorias/banners **ativos**; pedidos e produtos ocultos só
  para admins. `store_settings` tem leitura pública porque todos os campos são informação pública
  (WhatsApp, redes, políticas); a escrita é só de admins.
- Storage: buckets públicos para entrega de imagens, sem política de listagem; escrita só para admins;
  limite de tamanho e tipos MIME por bucket.
- Cabeçalhos de segurança (HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`), `/admin` com
  `noindex`, redirecionamento pós-login restrito a `/admin/*` (sem open redirect), LGPD: consentimento
  obrigatório no checkout e CPF fora da mensagem de WhatsApp.

## 7. Fluxo do pedido

```
Carrinho (Zustand) ──► /checkout ──► POST /api/cart/validate (preços/estoque atuais)
        │
        └─► POST /api/checkout ──► Zod ──► create_order() [transação no Postgres]
                                              │  status = aguardando_contato
                                              ▼
                       mensagem formatada (valores do banco) + https://wa.me/<número>?text=…
                                              ▼
                      /pedido-enviado (abre WhatsApp no mobile; botão no desktop)
```

## 8. Documentação de apoio

- [`docs/brand-guidelines.md`](docs/brand-guidelines.md) — sistema visual e tokens
- [`docs/dominios.md`](docs/dominios.md) — opções de domínio e subdomínios
- [`docs/copy-conversao.md`](docs/copy-conversao.md) — hero, etiquetas e CTAs
- [`docs/guia-operacao-interna.md`](docs/guia-operacao-interna.md) — operação da loja e atendimento

## 9. Verificação realizada

- `npm run typecheck`, `npm run lint` e `npm run build` sem erros.
- Migração aplicada num PostgreSQL 16 local (com stubs de `auth`/`storage` ao estilo Supabase) e
  reaplicada para confirmar idempotência; RLS, `create_order`, trigger de estoque, privilégios por
  coluna, rate limiting e `admin_save_product` testados como `anon`, utilizador autenticado não-admin,
  admin e `service_role`.
- Vitrine e checkout testados ponta-a-ponta com PostgREST + Playwright (filtros, pesquisa sem acentos,
  seleção obrigatória de variante, carrinho, validação de formulário, criação do pedido, mensagem do
  WhatsApp, rejeição de preço injetado, 409 para estoque insuficiente, 429 para excesso de pedidos).
- **Não testado localmente**: login/painel `/admin` e upload de imagens (dependem do Supabase Auth e
  Storage reais) e o Realtime — validar no primeiro deploy.
