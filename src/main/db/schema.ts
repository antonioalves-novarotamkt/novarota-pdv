export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  preco REAL NOT NULL DEFAULT 0,
  ncm TEXT,
  cfop TEXT,
  unidade TEXT NOT NULL DEFAULT 'UN',
  controla_estoque INTEGER NOT NULL DEFAULT 0,
  quantidade_estoque REAL NOT NULL DEFAULT 0,
  estoque_minimo REAL NOT NULL DEFAULT 0,
  item_cozinha INTEGER NOT NULL DEFAULT 0,
  cozinha TEXT,
  disponivel_pdv INTEGER NOT NULL DEFAULT 1,
  disponivel_comanda INTEGER NOT NULL DEFAULT 1,
  disponivel_delivery INTEGER NOT NULL DEFAULT 0,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mesas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'livre'
);

CREATE TABLE IF NOT EXISTS comandas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mesa_id INTEGER REFERENCES mesas(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'balcao',
  status TEXT NOT NULL DEFAULT 'aberta',
  observacao TEXT,
  aberta_em TEXT NOT NULL DEFAULT (datetime('now')),
  fechada_em TEXT
);

CREATE TABLE IF NOT EXISTS itens_comanda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comanda_id INTEGER NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  quantidade REAL NOT NULL DEFAULT 1,
  preco_unitario REAL NOT NULL,
  observacao TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comanda_id INTEGER REFERENCES comandas(id) ON DELETE SET NULL,
  total REAL NOT NULL DEFAULT 0,
  desconto REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'concluida',
  tipo_documento TEXT NOT NULL DEFAULT 'nao_fiscal',
  numero_documento TEXT,
  chave_acesso TEXT,
  protocolo_autorizacao TEXT,
  ambiente_fiscal TEXT,
  erro_fiscal TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS itens_venda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  nome_produto TEXT NOT NULL,
  quantidade REAL NOT NULL,
  preco_unitario REAL NOT NULL,
  subtotal REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  forma TEXT NOT NULL,
  valor REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  tipo TEXT NOT NULL,
  quantidade REAL NOT NULL,
  motivo TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS configuracoes (
  chave TEXT PRIMARY KEY,
  valor TEXT
);

CREATE INDEX IF NOT EXISTS idx_itens_comanda_comanda ON itens_comanda(comanda_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_venda ON itens_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_venda ON pagamentos(venda_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_produto ON estoque_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
`
