-- ============================================
-- PostgreSQL Schema for Projdb
-- Updated to include:
--  • CHECK constraints to prevent negative/invalid values
--  • Helpful indexes for join performance
-- ============================================

-- 1. Tabela Cliente
CREATE TABLE IF NOT EXISTS cliente (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  morada TEXT
);

-- 2. Tabela Produto
CREATE TABLE IF NOT EXISTS produto (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),  -- ✅ prevent negative prices
  categoria VARCHAR(50)
);

-- 3. Tabela Venda
CREATE TABLE IF NOT EXISTS venda (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES cliente(id),
  data TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0)  -- ✅ prevent negative totals
);

-- 4. Tabela Pedido (itens da venda)
CREATE TABLE IF NOT EXISTS pedido (
  id SERIAL PRIMARY KEY,
  venda_id INT NOT NULL REFERENCES venda(id),
  produto_id INT NOT NULL REFERENCES produto(id),
  quantidade INT NOT NULL CHECK (quantidade > 0),           -- ✅ must be positive
  preco_unitario NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0)  -- ✅ prevent negatives
);

-- 5. Tabela Estoque
CREATE TABLE IF NOT EXISTS estoque (
  id SERIAL PRIMARY KEY,
  produto_id INT UNIQUE NOT NULL REFERENCES produto(id),
  quantidade_disponivel INT NOT NULL CHECK (quantidade_disponivel >= 0),  -- ✅ no negative stock
  localizacao VARCHAR(100)
);

-- ============================================
-- Indexes to improve join/query performance
-- ============================================

-- 🔹 Frequent joins: pedido.venda_id → venda.id
CREATE INDEX IF NOT EXISTS idx_pedido_venda_id ON pedido(venda_id);

-- 🔹 Frequent joins: pedido.produto_id → produto.id
CREATE INDEX IF NOT EXISTS idx_pedido_produto_id ON pedido(produto_id);

-- 🔹 Likely query: vendas by cliente
CREATE INDEX IF NOT EXISTS idx_venda_cliente_id ON venda(cliente_id);

