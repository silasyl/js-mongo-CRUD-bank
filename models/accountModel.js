import mongoose from 'mongoose';

// Criação do modelo
const accountSchema = mongoose.Schema({
  agencia: {
    type: Number,
    require: true,
  },
  conta: {
    type: Number,
    require: true,
  },
  name: {
    type: String,
    require: true,
  },
  balance: {
    type: Number,
    require: true,
    min: 0,
  },
});

// Definindo o modelo da coleção
const accountModel = mongoose.model('accounts', accountSchema, 'accounts');

export { accountModel };
