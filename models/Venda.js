

const { Schema, model, Types } = require('mongoose');

const VendaSchema = new Schema({
  cliente: { type: Types.ObjectId, ref: 'Cliente', required: true },
  data: { type: Date, default: Date.now },
  itens: [{
    produto: { type: Types.ObjectId, ref: 'Produto', required: true },
    quantidade: { type: Number, required: true },
    preco_unitario: { type: Number, required: true }
  }],
  total: { type: Number, required: true }
});

module.exports = model('Venda', VendaSchema);
