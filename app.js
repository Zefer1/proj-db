require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🚀 Ligado ao MongoDB'))
  .catch(err => console.error('❌ Erro ao ligar MongoDB:', err));

const express = require('express');
const pool = require('./db/pool');
const app = express();
app.use(express.json());

// Simple helper for validation errors
function validateFields(fields, res) {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '')
      return res.status(400).json({ error: `Campo obrigatório ausente: ${key}` });
  }
  return null;
}

// ========== Clientes ==========

app.get('/clientes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cliente ORDER BY id');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
});

app.post('/clientes', async (req, res) => {
  const { nome, email, telefone, morada } = req.body;
  if (validateFields({ nome, email }, res)) return;

  try {
    const result = await pool.query(
      `INSERT INTO cliente (nome, email, telefone, morada)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nome, email, telefone, morada]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email já existe' });
    }
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

app.get('/clientes/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cliente WHERE id=$1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

app.put('/clientes/:id', async (req, res) => {
  const { nome, email, telefone, morada } = req.body;
  if (validateFields({ nome, email }, res)) return;

  try {
    const { rows } = await pool.query(
      `UPDATE cliente SET nome=$1, email=$2, telefone=$3, morada=$4
       WHERE id=$5 RETURNING *`,
      [nome, email, telefone, morada, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

app.delete('/clientes/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM cliente WHERE id=$1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.status(204).send(); // ✅ Consistent 204 No Content
  } catch {
    res.status(500).json({ error: 'Erro ao eliminar cliente' });
  }
});

// ========== Produtos ==========

app.get('/produtos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produto ORDER BY id');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

app.post('/produtos', async (req, res) => {
  const { nome, descricao, preco, categoria } = req.body;
  if (validateFields({ nome, preco }, res)) return;
  if (preco < 0) return res.status(400).json({ error: 'Preço não pode ser negativo' });

  try {
    const result = await pool.query(
      `INSERT INTO produto (nome, descricao, preco, categoria)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nome, descricao, preco, categoria]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

app.get('/produtos/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produto WHERE id=$1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

app.put('/produtos/:id', async (req, res) => {
  const { nome, descricao, preco, categoria } = req.body;
  if (validateFields({ nome, preco }, res)) return;
  if (preco < 0) return res.status(400).json({ error: 'Preço não pode ser negativo' });

  try {
    const { rows } = await pool.query(
      `UPDATE produto SET nome=$1, descricao=$2, preco=$3, categoria=$4
       WHERE id=$5 RETURNING *`,
      [nome, descricao, preco, categoria, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

app.delete('/produtos/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM produto WHERE id=$1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Produto não encontrado' });
    res.status(204).send(); // ✅ Consistent 204 No Content
  } catch {
    res.status(500).json({ error: 'Erro ao eliminar produto' });
  }
});

// ========== Vendas ==========

app.post('/vendas', async (req, res) => {
  const { cliente_id, itens } = req.body;

  // ✅ Basic validation
  if (validateFields({ cliente_id, itens }, res)) return;
  if (!Array.isArray(itens) || itens.length === 0)
    return res.status(400).json({ error: 'Lista de itens inválida' });

  for (const i of itens) {
    if (!i.produto_id || !i.quantidade || !i.preco_unitario)
      return res.status(400).json({ error: 'Campos obrigatórios ausentes em item' });
    if (i.quantidade <= 0 || i.preco_unitario < 0)
      return res.status(400).json({ error: 'Quantidade e preço devem ser positivos' });
  }

  const total = itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insere venda
    const vendaRes = await client.query(
      `INSERT INTO venda (cliente_id, total)
       VALUES ($1, $2)
       RETURNING *`,
      [cliente_id, total]
    );
    const venda = vendaRes.rows[0];

    const insertedItems = [];

    // Para cada item: insere pedido e atualiza estoque
    for (const i of itens) {
      const pedidoRes = await client.query(
        `INSERT INTO pedido (venda_id, produto_id, quantidade, preco_unitario)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [venda.id, i.produto_id, i.quantidade, i.preco_unitario]
      );
      insertedItems.push(pedidoRes.rows[0]);

      //  Atualiza estoque na mesma transação
      await client.query(
        `UPDATE estoque
         SET quantidade_disponivel = GREATEST(quantidade_disponivel - $1, 0)
         WHERE produto_id = $2`,
        [i.quantidade, i.produto_id]
      );
    }

    await client.query('COMMIT');

    //  Return richer response (venda + itens)
    res.status(201).json({
      venda_id: venda.id,
      cliente_id,
      total,
      itens: insertedItems
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar venda:', err);
    res.status(500).json({ error: 'Erro ao criar venda' });
  } finally {
    client.release();
  }
});

app.get('/vendas', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, cliente_id, data, total FROM venda ORDER BY id');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Erro ao listar vendas' });
  }
});

app.get('/vendas/:id', async (req, res) => {
  const vendaId = req.params.id;
  try {
    const vendaRes = await pool.query(
      'SELECT id, cliente_id, data, total FROM venda WHERE id=$1',
      [vendaId]
    );
    if (vendaRes.rows.length === 0)
      return res.status(404).json({ error: 'Venda não encontrada' });

    const itensRes = await pool.query(
      `SELECT produto_id, quantidade, preco_unitario
       FROM pedido WHERE venda_id=$1`,
      [vendaId]
    );

    res.json({ ...vendaRes.rows[0], itens: itensRes.rows });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar venda' });
  }
});

// ==== MongoDB Rotas (mantidas iguais) ====
const ClienteMongo = require('./models/Cliente');
const ProdutoMongo = require('./models/Produto');
const VendaMongo   = require('./models/Venda');

app.get('/mongo/clientes', async (req, res) => res.json(await ClienteMongo.find()));

app.post('/mongo/clientes', async (req, res) => {
  try {
    const cli = await ClienteMongo.create(req.body);
    res.status(201).json(cli);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: 'Email já existe (Mongo)' });
    res.status(500).json({ error: 'Erro ao criar cliente (Mongo)' });
  }
});

app.get('/mongo/produtos', async (req, res) => res.json(await ProdutoMongo.find()));

app.post('/mongo/produtos', async (req, res) => {
  try {
    res.status(201).json(await ProdutoMongo.create(req.body));
  } catch {
    res.status(500).json({ error: 'Erro ao criar produto (Mongo)' });
  }
});

app.post('/mongo/vendas', async (req, res) => {
  const { cliente, itens } = req.body;
  const total = itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0);
  try {
    const venda = new VendaMongo({ cliente, itens, total });
    await venda.save();
    res.status(201).json(venda);
  } catch {
    res.status(500).json({ error: 'Erro ao criar venda (Mongo)' });
  }
});

app.get('/mongo/vendas/:id', async (req, res) => {
  const v = await VendaMongo.findById(req.params.id)
    .populate('cliente')
    .populate('itens.produto');
  if (!v) return res.status(404).json({ error: 'Venda não encontrada (Mongo)' });
  res.json(v);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));
