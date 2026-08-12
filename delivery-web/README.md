# NovaRota Delivery

Site publico de pedidos online (delivery) para uma loja/restaurante: cardapio, carrinho, calculo de
frete por CEP (areas de entrega nomeadas) e pagamento na entrega. Os pedidos ficam disponiveis para o
**NovaRota PDV** (a app desktop na raiz deste repositorio) puxar automaticamente via sincronizacao.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL (hospedar em Vercel Postgres, Neon ou Supabase — qualquer Postgres serve)
- Consulta de endereco via [ViaCEP](https://viacep.com.br) (servico publico brasileiro gratuito, sem
  necessidade de chave de API) — o cliente digita o CEP, o sistema preenche rua/bairro/cidade e calcula
  a taxa de entrega pela area de CEP cadastrada pelo admin

## Areas de entrega

Em vez de geocodificar o endereco e calcular distancia (menos confiavel para enderecos brasileiros), a
taxa de entrega e definida por **faixas de CEP** cadastradas em `/admin/areas-entrega` — cada area tem
uma descricao, CEP inicial/final, taxa e tempo estimado proprios. E o mesmo modelo usado por sistemas
como Consumer/MenuDino.

## Rodando localmente

```bash
cp .env.example .env   # preencha DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET, PDV_SYNC_TOKEN
npm install
npm run db:push        # cria as tabelas no Postgres configurado
npm run dev
```

Acesse `http://localhost:3000` para a pagina de pedidos, e `http://localhost:3000/admin` para o painel
(cadastro de produtos e configuracao de frete).

## Deploy (Vercel)

1. Crie um banco Postgres (Vercel Postgres, [Neon](https://neon.tech) ou [Supabase](https://supabase.com)
   tem planos gratuitos suficientes para comecar).
2. Crie um projeto na Vercel apontando para a pasta `delivery-web/` deste repositorio (em
   Project Settings → Root Directory).
3. Configure as variaveis de ambiente do projeto na Vercel: `DATABASE_URL`, `ADMIN_PASSWORD`,
   `SESSION_SECRET`, `PDV_SYNC_TOKEN` (gere valores aleatorios para os dois ultimos, ex:
   `openssl rand -hex 24`).
4. Deploy. O script `vercel-build` ja roda `prisma db push` automaticamente a cada deploy, criando/
   atualizando as tabelas no Postgres configurado — nao precisa rodar nada manualmente.
5. Acesse `/admin`, entre com `ADMIN_PASSWORD`, cadastre o cardapio (ou aguarde a sincronizacao do PDV)
   e cadastre pelo menos uma area de entrega em `/admin/areas-entrega` — sem isso nenhum CEP consegue
   finalizar pedido.

## Como os pedidos chegam no PDV

O PDV desktop (pasta raiz do repo) faz *polling* periodico em `GET /api/pedidos/pendentes` (autenticado
com `PDV_SYNC_TOKEN` no header `Authorization: Bearer ...`), importa cada pedido novo como uma comanda do
tipo `delivery` (com endereco/telefone/observacoes anotados), e chama `POST /api/pedidos/:id/sincronizado`
para marcar como recebido. A partir dai, o fluxo e o mesmo de qualquer comanda: o operador confere os
itens, e ao entregar usa o botao "Cobrar" ja existente na tela Comandas para registrar o pagamento
(dinheiro/cartao na entrega) e emitir o cupom.

Configure a mesma URL (`https://seu-projeto.vercel.app`) e o mesmo `PDV_SYNC_TOKEN` em
**Configuracoes → Delivery** dentro do PDV desktop.

## Catalogo de produtos

O PDV desktop e a fonte da verdade do cardapio: em Produtos, cada item tem um checkbox "Delivery
Online" (aba Principal). A cada sincronizacao, o PDV envia (`POST /api/produtos/sync`) todos os
produtos marcados, e eles aparecem automaticamente no cardapio publico e em `/admin/produtos` com a
marcação **via PDV**. Produtos cadastrados manualmente aqui no painel (sem passar pelo PDV) continuam
funcionando normalmente — a sincronizacao so mexe nos que tem essa marcação.

## Seguranca

`npm audit` acusa varias vulnerabilidades conhecidas do Next.js cujo fix definitivo e a major 15/16 (que
muda a API de rotas dinamicas e `cookies()`/`headers()` para assincrona — exigiria adaptar
`src/app/api/**/[id]/route.ts` e `src/lib/auth.ts`). Optei por manter a 14.2.35 (ultimo patch da serie 14)
para nao introduzir uma migracao maior sem testar, mas isso deve ser reavaliado antes de expor o site
publicamente com dados reais de clientes.

## Limitacoes atuais / proximos passos

- Areas de entrega sao faixas de CEP simples (sem desenhar poligono num mapa, como o Consumer permite).
  Cobre a maioria dos casos, mas bairros que nao seguem uma faixa continua de CEP podem exigir varias
  areas cadastradas.
- Nao ha combos/modificadores de produto (ex: "escolha o sabor", com preco adicional por opcao) nem
  promocoes (preco riscado) — vistos em referencias como MenuDino, ficam como proximo passo.
- Pagamento é sempre na entrega (dinheiro ou cartão via maquininha). Pagamento online (Pix/cartão no site)
  exigiria integrar um gateway (Mercado Pago, Pagar.me, Stripe) — não implementado ainda.
- Painel admin usa uma senha única compartilhada, sem múltiplos usuários/permissões nem login de cliente
  (conta, histórico de pedidos, endereço salvo).
