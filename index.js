const express = require('express');
const app = express();
const cors = require('cors');   
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv').config({path: path.resolve(__dirname, '.env')});
const db = require('./db/db')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'sqliteLoginSecret',
  resave: false,
  saveUninitialized: true
}));


//const loginRoutes = require('./routes/loginRoutes');
const apiRoutes = require('./routes/apiRoutes');

app.use(cors());
app.use(express.json());
app.use(apiRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the BugilCoin API');
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});