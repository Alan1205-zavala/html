const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'tu_clave_secreta'; // Debería estar en variables de entorno

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    User.findById(decoded.userId, (err, user) => {
      if (err || !user) {
        return res.status(401).json({ message: 'Token inválido.' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(400).json({ message: 'Token inválido.' });
  }
};

module.exports = auth;