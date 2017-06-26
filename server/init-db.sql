DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS working_hours;

CREATE TABLE users
(
  email VARCHAR(200) PRIMARY KEY,
  salt INT,
  password_hash TEXT,
  admin BOOLEAN
);

INSERT INTO users VALUES
(
  'admin@example.com',
  127697260,
  'b313a46b70b2fe995587f559076f9201a441c1a5557a2d4d75ee6d7d66a06475',
  1
);

CREATE TABLE working_hours
(
  working_hours_id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(200),
  hours INT,
  mins INT,
  desc TEXT,
  submitted_on DATETIME,
  confirmed BOOLEAN DEFAULT 0,
  FOREIGN KEY(email) REFERENCES users(email)
);

INSERT INTO working_hours
(
  email,
  hours,
  mins,
  desc,
  submitted_on,
  confirmed
)
VALUES
(
  'admin@example.com',
  1,
  15,
  'testidescription',
  '2017-06-18 11:41:30',
  1
);

