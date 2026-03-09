const connectDB = require('../../lib/db');
const { handleCors } = require('../../lib/cors');
const verifyToken = require('../../lib/verifyToken');
const User = require('../../models/User');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  await connectDB();

  const ok = await verifyToken(req, res);
  if (!ok) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { fecha, titulo, autor, genero, descripcion, pendienteId } = req.body;

    if (!fecha || !titulo)
      return res.status(400).json({ message: 'Faltan datos del libro.' });

    const usuario = await User.findById(req.user.id);

    const nuevoLibro = { fecha, titulo, autor, genero, descripcion };
    usuario.libros.push(nuevoLibro);

    const indicePendiente = usuario.pendientes.findIndex(
      (p) => p._id.toString() === pendienteId
    );
    if (indicePendiente === -1)
      return res.status(404).json({ mensaje: 'Pendiente no encontrado para este usuario' });

    usuario.pendientes.splice(indicePendiente, 1);
    await usuario.save();

    return res.status(200).json({ message: 'El libro ha sido agregado y eliminado de pendientes correctamente.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Error al procesar la solicitud.' });
  }
};