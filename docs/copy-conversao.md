# Copy de conversão — Hero, etiquetas e CTAs

Princípios usados (análise de anúncios de e-commerce de moda/desporto premium):
**benefício antes do produto · prova/garantia perto do CTA · urgência honesta (estoque real) · um CTA principal por ecrã**.

## 1. Hero banner (já incluídos como padrão em `HeroCarousel.tsx`)

| Etiqueta | Título | Subtítulo | CTA |
| --- | --- | --- | --- |
| Coleção 2026 | **Vista o manto. Viva a glória.** | Camisas de clubes e seleções com acabamento premium — do Brasil para o mundo. | Ver camisas |
| Perfumaria importada | **Presença que fica no ar.** | Fragrâncias masculinas, femininas e unissex. Escolha o volume ideal e receba em casa. | Descobrir perfumes |
| Atendimento VIP | **Seu estilo, nível realeza.** | Tênis, streetwear e acessórios selecionados a dedo. Finalize em 1 minuto pelo WhatsApp. | Explorar novidades |

**Variações para campanhas** (criar em *Admin → Banners*, com datas de início/fim):

- *Lançamento*: "Chegou. Antes de todo mundo." · "A nova camisa da Seleção já está aqui — estoque limitado." · CTA **Garantir a minha**
- *Copa / jogos*: "Dia de jogo pede manto novo." · "Peça até quinta e receba antes da partida*." · CTA **Ver camisas da Seleção**
- *Oferta relâmpago*: "Até 30% OFF só este fim de semana." · "Preço de realeza, só até domingo às 23h59." · CTA **Ver ofertas**
- *Perfumes*: "Seu perfume favorito, sem pagar o preço da vitrine." · CTA **Escolher meu ml**
- *Black Friday*: "Black Crown Friday 👑" · "Os maiores descontos do ano, com atendimento VIP." · CTA **Entrar na lista VIP** (link WhatsApp)

\*Usar prazos só quando forem reais.

## 2. Etiquetas promocionais

| Etiqueta | Quando usar | Efeito |
| --- | --- | --- |
| **Lançamento** | Primeiros 30 dias do produto | Novidade/exclusividade |
| **Destaque** | Curadoria da casa, best-sellers de alta margem | Autoridade |
| **Oferta** | Promoções temporárias | Urgência |
| **-XX%** | Automática quando há preço "de" | Prova numérica do desconto |
| **Últimas N unidades!** | Automática com estoque ≤ 3 (página de produto) | Escassez real |

## 3. CTAs

| Local | Texto | Nota |
| --- | --- | --- |
| Página de produto (principal) | **Comprar agora** | Vai direto ao checkout |
| Página de produto (secundário) | Adicionar ao carrinho | Abre a gaveta do carrinho |
| Página de produto (apoio) | Tirar dúvidas no WhatsApp | Mensagem pré-preenchida com produto e tamanho |
| Carrinho | **Finalizar pedido** | + "Frete e prazo combinados no WhatsApp" para reduzir ansiedade |
| Checkout | **Enviar pedido pelo WhatsApp** | Verde (associação imediata ao app) + "Valores confirmados pelo servidor" |
| Bloco VIP da home | Falar com especialista | Encomendas sob medida |
| Catálogo vazio | Ver todo o catálogo | + oferta de ajuda no WhatsApp |

## 4. Microcopy de confiança (barra de garantias)

Qualidade premium · Enviamos para todo o Brasil · Pix, cartão ou boleto · Compra segura com atendimento humano.

## 5. Mensagem de pedido (WhatsApp)

Gerada em `src/lib/whatsapp.ts`: código do pedido, itens com variante, quantidades e preços congelados,
subtotal, descontos, total, dados de entrega, pagamento preferido, origem do cliente e observações —
termina com "Olá! Acabei de fazer este pedido no site e gostaria de finalizar a compra. 🙌".
