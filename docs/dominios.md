# Domínios e mapeamento de subdomínios

> ⚠️ A disponibilidade **não foi verificada** — confirme em [registro.br](https://registro.br) (`.com.br`)
> e num registrador internacional (`.com`) antes de decidir. Registe também as variações defensivas.

## 1. Opções recomendadas

| Prioridade | Domínio | Porquê |
| --- | --- | --- |
| ⭐ 1 | **ghdimports.com.br** | Nome exato da marca, TLD de confiança para o consumidor brasileiro, melhor para SEO local |
| 2 | ghdimports.com | Proteção da marca; redireciona para o `.com.br` |
| 3 | lojaghd.com.br | Curto e fácil de ditar em vídeos/Stories ("loja GHD ponto com ponto br") |
| 4 | ghdstore.com.br | Alternativa se `ghdimports` estiver ocupado |
| 5 | ghd.store / ghdimports.shop | TLDs de e-commerce, bons para campanhas e links curtos na bio |

**Evitar**: hífenes (`ghd-imports`), números, e qualquer combinação com nomes de marcas de terceiros
(Nike, Adidas, nomes de clubes) — risco de disputa de marca.

**Defensivos sugeridos**: `ghdimports.com`, `ghdimport.com.br` (erro comum de digitação) → redirecionamento 301.

## 2. Mapeamento

| Endereço | Destino | Configuração |
| --- | --- | --- |
| `www.ghdimports.com.br` | Loja (canónico) | Vercel → Domains (CNAME `cname.vercel-dns.com`) |
| `ghdimports.com.br` | 301 → `www` | Vercel → Domains (A `76.76.21.21`) com redirect |
| `www.ghdimports.com.br/admin` | Painel | **Recomendado**: mesmo deploy, mesmo domínio (cookies de sessão simples, zero configuração extra) |
| `admin.ghdimports.com.br` | Opcional: atalho para o painel | Adicionar o domínio na Vercel e redirecionar `/` → `https://www.ghdimports.com.br/admin` |
| `ghdimports.com` | 301 → `www.ghdimports.com.br` | Vercel → Domains |

Exemplo para o atalho do painel em `vercel.json` (opcional):

```json
{
  "redirects": [
    { "source": "/", "has": [{ "type": "host", "value": "admin.ghdimports.com.br" }],
      "destination": "https://www.ghdimports.com.br/admin", "permanent": false }
  ]
}
```

> Porque não separar o painel num subdomínio próprio? A sessão do Supabase vive em cookies do domínio
> que a criou; manter o painel em `/admin` evita partilhar cookies entre subdomínios. A segurança vem do
> proxy + `requireAdmin` + RLS, não de esconder o URL.

## 3. Depois de ligar o domínio

1. `NEXT_PUBLIC_SITE_URL=https://www.ghdimports.com.br` na Vercel e novo deploy (sitemap, Open Graph).
2. Supabase → Authentication → URL Configuration → *Site URL* = o mesmo domínio.
3. E-mail profissional (`contato@ghdimports.com.br`) e registo no Google Search Console com o `sitemap.xml`.
