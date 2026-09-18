const STORAGE_KEY = 'calculadora-marmita:estado'

const state = {
  ingredientes: [],
  custoEmbalagem: 0,
  custoFixo: 0,
  custoVariavel: 0,
  rendimento: 1,
  margem: 50
}

const el = {
  nome: document.getElementById('ing-nome'),
  quantidade: document.getElementById('ing-quantidade'),
  unidade: document.getElementById('ing-unidade'),
  preco: document.getElementById('ing-preco'),
  btnAdd: document.getElementById('btn-add-ingrediente'),
  lista: document.getElementById('lista-ingredientes'),
  emptyHint: document.getElementById('empty-hint'),
  custoTotalIngredientes: document.getElementById('custo-total-ingredientes'),
  custoEmbalagem: document.getElementById('custo-embalagem'),
  custoFixo: document.getElementById('custo-fixo'),
  custoVariavel: document.getElementById('custo-variavel'),
  rendimento: document.getElementById('rendimento'),
  margem: document.getElementById('margem'),
  margemLabel: document.getElementById('margem-label'),
  resCustoMarmita: document.getElementById('res-custo-marmita'),
  resPrecoVenda: document.getElementById('res-preco-venda'),
  resLucro: document.getElementById('res-lucro'),
  diagnostico: document.getElementById('diagnostico'),
  btnLimpar: document.getElementById('btn-limpar'),
  btnToggleAjudaPreco: document.getElementById('btn-toggle-ajuda-preco'),
  ajudaPreco: document.getElementById('ajuda-preco'),
  ajudaValorPago: document.getElementById('ajuda-valor-pago'),
  ajudaQuantidade: document.getElementById('ajuda-quantidade'),
  ajudaUnidade: document.getElementById('ajuda-unidade'),
  ajudaPrecoValor: document.getElementById('ajuda-preco-valor'),
  ajudaPrecoReferencia: document.getElementById('ajuda-preco-referencia'),
  btnUsarPreco: document.getElementById('btn-usar-preco'),
  btnToggleAjudaFixo: document.getElementById('btn-toggle-ajuda-fixo'),
  ajudaFixo: document.getElementById('ajuda-fixo'),
  ajudaAluguel: document.getElementById('ajuda-aluguel'),
  ajudaLuz: document.getElementById('ajuda-luz'),
  ajudaAgua: document.getElementById('ajuda-agua'),
  ajudaGas: document.getElementById('ajuda-gas'),
  ajudaOutrosFixos: document.getElementById('ajuda-outros-fixos'),
  ajudaVendasMes: document.getElementById('ajuda-vendas-mes'),
  ajudaFixoValor: document.getElementById('ajuda-fixo-valor'),
  btnUsarFixo: document.getElementById('btn-usar-fixo'),
  btnAbrirLead: document.getElementById('btn-abrir-lead'),
  formLead: document.getElementById('form-lead'),
  leadNome: document.getElementById('lead-nome'),
  leadTelefone: document.getElementById('lead-telefone'),
  leadEmail: document.getElementById('lead-email'),
  leadWebsite: document.getElementById('lead-website'),
  btnEnviarLead: document.getElementById('btn-enviar-lead'),
  leadStatus: document.getElementById('lead-status')
}

const EMPRESA = {
  nome: 'NovaRota Marketing',
  telefone: '(11) 94969-4607',
  email: 'antonio.alves@novarotamkt.com.br'
}

const LEAD_ENDPOINT = 'capturar-lead.php'

// Cada unidade tem uma "unidade de referência" (o que o preço informado representa)
// e um fator de conversão da quantidade usada para essa referência.
const UNIDADES = {
  g: { referencia: 'kg', fator: 1 / 1000 },
  kg: { referencia: 'kg', fator: 1 },
  ml: { referencia: 'l', fator: 1 / 1000 },
  l: { referencia: 'l', fator: 1 },
  un: { referencia: 'un', fator: 1 }
}

// Unidades compatíveis (mesmo grupo) para a calculadora de "preço a partir da embalagem"
const GRUPOS_UNIDADE = {
  kg: ['g', 'kg'],
  l: ['ml', 'l'],
  un: ['un']
}

