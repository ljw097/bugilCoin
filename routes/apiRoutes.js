const express = require('express');
const router = express.Router();
const db = require('../db/db')

async function validateMoney(id, extract) {
    const userMoney = getInfo('userMoney', id);
    if(userMoney >= extract) {
        return true;
    } else {
        return false;
    }
}

async function alterMoney(type, id, price) {
    const userMoney = getInfo('userMoney', id)
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
        alterMoney('e', id, price * count);
        alterPoss('b', id, type, count);

        const userInfo = getInfo('userMoney', id);
        res.send({ ok: true, leftMoney})
    } else {
    //userStock = ["1":"30", ]

    }
})

router.post('/sell', (req, res) => {
    res.send(`Sell item with ID: ${id}`);
});

module.exports = router;