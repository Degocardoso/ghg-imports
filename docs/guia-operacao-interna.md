# Guia rápido de operação — GHD Imports

**Para:** equipe de vendas e atendimento · **Painel:** `https://www.ghdimports.com.br/admin`

> Resumo em 3 linhas: todo pedido do site chega **no WhatsApp da loja** e no **painel → Pedidos** com
> status *Aguardando contato*. Responda em até **15 minutos** no horário comercial. O estoque só é
> descontado quando você muda o pedido para **Confirmado**.

---

## 1. Rotina diária

| Quando | O que fazer |
| --- | --- |
| Abertura | Painel → conferir **Pedidos em aberto** e **Estoque crítico** |
| A cada 15 min | Responder novos pedidos no WhatsApp |
| Ao receber mercadoria | Produtos → abrir produto → atualizar estoque de cada variante → Salvar |
| Fechamento | Nenhum pedido em *Aguardando contato* com mais de 2 h; registrar rastreios nas notas |

## 2. Ciclo de um pedido

| Status | Significado | Quem muda | Efeito no estoque |
| --- | --- | --- | --- |
| Aguardando contato | Cliente enviou o pedido pelo site | Automático | — |
| Em negociação | Conversa iniciada (frete, tamanho, pagamento) | Atendente | — |
| **Confirmado** | Cliente confirmou a compra | Atendente | **Estoque descontado** |
| Pago | Pagamento recebido e conferido | Atendente | — |
| Enviado | Postado — colocar código de rastreio nas notas | Atendente | — |
| Concluído | Cliente recebeu | Atendente | — |
| Cancelado | Desistência / sem resposta 48 h | Atendente | Estoque devolvido (se já tinha sido descontado) |

Se aparecer **"Estoque insuficiente"** ao confirmar: outra venda consumiu a peça. Ofereça outro tamanho
ou cor, ajuste o pedido com o cliente e cancele/recrie se necessário.

> Os preços do pedido ficam **congelados** — mesmo que o preço do produto mude depois, o pedido mantém
> o valor que o cliente viu. Descontos extras combinados no chat devem ir nas **Notas internas**.

## 3. Atendimento no WhatsApp

**1º contato (até 15 min)**
> Olá, {nome}! 👑 Aqui é a {seu nome}, da GHD Imports. Recebemos o seu pedido **{código}**. Já estou
> conferindo o estoque e calculando o frete para {cidade/UF}. Te retorno em instantes!

**Proposta**
> Tudo certo com o seu pedido {código}! ✅
> Produtos: R$ {total} · Frete ({modalidade}, {prazo}): R$ {frete}
> **Total: R$ {total+frete}**
> Pagamento via {Pix/cartão/boleto}. Posso enviar os dados para pagamento?

**Pagamento confirmado**
> Pagamento recebido, {nome}! 🙌 O seu pedido {código} será postado até {data}. Envio o rastreio assim que sair.

**Envio**
> Seu pedido {código} foi enviado! 📦 Rastreio: {código de rastreio}. Qualquer dúvida, é só chamar.

**Sem resposta (24 h depois)**
> Oi, {nome}! Passando para saber se ainda tem interesse no pedido {código}. Seguro a peça para você até amanhã às 18h. 😉

**Boas práticas**
- Use sempre o **código do pedido** (GHD-xxxx) — é como encontramos tudo no painel (Pedidos → pesquisar).
- No painel, o botão **Falar com o cliente** abre a conversa já com uma mensagem pronta.
- Nunca peça senhas ou dados de cartão por mensagem. Links de pagamento só da plataforma oficial.
- Pedidos de troca: seguir a política publicada em `/politicas/trocas` (7 dias após recebimento).
- Clientes que marcaram **"Aceita marketing: Sim"** podem receber novidades; os demais, não (LGPD).

## 4. Gestão de produtos

1. **Produtos → Novo produto**.
2. Preencha nome (o URL é gerado sozinho), marca, categoria e descrição.
3. **Imagens**: arraste várias de uma vez; a primeira (com ⭐ *Capa*) aparece no catálogo, a segunda no hover.
4. **Preço**: "Preço de venda" e, se houver promoção, "Preço original 'de'" — o desconto % é calculado sozinho.
5. **Variantes e estoque**: escolha o tipo (Vestuário PP–XGG, Calçado, Perfume ml ou Único) →
   *Preencher padrão* → informe o estoque de cada um. Perfumes: use **Preço próprio** por volume.
6. **Publicação**: "Visível na loja" (ocultar temporariamente sem apagar) e "Destaque na página inicial".
7. **Etiqueta**: Lançamento, Oferta ou Destaque.

- **Ocultar** (ícone de olho na lista): some da loja, continua no painel.
- **Excluir** (lixeira): remove da loja e do painel, mas mantém o histórico dos pedidos antigos.

## 5. Vitrine

- **Banners**: Admin → Banners → imagem desktop 1920×800 (texto do lado esquerdo) e mobile 800×1000.
  Use datas de início/fim para campanhas — o banner entra e sai sozinho.
- **Categorias**: crie subcategorias escolhendo a "Categoria-mãe". Novas categorias aparecem no menu.
- **Configurações**: número de WhatsApp (formato 55 + DDD + número — use **Testar**), barra de anúncio
  do topo, redes sociais, endereço e políticas. Alterações aparecem na loja imediatamente.

## 6. Problemas comuns

| Sintoma | Solução |
| --- | --- |
| Cliente diz que o WhatsApp não abriu | Peça o código GHD-xxxx e encontre o pedido no painel — ele já está registrado |
| "Muitos pedidos em pouco tempo" | Proteção anti-spam (5 pedidos/10 min). Aguarde ou finalize manualmente pelo chat |
| Produto não aparece na loja | Verifique "Visível na loja", categoria ativa e estoque > 0 em pelo menos uma variante |
| Upload de imagem falha | Use JPG/PNG/WebP até 5 MB; se persistir, saia e entre de novo no painel |
| Esqueci a senha | Peça ao responsável técnico para redefinir em Supabase → Authentication → Users |

**Novo membro da equipe**: o responsável técnico cria o usuário em Supabase → Authentication e o
adiciona à tabela `admin_users` (ver README, secção 2).
