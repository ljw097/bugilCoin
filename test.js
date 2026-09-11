const db = require('./db/db');

async function runDB() {
    //db.run(`ALTER TABLE stocks ADD name TEXT UNIQUE`)
    //db.run(`INSERT INTO stocks (name, price) VALUES ('test2', '100')`);
    db.run(`UPDATE users SET stock = (?) where username = (?)`, ['{"1": 1, "2":2}', 'test']);

}    
async function postData() {
  const url = 'http://localhost:4000/auth/signup';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify({
      username: "teasdfst",
      password: "tasdfasdfest",
      password_c: "tasdfasdfest"
    })
  });
  console.log(response)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  console.log(result);
}
//runDB();
postData();