function formatarMoeda(valor) {
  const arredondado = Math.round((valor + Number.EPSILON) * 100) / 100
  return arredondado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarPercentual(valor) {
  return `${valor.toFixed(1)}%`
}

function custoIngrediente(ingrediente) {
  const config = UNIDADES[ingrediente.unidade] || UNIDADES.un
  return ingrediente.quantidade * config.fator * ingrediente.preco
}

function labelPreco(unidade) {
  const config = UNIDADES[unidade] || UNIDADES.un
  if (config.referencia === 'kg') return 'Preço por kg'
  if (config.referencia === 'l') return 'Preço por litro'
  return 'Preço por unidade'
}

function unidadeReferenciaLabel(unidade) {
  const config = UNIDADES[unidade] || UNIDADES.un
  return config.referencia
}

function atualizarPlaceholderPreco() {
  el.preco.placeholder = labelPreco(el.unidade.value)
}

function referenciaAtual() {
  return (UNIDADES[el.unidade.value] || UNIDADES.un).referencia
}

function atualizarOpcoesAjudaUnidade() {
  const opcoes = GRUPOS_UNIDADE[referenciaAtual()] || ['un']
  el.ajudaUnidade.innerHTML = opcoes.map((u) => `<option value="${u}">${u}</option>`).join('')
}

function calcularPrecoAjuda() {
  const valorPago = Number(el.ajudaValorPago.value)
  const quantidade = Number(el.ajudaQuantidade.value)
  const config = UNIDADES[el.ajudaUnidade.value] || UNIDADES.un
  const quantidadeEmReferencia = quantidade * config.fator
  return quantidadeEmReferencia > 0 ? valorPago / quantidadeEmReferencia : 0
}

function atualizarResultadoAjudaPreco() {
  const precoCalculado = calcularPrecoAjuda()
  const referencia = (UNIDADES[el.ajudaUnidade.value] || UNIDADES.un).referencia
  el.ajudaPrecoValor.textContent = formatarMoeda(precoCalculado)
  el.ajudaPrecoReferencia.textContent = `/${referencia}`
}

function alternarAjudaPreco() {
  const abrir = el.ajudaPreco.hidden
  el.ajudaPreco.hidden = !abrir
  if (abrir) {
    atualizarOpcoesAjudaUnidade()
    atualizarResultadoAjudaPreco()
    el.ajudaValorPago.focus()
  }
}

function usarPrecoCalculado() {
  const precoCalculado = calcularPrecoAjuda()
  if (precoCalculado <= 0) return
  el.preco.value = precoCalculado.toFixed(2)
  el.ajudaPreco.hidden = true
  el.ajudaValorPago.value = ''
  el.ajudaQuantidade.value = ''
  el.nome.focus()
}

function calcularCustoFixoAjuda() {
  const totalMensal = [el.ajudaAluguel, el.ajudaLuz, el.ajudaAgua, el.ajudaGas, el.ajudaOutrosFixos].reduce(
    (soma, input) => soma + (Number(input.value) || 0),
    0
  )
  const vendasMes = Number(el.ajudaVendasMes.value)
  return vendasMes > 0 ? totalMensal / vendasMes : 0
}

function atualizarResultadoAjudaFixo() {
  el.ajudaFixoValor.textContent = formatarMoeda(calcularCustoFixoAjuda())
}

function alternarAjudaFixo() {
  const abrir = el.ajudaFixo.hidden
  el.ajudaFixo.hidden = !abrir
  if (abrir) {
    atualizarResultadoAjudaFixo()
    el.ajudaAluguel.focus()
  }
}

function usarCustoFixoCalculado() {
  const valorCalculado = calcularCustoFixoAjuda()
  if (valorCalculado <= 0) return
  state.custoFixo = Math.round((valorCalculado + Number.EPSILON) * 100) / 100
  el.custoFixo.value = state.custoFixo
  salvar()
  renderizar()
  el.ajudaFixo.hidden = true
}

function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (salvo) Object.assign(state, salvo)
  } catch {
    // ignora estado invalido salvo anteriormente
  }
}

function adicionarIngrediente() {
  const nome = el.nome.value.trim()
  const quantidade = Number(el.quantidade.value)
  const preco = Number(el.preco.value)
  const unidade = el.unidade.value

  if (!nome || !quantidade || quantidade <= 0 || preco < 0) return

  state.ingredientes.push({ nome, quantidade, unidade, preco })
  el.nome.value = ''
  el.quantidade.value = ''
  el.preco.value = ''
  el.nome.focus()

  salvar()
  renderizar()
}

