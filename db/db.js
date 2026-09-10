const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  }
});

function normalizeStockMap(stockValue) {
  if (stockValue === null || stockValue === undefined || stockValue === '') {
    return {};
  }

  if (typeof stockValue === 'object') {
    return stockValue;
  }

  try {
    const parsed = JSON.parse(stockValue);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function seedDefaultStocks() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) AS total FROM stocks', (err, row) => {
      if (err) return reject(err);
      if (row.total > 0) return resolve();

      const defaults = [
        ['stock_1', 100],
        ['stock_2', 150],
        ['stock_3', 200]
      ];

      let completed = 0;
      defaults.forEach(([name, price]) => {
        db.run('INSERT INTO stocks (name, price) VALUES (?, ?)', [name, price], (insertErr) => {
          if (insertErr) return reject(insertErr);
          completed += 1;
          if (completed === defaults.length) resolve();
        });
      });
    });
  });
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT,
          money INTEGER DEFAULT 3000,
          stock TEXT DEFAULT '{}'
        )
      `, (err) => {
        if (err) return reject(err);
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS stocks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE,
          price INTEGER
        )
      `, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }).then(() => seedDefaultStocks());
}

module.exports = db;
module.exports.initializeDatabase = initializeDatabase;
module.exports.seedDefaultStocks = seedDefaultStocks;
module.exports.normalizeStockMap = normalizeStockMap;

