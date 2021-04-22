import express from 'express';
import mongoose from 'mongoose';
import { accountRouter } from './routes/my-bank-api.js';

import dotenv from 'dotenv';

dotenv.config();

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PSW_DB}@cluster0.3o6tz.mongodb.net/bank?retryWrites=true&w=majority`;

// Conectar ao MongoDB pelo Mongoose
(async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado no MongoDB com sucesso');
  } catch (err) {
    console.log('Erro ao conectar ao Mongo DB: ' + err);
  }
})();

const app = express();
app.use(express.json());
app.use(accountRouter);

app.listen(process.env.PORT, () => {
  console.log('API Iniciada');
});
