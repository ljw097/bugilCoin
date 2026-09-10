const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { normalizeStockMap } = require('../db/db');

async function getInfo(type, param) {
    if(type === 'stock') {
        const stockPrice = await new Promise((resolve, reject) => {
            db.get(`SELECT price FROM stocks WHERE id = (?)`, [param], (err, result) => {
                if(err) reject(err);
                resolve(result || {});
            })
        });
        return stockPrice && stockPrice.price !== undefined ? stockPrice.price : 0;
    }
    if(type === 'userMoney') {
        const userMoney = await new Promise((resolve, reject) => {
            db.get(`SELECT money FROM users WHERE username = (?)`, [param], (err, result) => {
                if(err) reject(err);
                resolve(result || { money: 0 });
            });
        });
        return Number(userMoney.money || 0);
    }
    if(type === 'userStock') {
        const userStock = await new Promise((resolve, reject) => {
            db.get(`SELECT stock FROM users WHERE username = (?)`, [param], (err, result) => {
                if(err) reject(err);
                resolve(result || { stock: '{}' });
            });
        });
        return normalizeStockMap(userStock.stock);
    }
}

async function validateMoney(id, extract) {
    const userMoney = await getInfo('userMoney', id);
    return Number(userMoney) >= Number(extract);
}

async function validateStock(id, type, count) {
    const userStock = await getInfo('userStock', id);
    const currentCount = Number(userStock[String(type)] || 0);
    return currentCount >= Number(count);
}

async function alterMoney(type, id, price) {
    const userMoney = await getInfo('userMoney', id);
    const nextMoney = Number(price);
    if(type === 'd') {
        await db.run('UPDATE users SET money = (?) WHERE username = (?)', [userMoney + nextMoney, id]);
        return true;
    } else if(type === 'w') {
        await db.run('UPDATE users SET money = (?) WHERE username = (?)', [userMoney - nextMoney, id]);
        return true;
    } else {
        return false;
    }
}

async function alterPoss(type, id, spec, count) {
    const userStock = await getInfo('userStock', id);
    const stockKey = String(spec);
    const currentCount = Number(userStock[stockKey] || 0);

    if(type === 'b') {
        userStock[stockKey] = currentCount + Number(count);
    } else if(type === 's') {
        userStock[stockKey] = currentCount - Number(count);
    } else {
        return false;
    }

    const payload = JSON.stringify(userStock);
    await new Promise((resolve, reject) => {
        db.run('UPDATE users SET stock = (?) WHERE username = (?)', [payload, id], (err) => {
            if(err) reject(err);
            resolve(true);
        });
    });
    return true;
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
    const price = await getInfo('stock', type);
    const isValidMoney = await validateMoney(id, price * count)
    console.log(isValidMoney)
    if(count > 0) {
        if(isValidMoney) {
            //placeholder for changing stock prices

            await alterMoney('w', id, price * count);
            await alterPoss('b', id, type, count);

            const leftMoney = await getInfo('userMoney', id);
            const leftStock = await getInfo('userStock', id);
            res.send({ "ok": true, "leftMoney": leftMoney, "leftStock": leftStock});
        } else {
            res.send({ "ok": false, "error": "INSUFFICIENT"});
        }
    } else {
        res.send({ "ok": false, "error": "COUNT_BELOW_ZERO"});
    }
});

router.post('/sell', async (req, res) => {
    //console.log("inbound request: sell, type: ", req.body.type, ", count: ", req.body.count);
    const { id, count, type } = req.body;
    const price = await getInfo('stock', type);
    const money = await getInfo('userMoney', id);
    //console.log('money on entrance: ', money)
    //const isValidMoney = await validateMoney(id, price * count)
    const isValidStock = await validateStock(id, type, count);
    if(count > 0) {
        if(isValidStock) {

            //placeholder for changing stock prices

            await alterMoney('d', id, price * count);
            await alterPoss('s', id, type, count);

            const leftMoney = await getInfo('userMoney', id);
            const leftStock = await getInfo('userStock', id);
            //console.log('money on exit: ', leftMoney)
            res.send({ "ok": true, "leftMoney": leftMoney, "leftStock": leftStock});
        } else {
            res.send({ "ok": false, "error": "INSUFFICIENT"});
        }
    } else {
        res.send({ "ok": false, "error": "COUNT_BELOW ZERO"});
    }
    
});

module.exports = router;