const express = require('express')
const bodyParser = require('body-parser')
const rp = require('request-promise')
const sqlite3 = require('sqlite3').verbose()
const BPromise = require('bluebird')
const db = BPromise.promisifyAll(new sqlite3.Database('db.sqlite'))
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const apiToken = fs.readFileSync(path.join(__dirname, 'token'))
const session = BPromise.promisifyAll(require('express-session'))

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(session({
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: 'pökkeli'
}));

app.get('/*',function(req,res,next){
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.post('/*',function(req,res,next){
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.options("/*", function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Content-Length, X-Requested-With');
  res.sendStatus(200)
});


function restrict(req, res, next) {
  if (req.session.email) {
      next()
    } else {
      res.sendStatus(401)
      res.end()
    }
}
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
  const hash = crypto.createHash('sha256')
  const salt = Math.floor(Math.random()*1000000000)
  hash.update(req.body.pass + salt)
  db.runAsync("INSERT INTO users VALUES ($email, $salt, $hash, 0)", {
    $email: req.body.email,
    $hash: hash.digest('hex'),
    $salt: salt
  })
  .then(() => {
    res.status(200).json(req.body)
  })
  .catch(err => {
    console.log(err)
    res.sendStatus(500)
  })
  .finally(() => res.end())
})

app.post('/login', (req, res) => {
  const hash = crypto.createHash('sha256')
  if(!req.body.email || !req.body.pass) {
    res.sendStatus(400)
    res.end()
    return
  }
  db.get("SELECT * FROM users WHERE email = ?", req.body.email, (err, row) => {
    if(err) {
      res.sendStatus(500)
      res.send(err)
    } else {
      if(!row) res.sendStatus(404)
      else {
        hash.update(req.body.pass + row.salt)
        if(hash.digest('hex') === row.password_hash) {
          req.session.email = req.body.email
          res.sendStatus(204)
        } else res.sendStatus(401)
      }
    }
    res.end()
  })
})

app.get('/home', restrict, (req, res) => {
  res.sendStatus(204)
  res.end()
})
app.listen(3001);