function removerIngrediente(index) {
  state.ingredientes.splice(index, 1)
  salvar()
  renderizar()
}

function limparTudo() {
  state.ingredientes = []
  state.custoEmbalagem = 0
  state.custoFixo = 0
  state.custoVariavel = 0
  state.rendimento = 1
  state.margem = 50
  localStorage.removeItem(STORAGE_KEY)
  sincronizarCamposComEstado()
  renderizar()
}

function sincronizarCamposComEstado() {
  el.custoEmbalagem.value = state.custoEmbalagem
  el.custoFixo.value = state.custoFixo
  el.custoVariavel.value = state.custoVariavel
  el.rendimento.value = state.rendimento
  el.margem.value = state.margem
  el.margemLabel.textContent = state.margem
}

function calcularResumo() {
  const custoIngredientes = state.ingredientes.reduce((soma, ing) => soma + custoIngrediente(ing), 0)

  const rendimento = Math.max(1, state.rendimento || 1)
  const custoIngredientesPorMarmita = custoIngredientes / rendimento
  const custoEmbalagem = Number(state.custoEmbalagem || 0)
  const custoFixo = Number(state.custoFixo || 0)
  const custoVariavel = Number(state.custoVariavel || 0)

  const custoIngredientesEEmbalagem = custoIngredientesPorMarmita + custoEmbalagem
  const custoPorMarmita = custoIngredientesEEmbalagem + custoFixo + custoVariavel

  const margem = Math.max(0, state.margem || 0)
  const precoVenda = custoPorMarmita * (1 + margem / 100)
  const lucro = precoVenda - custoPorMarmita

  const diagnosticoItens = [
    { titulo: 'Ingredientes + embalagens', valor: custoIngredientesEEmbalagem, faixaMin: 28, faixaMax: 35 },
    { titulo: 'Custos fixos', valor: custoFixo, faixaMin: 0, faixaMax: 15 },
    { titulo: 'Custos variáveis', valor: custoVariavel, faixaMin: 0, faixaMax: 15 }
  ].map((item) => {
    const percentual = precoVenda > 0 ? (item.valor / precoVenda) * 100 : 0
    return { ...item, percentual, dentroDaFaixa: percentual >= item.faixaMin && percentual <= item.faixaMax }
  })

  return {
    custoIngredientes,
    custoEmbalagem,
    custoFixo,
    custoVariavel,
    custoPorMarmita,
    margem,
    precoVenda,
    lucro,
    diagnosticoItens
  }
}

function renderizarDiagnostico(diagnosticoItens) {
  el.diagnostico.innerHTML = ''

  diagnosticoItens.forEach((item) => {
    const div = document.createElement('div')
    div.className = `diagnostico-item ${item.dentroDaFaixa ? 'ok' : 'alerta'}`
    div.innerHTML = `
      <div>
        <div>${item.titulo}</div>
        <div class="info">Recomendado: até ${item.faixaMax}% do preço de venda${
      item.faixaMin > 0 ? ` (ideal entre ${item.faixaMin}% e ${item.faixaMax}%)` : ''
    }</div>
      </div>
      <span class="percentual">${formatarPercentual(item.percentual)}</span>
    `
    el.diagnostico.appendChild(div)
  })
}

function renderizar() {
  el.lista.innerHTML = ''
  el.emptyHint.style.display = state.ingredientes.length === 0 ? 'block' : 'none'

  state.ingredientes.forEach((ingrediente, index) => {
    const custo = custoIngrediente(ingrediente)

    const li = document.createElement('li')
    li.className = 'ingredient-row'
    li.innerHTML = `
      <div class="info">
        <p>${ingrediente.nome}</p>
        <span>${ingrediente.quantidade} ${ingrediente.unidade} · ${formatarMoeda(ingrediente.preco)}/${unidadeReferenciaLabel(
      ingrediente.unidade
    )}</span>
      </div>
      <div class="valores">
        <span class="custo">${formatarMoeda(custo)}</span>
        <button class="btn-remover" data-index="${index}" aria-label="Remover ${ingrediente.nome}">×</button>
      </div>
    `
    el.lista.appendChild(li)
  })

  el.lista.querySelectorAll('button.btn-remover').forEach((btn) => {
    btn.addEventListener('click', () => removerIngrediente(Number(btn.dataset.index)))
  })

  const resumo = calcularResumo()

  el.custoTotalIngredientes.textContent = formatarMoeda(resumo.custoIngredientes)
  el.resCustoMarmita.textContent = formatarMoeda(resumo.custoPorMarmita)
  el.resPrecoVenda.textContent = formatarMoeda(resumo.precoVenda)
  el.resLucro.textContent = formatarMoeda(resumo.lucro)

  renderizarDiagnostico(resumo.diagnosticoItens)
}

