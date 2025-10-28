const { Schema, model } = require('mongoose');

const ProdutoSchema = new Schema({
  nome:      { type: String, required: true },
  descricao: String,
  preco:     { type: Number, required: true },
  categoria: String
});

module.exports = model('Produto', ProdutoSchema);
