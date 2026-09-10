const express = require('express');
const router = express.Router();
const db = require('../db/db')

async function getInfo(type, param) {
    if(type === 'stock') {
        const stockPrice = db.run('SELECT price FROM stocks WHERE id = (?)', [param]);
        return stockPrice;
    }
    if(type === 'userMoney') {
        const userMoney = db.run('SELECT money FROM users WHERE id = (?)', [param]);
        return userMoney;
    }
    if(type === 'userStock') {
        const userStock = db.run('SELECT stock FROM users WHERE id = (?)', [param]);
        return userStock;
    }
}

async function validateMoney(id, extract) {
    const userMoney = getInfo('userMoney', id);
    if(userMoney >= extract) {
        return true;
    } else {
        return false;
    }
}

async function validateStock(id, type, count) {
    const userStock = getInfo('userStock', id);
    if(userStock >= count) {
        return true;
    } else {
        return false;
    }
}

async function alterMoney(type, id, price) {
    const userMoney = getInfo('userMoney', id);
    if(type === 'd') { //deposit
        await db.run('UPDATE users SET money = (?) WHERE id = (?)', [userMoney + price, id]);
        return true;
    } else if(type === 'w') { //withdrawl
        await db.run('UPDATE users SET money = (?) WHERE id = (?)', [userMoney - price, id]);
        return true;
    } else {
        return false;
    }
}

async function alterPoss(type, id, spec, count) {
    const userStock = getInfo('userStock', id)
    const specifStock = userStock.spec;
    //userStock = { "1": 1, "2": 2 };
    if(type === 'b') { //buy
        const newStock = userStock.spec += count;
        await db.run('UPDATE users SET stock = (?) WHERE id = (?)', [newStock, id]);
        return true;
    } else if(type === 's') { //sell
        const newStock = userStock.spec -= count;
        await db.run('UPDATE users SET money = (?) WHERE id = (?)', [newStock, id]);
        return true;
    } else {
        return false;
    }
}

router.get('/users', (req, res) => {
  res.send('User list');
});

/*
매수:
{
  "id": 1, -> 유저 아이디
  "type": 0,
  "count": 3
}

매도:
{
  "id": 1,
  "type": 0,
  "price": 100
}

*/

router.post('/buy', async (req,res) => {
    const { id, count, type } = req.body;
    const price = getInfo('stock', type);
    const isValid = await validateMoney(id, price * count)
    if(isValid) {
        //placeholder for changing stock prices

        alterMoney('w', id, price * count);
        alterPoss('b', id, type, count);

        const leftMoney = await getInfo('userMoney', id);
        const leftStock = await getInfo('userStock', id);
        res.send({ "ok": true, "leftMoney": leftMoney, "leftStock": leftStock});
    } else {
        res.send({ ok: false, "error": "INSUFFICIENT"});
    }
})

router.post('/sell', async (req, res) => {
    const { id, count, type } = req.body;
    const price = getInfo('stock', type);
    const isValid = await validateMoney(id, price * count)
    const isValidStock = await validateStock(id, type, count);
    if(isValid && isValidStock) {
        //placeholder for changing stock prices

        alterMoney('d', id, price * count);
        alterPoss('s', id, type, count);

        const leftMoney = await getInfo('userMoney', id);
        const leftStock = await getInfo('userStock', id);
        res.send({ "ok": true, "leftMoney": leftMoney, "leftStock": leftStock});
    } else {
        res.send({ ok: false, "error": "INSUFFICIENT"});
    }
});

module.exports = router;