const express = require('express')
const bodyParser = require('body-parser')
const rp = require('request-promise')
const sqlite3 = require('sqlite3').verbose()
const BPromise = require('bluebird')
const db = BPromise.promisifyAll(new sqlite3.Database('db.sqlite'))
const crypto = require('crypto')
const hash = crypto.createHash('sha256')
const fs = require('fs')
const apiToken = fs.readFileSync(__dirname + '/token')

const app = express()

app.get('/*',function(req,res,next){
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.options("/*", function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Content-Length, X-Requested-With');
  res.send(200);
});

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/check/:email', (req, serverRes) => {
  rp(`https://script.google.com/macros/s/AKfycbyEu4c1yuHpiyo0O_LwQ-8pK6ySTgU7UkA-Wihm_YWhKaPaPtM/exec?type=emailExists&email=${req.params.email}&token=${apiToken}`)
    .then(body => serverRes.send(JSON.parse(body).isRegistered))
})

app.get('/exists/:email', (req, res) => {
  db.get('SELECT email FROM users WHERE email = ?', req.params.email, (err, row) => {
      if(err) {
        res.sendStatus(500)
      } else {
        if(row) res.send(JSON.parse('true'))
        else res.send(JSON.parse('false'))
      }
      res.end()
    })
})

app.post('/register', (req, res) => {
  const salt = Math.floor(Math.random()*1000000000)
  hash.update(req.body.pass + salt)
  db.runAsync("INSERT INTO users VALUES ($email, $salt, $hash, 0)", {
    $email: req.body.email,
    $hash: hash.digest('hex'),
    $salt: salt
  })
  .then(() => res.sendStatus(204))
  .catch(err => {
    res.sendStatus(500)
    res.send(err)
  })
  .finally(() => res.end())
})

app.post('/login', (req, res) => {
  hash.update(req.body.pass + salt)
  db.getAsync("SELECT * FROM users WHERE email = ?", req.body.email)
  .then(row => res.sendStatus(204))
  .catch(err => {
    res.sendStatus(500)
    res.send(err)
  })
  .finally(() => res.end())
})
app.listen(3001);
