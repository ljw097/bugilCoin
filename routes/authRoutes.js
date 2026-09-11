const express = require('express');
const router = express.Router()
const db = require('../db/db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

async function userExists(id) {
    const row = await new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE username = (?)`, [id], (err, result) => {
            if(err) reject(err);
            resolve(result);
        })
    })
    if(row == null) return false;
    return row.id;
}

async function register(username, hashed) {
    await db.run(`INSERT INTO users (username, password, money) VALUES (?,?,?)`, [username, hashed, 5000]);
    const uid = await userExists(username);
    if(uid) return uid;
    return false
}

async function validatePassword(password, password_c) {
    if(password != password_c) return false;    

    if(password.length < 6) return false;
    if(password.length > 20) return false;
    return true;
}

router.post('/signup', async (req,res) => {
    const { username, password, password_c } = req.body;
    const validUser = await userExists(String(username));
    const validPwd = await validatePassword(String(password), String(password_c));

    if(!validUser && validPwd) {
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashed = bcrypt.hashSync(password, salt);
        
        const uid = await register(username, hashed);
        return res.redirect('/login');
    } else {
        if(validUser) return res.send(`<script>alert('존재하는 ID입니다');window.location.replace('/signup')</script>`)
        return res.send(`<script>alert('다시 시도하세요.')</script>`);
    }
})

router.post('/login', async (req,res) => {
    const { username, password } = req.body;
    if(req.session.user) return res.redirect('/');
    if (
        typeof username !== 'string' ||
        typeof password !== 'string'
    ) {
        return res.send(`<script>alert("잘못된 입력입니다.");window.location.replace('/login')</script>`)
    }

    const realUser = await userExists(username);
    if(!realUser) return res.send(`<script>alert("비밀번호나 아이디가 틀렸습니다.");window.location.replace('/login')</script>`);
    const hashed = await new Promise((resolve, reject) => {
        db.get(`SELECT password FROM users WHERE     username = (?)`, [username], (err, result) => {
            if(err) reject(err);
            resolve(result["password"]);
        })
    })
    
    const result = await bcrypt.compare(password, hashed);
    if(result) {
        const uid = await userExists(username);
        req.session.user = {
            id: uid,
            username: username
        }
        return res.redirect('/');
    } else {
        return res.send(`<script>alert("비밀번호나 아이디가 틀렸습니다.");window.location.replace('/login')</script>`)
    }
})

router.get('/me', (req, res) => {
    if(req.session.user) {
        return res.json({ loggedIn: true, username: req.session.user.username });
    }
    return res.json({ loggedIn: false });
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;