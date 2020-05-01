CREATE TABLE users
(
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  admin BOOLEAN,
  created_on TIMESTAMP NOT NULL,
  last_login TIMESTAMP,
  UNIQUE(email)
);

CREATE INDEX index_users_on_email on users(email);

INSERT INTO users (id, email, admin, created_on) VALUES (0, 'etherealmachine@gmail.com', TRUE, CURRENT_TIMESTAMP);
INSERT INTO users (id, email, admin, created_on) VALUES (1, 'james.l.pettit@gmail.com', TRUE, CURRENT_TIMESTAMP);