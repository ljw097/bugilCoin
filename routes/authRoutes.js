const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.get('/signup', async (req,res) => {
    const { username, password } = req.body;

})

module.exports = router;