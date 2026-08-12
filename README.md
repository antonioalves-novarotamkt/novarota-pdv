# NovaRota PDV

PDV desktop (Electron + React + TypeScript) para uso local em restaurantes/bares, inspirado no fluxo do
Consumer/MenuDino: cardapio, comandas por mesa, caixa, controle de estoque basico e emissao de cupom
**nao fiscal** (comprovante) e **fiscal (NFC-e)**.

Roda 100% local: banco de dados SQLite embutido, sem depender de internet para o dia a dia (a emissao de
NFC-e precisa de internet apenas no momento da venda, para falar com a SEFAZ via Focus NFe).

## Stack

- Electron 33 + React 18 + TypeScript
- `electron-vite` para build de main/preload/renderer
- SQLite local via `better-sqlite3` (arquivo fica em `userData`, ex:
  `%APPDATA%/novarota-pdv` no Windows)
- Impressao termica ESC/POS via `escpos` (USB ou rede/IP)
- Emissao de NFC-e via API da [Focus NFe](https://focusnfe.com.br)

## Rodando em desenvolvimento

Requisitos: Node.js 20+ e um par de build tools nativas para compilar o `better-sqlite3` (no Windows,
`npm install` cuida disso automaticamente via prebuilds na maioria dos casos).

```bash
npm install
npm run dev
```

Isso abre a janela do Electron com hot reload no renderer.

## Build / instalador

```bash
npm run build       # compila main/preload/renderer
npm run dist:win     # gera instalador .exe (NSIS) para Windows
npm run dist:linux   # gera AppImage
```

Os artefatos ficam em `release/`.

> Falta adicionar um icone proprio em `build/icon.png` (256x256 ou maior) antes de gerar a build final para
> o cliente — sem isso o electron-builder usa um icone generico do Electron.

## Estrutura

```
src/
  main/           processo principal do Electron
    db/           camada SQLite (schema + repositorios por dominio)
    ipc/          handlers de IPC (um arquivo por dominio) + orquestrador de venda
    printing/      impressao ESC/POS (cupom nao fiscal e resumo da NFC-e)
    fiscal/        cliente Focus NFe + montagem do payload da NFC-e
  preload/        bridge segura (contextBridge) entre renderer e main
  renderer/       app React (Caixa, Comandas, Produtos, Estoque, Vendas, Configuracoes)
  shared/         tipos TypeScript compartilhados entre main e renderer
```

## Fluxo de uma venda

1. Produtos sao adicionados ao carrinho (tela Caixa) ou a uma comanda aberta (tela Comandas/Mesas).
2. Ao "Cobrar", o operador escolhe forma(s) de pagamento e o tipo de documento: **cupom nao fiscal** ou
   **NFC-e**.
3. O processo principal grava a venda no SQLite, da baixa no estoque dos produtos que controlam estoque,
   e (se NFC-e) envia a emissao para a Focus NFe e aguarda a autorizacao da SEFAZ.
4. Se configurado, imprime o comprovante na impressora termica.

## Configuracao antes de usar com cliente real

Va em **Configuracoes** no app e preencha:

1. **Dados da loja** — nome, CNPJ, endereco (aparecem no cupom impresso).
2. **Impressora termica** — USB ou rede (IP:porta, padrao 9100 para a maioria das termicas ESC/POS).
3. **Fiscal (NFC-e)**:
   - Crie uma conta gratuita em https://focusnfe.com.br/cadastro/ e pegue o **token de homologacao** para
     testar sem valor fiscal.
   - So troque `ambiente` para `producao` (e use o token de producao) quando o cliente ja tiver cadastrado
     a empresa e o **certificado digital A1** no painel da Focus NFe, e o plano pago estiver ativo.
   - Preencha CNPJ, UF (SP), CSC e CSC ID — esses ultimos dois sao fornecidos pela SEFAZ-SP e cadastrados
     tambem no painel da Focus NFe.
4. **Mesas** — cadastre as mesas do salao para aparecerem na tela de Comandas.

## Pontos de atencao fiscal (ler antes de ir para producao)

- Os campos `CFOP`, `NCM`, `CSOSN`/`CST` usados na emissao (`src/main/fiscal/nfce.ts`) tem valores padrao
  genericos (CFOP `5102`, NCM `21069090`, CSOSN `102` como Simples Nacional sem credito). **Esses valores
  dependem do regime tributario do cliente e devem ser revisados com o contador dele** antes de emitir
  notas reais. Cada produto pode ter seu proprio NCM/CFOP na tela de Produtos.
- Sempre valide o fluxo completo em ambiente de **homologacao** primeiro (notas de teste, sem validade
  fiscal) antes de trocar para producao.
- O resumo impresso da NFC-e hoje mostra a chave de acesso em texto — a impressao do QR Code escaneavel
  (exigido no DANFE NFC-e oficial) ainda nao esta implementada e e um proximo passo recomendado
  (`src/main/printing/index.ts`).

## Roadmap sugerido (nao implementado ainda)

- QR Code no cupom fiscal impresso
- Cancelamento de NFC-e pela UI (o cliente `FocusNfeClient.cancelarNfce` ja existe, falta a tela)
- Fechamento de caixa (abertura/fechamento com sangria e suprimento)
- Relatorios de vendas por periodo/forma de pagamento
- Backup automatico do banco SQLite
