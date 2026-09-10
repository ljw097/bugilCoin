const express = require('express');
const router = express.Router();
const db = require('../db/db')

async function getInfo(type, param) {
    if(type === 'stock') {
        const stockPrice = await new Promise((resolve, reject) => {
            db.get(`SELECT price FROM stocks WHERE id = (?)`, [param], (err, result) => {
                if(err) reject(err);
                resolve(result);
            })
        })
        const price = stockPrice["price"];
        return price;
    }
    if(type === 'userMoney') {
        const userMoney = await new Promise((resolve, reject) => {
            db.get(`SELECT money FROM users WHERE username = (?)`, [param], (err, result) => {
                if(err) reject(err);
                resolve(result);
            });
        })
        const money = userMoney["money"];
        return money;
    }
    if(type === 'userStock') {
        //console.log(param);
        //const userStock = await db.get('SELECT stock FROM users WHERE id = (?)', [param]);
        const userStock = await new Promise((resolve, reject) => {
            db.get(`SELECT stock FROM users WHERE username = (?)`, [param], (err, result) => {
                if(err) reject(err);
                resolve(result);
            });
        })
        const stocks = JSON.parse(userStock["stock"]);
        console.log(stocks);
        return stocks;
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
    const userStock = await getInfo('userStock', id);
    //console.log(userStock[type]);
    //console.log(count);
    if(userStock[type] >= count) {
        return true;
    } else {
        return false;
    }
}

async function alterMoney(type, id, price) {
    const userMoney = await getInfo('userMoney', id);
    if(type === 'd') { //deposit
        await db.run('UPDATE users SET money = (?) WHERE username = (?)', [userMoney + price, id]);
        //const moneyIn = await getInfo('userMoney', id);
        //console.log("moneyin: ", moneyIn);
        return true;
    } else if(type === 'w') { //withdrawl
        await db.run('UPDATE users SET money = (?) WHERE username = (?)', [userMoney - price, id]);
        return true;
    } else {
        return false;
    }
}

async function alterPoss(type, id, spec, count) {
    const userStock = await getInfo('userStock', id);
    console.log('request in alterPoss(), spec ', spec, ' requesting ', count);
    console.log(userStock)
    const specifStock = userStock[spec];
    //userStock = { "1": 1, "2": 2 };
    if(type === 'b') { //buy
        const newStock = userStock[spec] + count;
        userStock[spec] = newStock;
        console.log(userStock);
        await new Promise((resolve, reject) => {
            db.run('UPDATE users SET stock = (?) WHERE username = (?)', [userStock, id], (err) => {
                if(err) reject(err);
                resolve(true);
            });
        })
        return true;
    } else if(type === 's') { //sell
        const newStock = userStock[spec] - count;
        userStock[spec] = newStock;
        const payload = JSON.stringify(userStock);
        await new Promise((resolve, reject) => {
            db.run('UPDATE users SET stock = (?) WHERE username = (?)', [payload, id], (err) => {
                if(err) reject(err);
                resolve(true);
            });
        })
        console.log('altered stock value: ', userStock[spec], ' -> ', newStock)
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
    const isValidMoney = await validateMoney(id, price * count)
    if(isValidMoney) {
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
    console.log("inbound request: sell, type: ", req.body.type, ", count: ", req.body.count);
    const { id, count, type } = req.body;
    const price = await getInfo('stock', type);
    const money = await getInfo('userMoney', id);
    console.log('money on entrance: ', money)
    //const isValidMoney = await validateMoney(id, price * count)
    const isValidStock = await validateStock(id, type, count);
    
    if(isValidStock) {
        //placeholder for changing stock prices
        await alterMoney('d', id, price * count);
        await alterPoss('s', id, type, count);

        const leftMoney = await getInfo('userMoney', id);
        const leftStock = await getInfo('userStock', id);
        console.log('money on exit: ', leftMoney)
        res.send({ "ok": true, "leftMoney": leftMoney, "leftStock": leftStock});
    } else {
        res.send({ ok: false, "error": "INSUFFICIENT"});
    }
});

module.exports = router;