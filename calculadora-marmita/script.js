const STORAGE_KEY = 'calculadora-marmita:estado'

const state = {
  ingredientes: [],
  custoEmbalagem: 0,
  custoExtra: 0,
  rendimento: 1,
  margem: 30
}

const el = {
  nome: document.getElementById('ing-nome'),
  quantidade: document.getElementById('ing-quantidade'),
  unidade: document.getElementById('ing-unidade'),
  preco: document.getElementById('ing-preco'),
  btnAdd: document.getElementById('btn-add-ingrediente'),
  tbody: document.getElementById('tbody-ingredientes'),
  emptyHint: document.getElementById('empty-hint'),
  custoTotalIngredientes: document.getElementById('custo-total-ingredientes'),
  custoEmbalagem: document.getElementById('custo-embalagem'),
  custoExtra: document.getElementById('custo-extra'),
  rendimento: document.getElementById('rendimento'),
  margem: document.getElementById('margem'),
  resCustoReceita: document.getElementById('res-custo-receita'),
  resCustoMarmita: document.getElementById('res-custo-marmita'),
  resPrecoVenda: document.getElementById('res-preco-venda'),
  resLucro: document.getElementById('res-lucro'),
  btnLimpar: document.getElementById('btn-limpar')
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function custoIngrediente(ingrediente) {
  return ingrediente.quantidade * ingrediente.preco
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
  state.custoExtra = 0
  state.rendimento = 1
  state.margem = 30
  localStorage.removeItem(STORAGE_KEY)
  sincronizarCamposComEstado()
  renderizar()
}

function sincronizarCamposComEstado() {
  el.custoEmbalagem.value = state.custoEmbalagem
  el.custoExtra.value = state.custoExtra
  el.rendimento.value = state.rendimento
  el.margem.value = state.margem
}

function renderizar() {
  el.tbody.innerHTML = ''
  el.emptyHint.style.display = state.ingredientes.length === 0 ? 'block' : 'none'

  let custoIngredientes = 0

  state.ingredientes.forEach((ingrediente, index) => {
    const custo = custoIngrediente(ingrediente)
    custoIngredientes += custo

    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${ingrediente.nome}</td>
      <td>${ingrediente.quantidade} ${ingrediente.unidade}</td>
      <td>${formatarMoeda(ingrediente.preco)}</td>
      <td>${formatarMoeda(custo)}</td>
      <td><button class="remover" data-index="${index}">remover</button></td>
    `
    el.tbody.appendChild(tr)
  })

  el.tbody.querySelectorAll('button.remover').forEach((btn) => {
    btn.addEventListener('click', () => removerIngrediente(Number(btn.dataset.index)))
  })

  el.custoTotalIngredientes.textContent = formatarMoeda(custoIngredientes)

  const rendimento = Math.max(1, state.rendimento || 1)
  const custoTotalReceita = custoIngredientes + state.custoExtra * rendimento
  const custoPorMarmita = custoTotalReceita / rendimento + Number(state.custoEmbalagem || 0)
  const margem = Math.max(0, state.margem || 0)
  const precoVenda = custoPorMarmita * (1 + margem / 100)
  const lucro = precoVenda - custoPorMarmita

  el.resCustoReceita.textContent = formatarMoeda(custoTotalReceita)
  el.resCustoMarmita.textContent = formatarMoeda(custoPorMarmita)
  el.resPrecoVenda.textContent = formatarMoeda(precoVenda)
  el.resLucro.textContent = formatarMoeda(lucro)
}

el.btnAdd.addEventListener('click', adicionarIngrediente)
el.nome.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') adicionarIngrediente()
})
el.quantidade.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') adicionarIngrediente()
})
el.preco.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') adicionarIngrediente()
})

el.custoEmbalagem.addEventListener('input', () => {
  state.custoEmbalagem = Number(el.custoEmbalagem.value) || 0
  salvar()
  renderizar()
})
el.custoExtra.addEventListener('input', () => {
  state.custoExtra = Number(el.custoExtra.value) || 0
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
  salvar()
  renderizar()
})

el.btnLimpar.addEventListener('click', () => {
  if (confirm('Limpar todos os ingredientes e valores?')) limparTudo()
})

carregar()
sincronizarCamposComEstado()
renderizar()
