CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  admin BOOLEAN,
  created_on TIMESTAMP NOT NULL,
  last_login TIMESTAMP,
  UNIQUE(email)
);

CREATE INDEX index_users_on_email on users(email);

INSERT INTO users (email, created_on) VALUES ('etherealmachine@gmail.com', CURRENT_TIMESTAMP);
INSERT INTO users (email, created_on) VALUES ('james.l.pettit@gmail.com', CURRENT_TIMESTAMP);