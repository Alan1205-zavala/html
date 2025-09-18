const db = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {};

User.create = (user, callback) => {
  const { username, password, name } = user;
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return callback(err);
    db.run(
      'INSERT INTO users (username, password, name) VALUES (?, ?, ?)',
      [username, hash, name],
      function(err) {
        callback(err, { id: this.lastID, username, name });
      }
    );
  });
};

User.findByUsername = (username, callback) => {
  db.get('SELECT * FROM users WHERE username = ?', [username], callback);
};

User.findById = (id, callback) => {
  db.get('SELECT id, username, name FROM users WHERE id = ?', [id], callback);
};

module.exports = User;