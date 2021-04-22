import express from 'express';
import { accountModel } from '../models/accountModel.js';

const app = express();

// DEPOSIT
app.patch('/bank/deposit/:agency/:account/:value', async (req, res) => {
  try {
    const agency = req.params.agency;
    const account = req.params.account;
    const value = req.params.value;
    const deposit = await accountModel.updateOne(
      { agencia: agency, conta: account },
      { $inc: { balance: value } }
    );
    const info = await accountModel.find(
      { agencia: agency, conta: account },
      { _id: 0 }
    );
    if (info != '') {
      res.send(`Depósito realizado com sucesso: ${info}`);
    } else {
      throw new Error('Agência ou Conta não existente!');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// WITHDRAW
app.patch('/bank/withdraw/:agency/:account/:value', async (req, res) => {
  try {
    const agency = req.params.agency;
    const account = req.params.account;
    const value = parseInt(req.params.value);
    const withdraw = await accountModel.updateOne(
      { agencia: agency, conta: account },
      { $inc: { balance: -(value + 1) } }
    );
    const info = await accountModel.find(
      { agencia: agency, conta: account },
      { _id: 0 }
    );

    if (info != '') {
      if (info[0].balance >= 0) {
        res.send(`Saque realizado com sucesso: ${info[0].balance}`);
      } else {
        await accountModel.updateOne(
          { agencia: agency, conta: account },
          { $inc: { balance: value + 1 } }
        );
        throw new Error('Saldo indisponível para saque!');
      }
    } else {
      throw new Error('Agência ou Conta não existente!');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// BALANCE
app.get('/bank/get/:agency/:account', async (req, res) => {
  try {
    const agency = req.params.agency;
    const account = req.params.account;
    const info = await accountModel.find({ agencia: agency, conta: account });
    if (info != '') {
      res.send(info);
    } else {
      throw new Error('Agência ou Conta não existente!');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// DELETE
app.delete('/bank/:agency/:account', async (req, res) => {
  try {
    const agency = req.params.agency;
    const account = req.params.account;
    const info = await accountModel.findOneAndDelete({
      agencia: agency,
      conta: account,
    });

    if (!info) {
      res.status(404).send('Agência ou Conta não existente!');
    } else {
      // const agencyCounter = await accountModel.find({ agencia: agency });
      const agencyCounter = await accountModel.countDocuments({
        agencia: agency,
      });
      res
        .status(200)
        .send(`Quantidade de contas ativas nessa agência: ${agencyCounter}`);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// TRANSFER
app.patch('/bank/transfer/:origin/:destiny/:value', async (req, res) => {
  try {
    const origin = req.params.origin;
    const destiny = req.params.destiny;
    const value = req.params.value;
    const accOrigin = await accountModel.findOne({ conta: origin });
    const accDestiny = await accountModel.findOne({ conta: destiny });
    let tax = 0;

    if (accOrigin.agencia != accDestiny.agencia) {
      tax = 8;
    }

    const valueOrigin = parseFloat(value) + tax;
    const transfer = await accountModel.updateOne(
      { conta: origin },
      { $inc: { balance: -valueOrigin } }
    );
    const info = await accountModel.findOne({ conta: origin });

    if (info != '') {
      if (info.balance >= 0) {
        res.send(`Saldo na origem após transferência: ${info.balance}`);
        await accountModel.updateOne(
          { conta: destiny },
          { $inc: { balance: value } }
        );
      } else {
        await accountModel.updateOne(
          { conta: origin },
          { $inc: { balance: valueOrigin } }
        );
        throw new Error('Saldo indisponível para saque!');
      }
    } else {
      throw new Error('Agência ou Conta não existente!');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// MEAN_VALUE
app.get('/bank/mean/:agency', async (req, res) => {
  try {
    const agency = req.params.agency;
    const accounts = await accountModel.find({ agencia: agency });
    const sum = accounts.reduce((acc, cur) => {
      return acc + parseInt(cur.balance);
    }, 0);
    const mean = sum / accounts.length;

    if (accounts != '') {
      res.send(`A média da agência ${agency} é: ${mean}`);
    } else {
      throw new Error('Agência ou Conta não existente!');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// LOWER_VALUES
app.get('/bank/lower/:value', async (req, res) => {
  try {
    const value = req.params.value;
    const accounts = await accountModel
      .find()
      .sort({ balance: 1 })
      .limit(parseInt(value));

    if (accounts != '') {
      res.send(accounts);
    } else {
      throw new Error('Valor não possível');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// HIGHER_VALUES
app.get('/bank/higher/:value', async (req, res) => {
  try {
    const value = req.params.value;
    const accounts = await accountModel
      .find()
      .sort({ balance: -1, name: 1 })
      .limit(parseInt(value));

    if (accounts != '') {
      res.send(accounts);
    } else {
      throw new Error('Valor não possível');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// PRIVATE
app.post('/bank/private', async (_, res) => {
  try {
    const agency = 99;
    const agencies = await accountModel.distinct('agencia');

    for (let i = 0; i < agencies.length; i++) {
      const toChange = await accountModel
        .find({ agencia: agencies[i] })
        .sort({ balance: -1 })
        .limit(1);
      const newAccount = await accountModel.findOneAndUpdate(
        { agencia: toChange[0].agencia, conta: toChange[0].conta },
        {
          agencia: agency,
        }
      );
    }

    const newPrivate = await accountModel.find({ agencia: agency });

    res.send(newPrivate);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// // POST
// app.post('/bank/', async (req, res) => {
//   try {
//     const student = new studentModel(req.body);
//     await student.save();
//     res.send(student);
//   } catch (err) {
//     res.status(500).send(err);
//   }
// });

// RETRIEVE
app.get('/bank', async (req, res) => {
  try {
    const account = await accountModel.find({});
    res.send(account);
  } catch (err) {
    res.status(500).send(err);
  }
});

// // UPDATE
// app.patch('/student/:id', async (req, res) => {
//   try {
//     const id = req.params.id;
//     const student = await studentModel.findByIdAndUpdate(
//       { _id: id },
//       req.body,
//       {
//         new: true,
//       }
//     );
//     res.send(student);
//   } catch (err) {
//     res.status(500).send(err);
//   }
// });

// // DELETE
// app.delete('/student/:id', async (req, res) => {
//   try {
//     const student = await studentModel.findByIdAndDelete({
//       _id: req.params.id,
//     });
//     if (!student) {
//       res.status(404).send('Documento nao encontrado');
//     } else {
//       res.status(200).send();
//     }
//   } catch (err) {
//     res.status(500).send(err);
//   }
// });

export { app as accountRouter };
