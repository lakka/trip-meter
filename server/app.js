const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const rp = require('request-promise')
const sqlite3 = require('sqlite3').verbose()
const BPromise = require('bluebird')
const db = BPromise.promisifyAll(new sqlite3.Database(path.join(__dirname, 'db.sqlite')))
const crypto = require('crypto')
const fs = require('fs')
const apiToken = fs.readFileSync(path.join(__dirname, 'token'))
const session = BPromise.promisifyAll(require('cookie-session'))
const test = process.env.NODE_ENV == 'test'

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(session({
  name: 'session',
  keys: ['pökkeli', 'kakkeli']
}));

function restrict(req, res, next) {
  if (req.session.email) {
      next()
    } else {
      res.sendStatus(401)
      res.end()
    }
}
app.get('/api/check/:email', (req, serverRes) => {
  test
    ? serverRes.send(true)
    : rp(`https://script.google.com/macros/s/AKfycbyEu4c1yuHpiyo0O_LwQ-8pK6ySTgU7UkA-Wihm_YWhKaPaPtM/exec?type=emailExists&email=${req.params.email}&token=${apiToken}`)
      .then(body => serverRes.send(JSON.parse(body).isRegistered))
})

app.get('/api/exists/:email', (req, res) => {
  db.get('SELECT email FROM users WHERE email = ?', req.params.email, (err, row) => {
      if(err) {
        console.error(err)
        res.sendStatus(500)
      } else {
        if(row) res.send(JSON.parse('true'))
        else res.send(JSON.parse('false'))
      }
      res.end()
    })
})

app.post('/api/register', (req, res) => {
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

app.post('/api/login', (req, res) => {
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
      if(!row) res.sendStatus(401)
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

app.get('/api/session', restrict, (req, res) => {
  res.status(200).json({email:req.session.email})
  res.end()
})

app.post('/api/insert', restrict, (req, res) => {
  db.runAsync("INSERT INTO working_hours (email, hours, mins, desc, submitted_on) VALUES ($email, $hours, $mins, $desc, DATETIME('now'))", {
    $email: req.session.email,
    $hours: req.body.hours,
    $mins: req.body.mins,
    $desc: req.body.desc
  })
  .then(() => res.sendStatus(204))
  .catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
  .finally(() => res.end())
})

app.get('/api/preview', restrict, (req, res) => {
  db.get("SELECT * FROM working_hours WHERE email = $email AND confirmed = 0 ORDER BY submitted_on DESC LIMIT 1",
  {
    $email: req.session.email
  }, (err, row) => {
    if(err) {
      console.log(err)
      res.sendStatus(500)
      res.send(err)
    } else {
      if(!row) res.sendStatus(403)
      else {
        res.status(200).send(row)
      }
    }
    res.end()
  })
})

app.post('/api/confirm/:id', restrict, (req, res) => {
  db.runAsync("UPDATE working_hours SET confirmed = 1 WHERE email = $email AND working_hours_id = $id", {
    $email: req.session.email,
    $id: req.params.id,
  })
  .then(() => res.sendStatus(204))
  .catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
  .finally(() => res.end())
})

app.listen(3001)
