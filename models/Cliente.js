const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  nome:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  telefone: String,
  morada:   String
});

// evita "Cannot overwrite model once compiled" se o nodemon recarregar
module.exports = mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);
