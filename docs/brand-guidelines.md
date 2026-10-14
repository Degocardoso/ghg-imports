# GHD Imports — Guia de Marca e Design System

> Derivado do logótipo oficial: coroa estilizada e lettering **GHD IMPORTS** em ouro metálico/champagne
> sobre preto escovado. Posicionamento: **luxo acessível · artigo desportivo premium · exclusividade**.

## 1. Logótipo

| Uso | Ficheiro / componente |
| --- | --- |
| Logótipo completo (quadrado, fundo escovado) | `public/brand/logo.jpg` · `<Logo />` |
| Wordmark digital | `<Logo showWordmark />` — "GHD" em gradiente ouro + "IMPORTS" espaçado |
| Favicon / Open Graph | `public/brand/logo.jpg` (substituível em *Configurações → Logotipo*) |

**Regras**
- Fundo sempre escuro (`ink` ou `surface`). Nunca aplicar o logótipo sobre branco ou fotografias claras.
- Área de respiro mínima: altura da coroa à volta do logótipo.
- Não recolorir, distorcer, nem aplicar sombras coloridas. O brilho dourado vem do próprio metal.
- Tamanho mínimo digital: 32 px (cabeçalho usa 40 px; rodapé 52 px; login 64 px).

## 2. Paleta (tokens Tailwind em `src/app/globals.css → @theme`)

| Token | Hex | Papel |
| --- | --- | --- |
| `ink` | `#0A0A0A` | Fundo principal (preto profundo) |
| `surface` | `#141414` | Cartões |
| `surface-2` | `#1C1C1C` | Cartões elevados, inputs |
| `line` | `#2A2A2A` | Bordas e divisores |
| `gold` | `#D4AF37` | Destaque nobre: CTAs, preços em foco, estados ativos |
| `gold-light` | `#F3E5AB` | Champagne: realces, hover, texto dourado sobre escuro |
| `gold-dark` | `#A8862A` | Sombra do metal, extremos do gradiente |
| `fg` | `#FFFFFF` | Títulos e leitura primária |
| `muted` | `#A1A1AA` | Texto secundário |
| `success` | `#22C55E` | Confirmação e **tudo o que é WhatsApp** |
| `danger` | `#EF4444` | Erros, cancelamentos |

**Gradientes de marca** (utilitários): `bg-gold-gradient` (champagne → ouro → ouro escuro, 135°) e
`text-gold-gradient` (texto metálico com `animate-shimmer` opcional). `bg-brushed` reproduz a textura
de preto escovado do logótipo.

**Proporção recomendada**: 80% pretos/cinzentos · 15% branco/muted · ≤5% ouro. O ouro é raro por design —
se tudo brilha, nada é premium. Verde aparece só em ações de WhatsApp e confirmações.

**Contraste (WCAG)**: `gold` sobre `ink` ≈ 9:1, `muted` sobre `ink` ≈ 7.6:1, `ink` sobre `gold` (botões) ≈ 9:1.

## 3. Tipografia

- **Plus Jakarta Sans** (variável 200–800), auto-alojada em `src/app/fonts/` (sem dependência do Google no build).
- Títulos: `font-extrabold`, `tracking-tight`, `text-balance`.
- *Eyebrows* (etiquetas acima de títulos): 10–11 px, `font-bold`, maiúsculas, `tracking-[0.2em–0.25em]`, cor `gold`.
- Corpo: 14–16 px, `text-zinc-300`/`muted`.
- Preços: `font-bold`, números tabulares em listas; preço "de" riscado em `muted`; percentagem em `success`.

## 4. Componentes base (`globals.css → @utility`)

| Classe | Uso |
| --- | --- |
| `btn-gold` | CTA principal (Comprar agora, Finalizar) — uma por ecrã |
| `btn-outline` | CTA secundário (Adicionar ao carrinho, Ver catálogo) |
| `btn-whatsapp` | Qualquer ação que abre o WhatsApp |
| `btn-ghost` · `btn-danger` | Ações terciárias / destrutivas |
| `card` | Superfície com borda `line` e raio `rounded-card` (16 px) |
| `input` · `label` | Formulários (foco dourado, erro via `aria-invalid`) |
| `container-store` | Largura máxima 1280 px com margens responsivas |

**Etiquetas de produto** (`<ProductBadge />`): *Lançamento* (gradiente ouro), *Destaque* (contorno ouro),
*Oferta* (vermelho), *-XX%* (verde, calculado automaticamente), *Esgotado* (cinza).

## 5. Movimento e imagem

- Framer Motion com durações curtas (0,3–0,6 s), molas suaves nas gavetas; `prefers-reduced-motion` respeitado.
- Fotografia de produto: fundo neutro escuro ou estúdio, proporção **4:5** nos cartões, 1:1 na galeria,
  mínimo 1200 px no lado maior, WebP/AVIF até 5 MB. Segunda imagem aparece no hover do cartão.
- Banners do hero: desktop 1920×800 (texto à esquerda — o gradiente escurece esse lado), mobile 800×1000.

## 6. Voz e tom

Confiante, próxima e exclusiva — "atendimento VIP", não "barato". Frases curtas, verbos de ação, tratamento
por **você** (pt-BR). Ver exemplos em [`copy-conversao.md`](copy-conversao.md).