function gerarPdfAnalise(lead, resumo) {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  const margemEsquerda = 15
  let y = 20

  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(237, 102, 14)
  doc.text('novarota', margemEsquerda, y)
  const larguraNovarota = doc.getTextWidth('novarota')

  doc.setFont('times', 'italic')
  doc.setFontSize(13)
  doc.setTextColor(21, 52, 86)
  doc.text(' marketing.', margemEsquerda + larguraNovarota, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  y += 6
  doc.text(`${EMPRESA.telefone} · ${EMPRESA.email}`, margemEsquerda, y)

  y += 4
  doc.setDrawColor(226, 232, 240)
  doc.line(margemEsquerda, y, 195, y)

  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text('Análise de custo de marmita', margemEsquerda, y)

  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Preparado para: ${lead.nome}`, margemEsquerda, y)
  y += 5
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margemEsquerda, y)

  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Ingredientes', margemEsquerda, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  if (state.ingredientes.length === 0) {
    doc.text('Nenhum ingrediente informado.', margemEsquerda, y)
    y += 5
  } else {
    state.ingredientes.forEach((ingrediente) => {
      const custo = custoIngrediente(ingrediente)
      doc.text(
        `${ingrediente.nome} — ${ingrediente.quantidade}${ingrediente.unidade} (${formatarMoeda(
          ingrediente.preco
        )}/${unidadeReferenciaLabel(ingrediente.unidade)})`,
        margemEsquerda,
        y
      )
      doc.text(formatarMoeda(custo), 195, y, { align: 'right' })
      y += 5.5
    })
  }

  y += 4
  doc.setDrawColor(226, 232, 240)
  doc.line(margemEsquerda, y, 195, y)
  y += 9

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Custos', margemEsquerda, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)

  const linhasCusto = [
    ['Ingredientes (total)', formatarMoeda(resumo.custoIngredientes)],
    ['Embalagem por marmita', formatarMoeda(resumo.custoEmbalagem)],
    ['Custos fixos por marmita', formatarMoeda(resumo.custoFixo)],
    ['Custos variáveis por marmita', formatarMoeda(resumo.custoVariavel)]
  ]
  linhasCusto.forEach(([label, valor]) => {
    doc.text(label, margemEsquerda, y)
    doc.text(valor, 195, y, { align: 'right' })
    y += 5.5
  })

  y += 6
  doc.setFillColor(238, 247, 255)
  doc.roundedRect(margemEsquerda, y - 5, 180, 26, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(26, 79, 173)
  doc.text(`Custo por marmita: ${formatarMoeda(resumo.custoPorMarmita)}`, margemEsquerda + 4, y + 2)
  doc.text(`Preço de venda sugerido (margem ${resumo.margem}%): ${formatarMoeda(resumo.precoVenda)}`, margemEsquerda + 4, y + 9)
  const corLucro = resumo.lucro >= 0 ? [21, 128, 61] : [220, 38, 38]
  doc.setTextColor(...corLucro)
  doc.text(
    `${resumo.lucro >= 0 ? 'Lucro' : 'Prejuízo'} por marmita: ${formatarMoeda(Math.abs(resumo.lucro))}`,
    margemEsquerda + 4,
    y + 16
  )

  y += 30
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Diagnóstico da estrutura de custos', margemEsquerda, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  resumo.diagnosticoItens.forEach((item) => {
    const cor = item.dentroDaFaixa ? [21, 128, 61] : [180, 83, 9]
    doc.setTextColor(...cor)
    doc.text(
      `${item.dentroDaFaixa ? 'OK' : 'Atenção'} — ${item.titulo}: ${item.percentual.toFixed(1)}% do preço de venda`,
      margemEsquerda,
      y
    )
    y += 5.5
  })

  doc.setTextColor(100, 116, 139)
  doc.setFontSize(8.5)
  doc.text(
    `Quer ajuda para deixar seu negócio mais lucrativo? Fale com a ${EMPRESA.nome}: ${EMPRESA.telefone} · ${EMPRESA.email}`,
    margemEsquerda,
    285
  )

  doc.save(`analise-marmita-${lead.nome.trim().replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

async function enviarLead(lead, resumo) {
  const resposta = await fetch(LEAD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      custoPorMarmita: resumo.custoPorMarmita,
      precoVenda: resumo.precoVenda,
      lucro: resumo.lucro
    })
  })
  if (!resposta.ok) throw new Error('Falha ao registrar contato')
}

