# Calculadora de Custo de Marmita

Projeto independente (HTML + CSS + JS), com um único endpoint PHP para captura de leads.

## Como usar

Abra `index.html` diretamente no navegador, ou sirva a pasta com qualquer servidor estático:

```bash
npx serve calculadora-marmita
```

A geração de PDF e o envio do formulário de contato só funcionam quando os arquivos são
servidos por HTTP (não abrindo o `index.html` direto do disco como `file://`), e o
`capturar-lead.php` só funciona num servidor com PHP (ex: `php -S localhost:8000`, ou a
própria hospedagem na Locaweb).

## Funcionalidades

- Cadastro dos ingredientes da receita (quantidade em g/kg ou ml/l, preço por kg/litro/unidade)
- Calculadora auxiliar para converter "preço da embalagem comprada" em preço por kg/litro
- Calculadora auxiliar para ratear custo fixo mensal (aluguel, luz, água, gás) por marmita
- Custo de embalagem, custos fixos e variáveis por marmita
- Margem de lucro desejada
- Cálculo automático de: custo por marmita, preço de venda sugerido e lucro (ou prejuízo) por marmita
- Painel de diagnóstico comparando cada custo com as faixas recomendadas para marmitex
- Os dados ficam salvos no navegador (localStorage), então não somem ao recarregar a página
- **Captura de leads**: botão "Gerar meu PDF" pede nome/WhatsApp/e-mail, gera um PDF da
  análise na hora (via [jsPDF](https://github.com/parallax/jsPDF), carregado via CDN) e
  envia os dados de contato por e-mail para quem administra o site, através do
  `capturar-lead.php`

## Publicando na Locaweb (hospedagem HTML/PHP)

1. No Gerenciador de Arquivos (ou via FTP) da Locaweb, crie uma pasta, ex: `calculadora-marmita`,
   dentro da raiz do site (`public_html` ou `www`).
2. Envie os arquivos `index.html`, `style.css`, `script.js` **e** `capturar-lead.php` para essa pasta.
3. Acesse `https://seusite.com.br/calculadora-marmita/` para conferir.
4. Teste o formulário do PDF uma vez para confirmar que o e-mail chega — a Locaweb precisa ter
   a função `mail()` do PHP habilitada (já vem habilitada por padrão na maioria dos planos).

### Ajustando o destinatário dos leads

O e-mail que recebe os contatos está fixo no topo do `capturar-lead.php`:

```php
$destinatario = 'antonio.alves@novarotamkt.com.br';
```

### Dados da empresa no PDF

Nome, telefone e e-mail que aparecem no cabeçalho do PDF estão no topo do `script.js`,
na constante `EMPRESA`. O logotipo é recriado em texto (cores da marca), já que o PDF é
gerado no navegador do cliente sem depender de um arquivo de imagem.
