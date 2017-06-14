const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'))

const users = `
  CREATE TABLE users
  (
    email VARCHAR(200) PRIMARY KEY,
    salt INT,
    password_hash TEXT,
    admin BOOLEAN
  )`

const usersData = `
  INSERT INTO users VALUES
  (
    'admin@example.com',
    127697260,
    'b313a46b70b2fe995587f559076f9201a441c1a5557a2d4d75ee6d7d66a06475',
    1
  )`

const workingHours = `
  CREATE TABLE working_hours
  (
    email VARCHAR(200),
    hours INT,
    mins INT,
    desc TEXT,
    submitted_on DATETIME,
    FOREIGN KEY(email) REFERENCES users(email)
  )`

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS users")
    db.run("DROP TABLE IF EXISTS working_hours")
    db.run(users)
    db.run(usersData)
    db.run(workingHours);
})