function mostrarStatusLead(texto, tipo) {
  el.leadStatus.hidden = false
  el.leadStatus.textContent = texto
  el.leadStatus.className = `lead-status ${tipo}`
}

async function processarEnvioLead(evento) {
  evento.preventDefault()

  if (el.leadWebsite.value.trim() !== '') return // honeypot: provável bot, ignora silenciosamente

  const lead = {
    nome: el.leadNome.value.trim(),
    telefone: el.leadTelefone.value.trim(),
    email: el.leadEmail.value.trim()
  }
  if (!lead.nome || !lead.telefone || !lead.email) return

  el.btnEnviarLead.disabled = true
  mostrarStatusLead('Gerando seu PDF...', 'carregando')

  const resumo = calcularResumo()

  try {
    gerarPdfAnalise(lead, resumo)
  } catch {
    mostrarStatusLead('Não foi possível gerar o PDF agora. Tente novamente em instantes.', 'erro')
    el.btnEnviarLead.disabled = false
    return
  }

  try {
    await enviarLead(lead, resumo)
    mostrarStatusLead('PDF baixado! Recebemos seus dados e em breve entraremos em contato.', 'sucesso')
  } catch {
    mostrarStatusLead('PDF baixado! Não conseguimos registrar seu contato agora — tente novamente mais tarde.', 'erro')
  } finally {
    el.btnEnviarLead.disabled = false
  }
}

el.btnAbrirLead.addEventListener('click', () => {
  el.btnAbrirLead.hidden = true
  el.formLead.hidden = false
  el.leadNome.focus()
})
el.formLead.addEventListener('submit', processarEnvioLead)

el.btnAdd.addEventListener('click', adicionarIngrediente)
;[el.nome, el.quantidade, el.preco].forEach((input) => {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') adicionarIngrediente()
  })
})
el.unidade.addEventListener('change', () => {
  atualizarPlaceholderPreco()
  atualizarOpcoesAjudaUnidade()
  atualizarResultadoAjudaPreco()
})

el.btnToggleAjudaPreco.addEventListener('click', alternarAjudaPreco)
el.btnUsarPreco.addEventListener('click', usarPrecoCalculado)
;[el.ajudaValorPago, el.ajudaQuantidade].forEach((input) => {
  input.addEventListener('input', atualizarResultadoAjudaPreco)
})
el.ajudaUnidade.addEventListener('change', atualizarResultadoAjudaPreco)

el.btnToggleAjudaFixo.addEventListener('click', alternarAjudaFixo)
el.btnUsarFixo.addEventListener('click', usarCustoFixoCalculado)
;[el.ajudaAluguel, el.ajudaLuz, el.ajudaAgua, el.ajudaGas, el.ajudaOutrosFixos, el.ajudaVendasMes].forEach(
  (input) => {
    input.addEventListener('input', atualizarResultadoAjudaFixo)
  }
)

el.custoEmbalagem.addEventListener('input', () => {
  state.custoEmbalagem = Number(el.custoEmbalagem.value) || 0
  salvar()
  renderizar()
})
el.custoFixo.addEventListener('input', () => {
  state.custoFixo = Number(el.custoFixo.value) || 0
  salvar()
  renderizar()
})
el.custoVariavel.addEventListener('input', () => {
  state.custoVariavel = Number(el.custoVariavel.value) || 0
  salvar()
  renderizar()
})
el.rendimento.addEventListener('input', () => {
  state.rendimento = Number(el.rendimento.value) || 1
  salvar()
  renderizar()
})
el.margem.addEventListener('input', () => {
  state.margem = Number(el.margem.value) || 0
  el.margemLabel.textContent = state.margem
  salvar()
  renderizar()
})

el.btnLimpar.addEventListener('click', () => {
  if (confirm('Limpar todos os ingredientes e valores?')) limparTudo()
})

carregar()
sincronizarCamposComEstado()
atualizarPlaceholderPreco()
atualizarOpcoesAjudaUnidade()
renderizar()
