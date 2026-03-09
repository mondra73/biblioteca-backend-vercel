const connectDB = require('../../../lib/db');
const { handleCors } = require('../../../lib/cors');
const verifyToken = require('../../../lib/verifyToken');
const User = require('../../../models/User');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  await connectDB();

  const ok = await verifyToken(req, res);
  if (!ok) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const usuario = await User.findById(req.user.id);
    if (!usuario) return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado' });

    return res.status(200).json({
      libros: usuario.libros?.length || 0,
      series: usuario.series?.length || 0,
      peliculas: usuario.peliculas?.length || 0,
      pendientes: usuario.pendientes?.length || 0,
    });
  } catch (e) {
    return res.status(500).json({ error: true, mensaje: 'Error al obtener estadísticas' });
  }
};