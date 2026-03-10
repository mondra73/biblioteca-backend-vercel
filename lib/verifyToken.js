const jwt = require('jsonwebtoken');
const User = require('../models/User'); // ← usar el modelo real

const verifyToken = async (req, res) => {
  const token = req.headers['auth-token'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Acceso denegado' });
    return false;
  }

  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    const user = await User.findById(verified.id);
    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return false;
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider,
      verificado: user.verificado,
    };

    return true;
  } catch (error) {
    res.status(400).json({ error: 'Token no es válido' });
    return false;
  }
};

module.exports = verifyToken;