const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'tu_clave_secreta';

exports.register = (req, res) => {
  const { username, password, name } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ message: 'Por favor, envía todos los campos necesarios.' });
  }

  User.findByUsername(username, (err, existingUser) => {
    if (err) {
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe.' });
    }

    User.create({ username, password, name }, (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Error al crear el usuario.' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.status(201).json({
        message: 'Usuario creado exitosamente.',
        token,
        user: { id: user.id, username: user.username, name: user.name }
      });
    });
  });
};

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Por favor, envía usuario y contraseña.' });
  }

  User.findByUsername(username, (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas.' });
    }

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor.' });
      }
      if (!isMatch) {
        return res.status(400).json({ message: 'Credenciales inválidas.' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        message: 'Login exitoso.',
        token,
        user: { id: user.id, username: user.username, name: user.name }
      });
    });
  });
};