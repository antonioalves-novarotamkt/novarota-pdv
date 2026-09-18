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
  btnUsarFixo: document.getElementById('btn-usar-fixo')
}

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

function renderizarDiagnostico(precoVenda, custoIngredientesEEmbalagem, custoFixo, custoVariavel) {
  el.diagnostico.innerHTML = ''

  const itens = [
    { titulo: 'Ingredientes + embalagens', valor: custoIngredientesEEmbalagem, faixaMin: 28, faixaMax: 35 },
    { titulo: 'Custos fixos', valor: custoFixo, faixaMin: 0, faixaMax: 15 },
    { titulo: 'Custos variáveis', valor: custoVariavel, faixaMin: 0, faixaMax: 15 }
  ]

  itens.forEach((item) => {
    const percentual = precoVenda > 0 ? (item.valor / precoVenda) * 100 : 0
    const dentroDaFaixa = percentual >= item.faixaMin && percentual <= item.faixaMax
    const div = document.createElement('div')
    div.className = `diagnostico-item ${dentroDaFaixa ? 'ok' : 'alerta'}`
    div.innerHTML = `
      <div>
        <div>${item.titulo}</div>
        <div class="info">Recomendado: até ${item.faixaMax}% do preço de venda${
      item.faixaMin > 0 ? ` (ideal entre ${item.faixaMin}% e ${item.faixaMax}%)` : ''
    }</div>
      </div>
      <span class="percentual">${formatarPercentual(percentual)}</span>
    `
    el.diagnostico.appendChild(div)
  })
}

function renderizar() {
  el.lista.innerHTML = ''
  el.emptyHint.style.display = state.ingredientes.length === 0 ? 'block' : 'none'

  let custoIngredientes = 0

  state.ingredientes.forEach((ingrediente, index) => {
    const custo = custoIngrediente(ingrediente)
    custoIngredientes += custo

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

  el.custoTotalIngredientes.textContent = formatarMoeda(custoIngredientes)

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

  el.resCustoMarmita.textContent = formatarMoeda(custoPorMarmita)
  el.resPrecoVenda.textContent = formatarMoeda(precoVenda)
  el.resLucro.textContent = formatarMoeda(lucro)

  renderizarDiagnostico(precoVenda, custoIngredientesEEmbalagem, custoFixo, custoVariavel)
}

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
