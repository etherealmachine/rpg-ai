CREATE TABLE users
(
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  admin BOOLEAN,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login TIMESTAMP,
  UNIQUE(email)
);

CREATE INDEX index_users_on_email on users(email);

INSERT INTO users (id, email, admin) VALUES (0, 'etherealmachine@gmail.com', TRUE);
INSERT INTO users (id, email, admin) VALUES (1, 'james.l.pettit@gmail.com', TRUE);