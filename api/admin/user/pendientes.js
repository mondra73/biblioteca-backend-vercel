const connectDB = require('../../../lib/db');
const { handleCors } = require('../../../lib/cors');
const verifyToken = require('../../../lib/verifyToken');
const User = require('../../../models/User');
const Joi = require('@hapi/joi');

const schemaCargaPendientes = Joi.object({
  titulo: Joi.string().required(),
  tipo: Joi.string().required(),
  autorDirector: Joi.string().allow('').optional(),
  descripcion: Joi.string().allow('').optional(),
});

const PAGE_SIZE = 20;

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  await connectDB();

  const ok = await verifyToken(req, res);
  if (!ok) return;

  const url = req.url.replace(/^\/api\/admin\/user\/?/, '').split('?')[0];
  const { id, texto, page: pageParam } = req.query;
  const page = parseInt(pageParam) || 1;
  const method = req.method;

  if (url === 'pendientes' && method === 'GET') {
    try {
      const usuario = await User.findById(req.user.id);
      if (!usuario) return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado' });

      const norm = usuario.pendientes.map(p => ({
        id: p._id, tipo: p.tipo, titulo: p.titulo,
        autorDirector: p.autorDirector, descripcion: p.descripcion,
      }));

      const total = norm.length;
      const start = (page - 1) * PAGE_SIZE;
      return res.status(200).json({
        pendientes: norm.slice(start, start + PAGE_SIZE),
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page, totalPendientes: total,
      });
    } catch (e) { return res.status(400).json({ error: true, mensaje: e.message }); }
  }

  if (url === 'pendiente/buscar' && method === 'GET') {
    if (!texto) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro texto' });
    const t = texto.toLowerCase().replace(/_/g, ' ');
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

      const encontrados = user.pendientes.filter(p =>
        p.titulo?.toLowerCase().includes(t) ||
        p.autorDirector?.toLowerCase().includes(t) ||
        p.descripcion?.toLowerCase().includes(t)
      );
      if (!encontrados.length) return res.status(404).json({ message: 'No se encontraron pendientes' });

      return res.status(200).json(encontrados);
    } catch (e) { return res.status(500).json({ message: 'Error interno del servidor' }); }
  }

  if (url === 'pendiente' && method === 'GET') {
    if (!id) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      const pendiente = user.pendientes.find(p => p._id.toString() === id);
      if (!pendiente) return res.status(404).json({ error: true, mensaje: 'Pendiente no encontrado' });
      return res.json({
        _id: pendiente._id, titulo: pendiente.titulo,
        autorDirector: pendiente.autorDirector, descripcion: pendiente.descripcion,
        tipo: pendiente.tipo, confirma: pendiente.confirma,
        fecha_agregado: pendiente.fecha_agregado || new Date().toISOString(),
        genero: pendiente.genero || '', notas: pendiente.notas || '',
      });
    } catch (e) { return res.status(500).json({ message: 'Error interno del servidor' }); }
  }

  if (url === 'carga-pendientes' && method === 'POST') {
    const { error } = schemaCargaPendientes.validate(req.body);
    if (error) return res.status(400).json({ error: true, mensaje: error.details[0].message });

    try {
      const usuario = await User.findById(req.user.id);
      usuario.pendientes.push({
        titulo: req.body.titulo, autorDirector: req.body.autorDirector,
        descripcion: req.body.descripcion, tipo: req.body.tipo,
      });
      await usuario.save();
      return res.status(200).json({ mensaje: 'Pendiente cargado correctamente' });
    } catch (e) { return res.status(400).json({ error: true, mensaje: 'Error en el servidor: ' + e.message }); }
  }

  if (url === 'pendiente' && method === 'DELETE') {
    if (!id) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    try {
      const usuario = await User.findById(req.user.id);
      if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      const idx = usuario.pendientes.findIndex(p => p._id.toString() === id);
      if (idx === -1) return res.status(404).json({ mensaje: 'Pendiente no encontrado' });
      usuario.pendientes.splice(idx, 1);
      await usuario.save();
      return res.json({ mensaje: 'Pendiente eliminado correctamente' });
    } catch (e) { return res.status(500).json({ mensaje: 'Error del servidor' }); }
  }

  if (url === 'pendiente' && method === 'PUT') {
    if (!id) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    const { titulo, autorDirector, descripcion } = req.body;
    if (!titulo) return res.status(400).json({ message: 'El título es obligatorio para editar' });

    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      const idx = user.pendientes.findIndex(p => p._id.toString() === id);
      if (idx === -1) return res.status(404).json({ message: 'Pendiente no encontrado' });

      if (titulo) user.pendientes[idx].titulo = titulo;
      if (autorDirector) user.pendientes[idx].autorDirector = autorDirector;
      if (descripcion) user.pendientes[idx].descripcion = descripcion;

      await user.save();
      return res.json({ message: 'Pendiente actualizado correctamente' });
    } catch (e) { return res.status(500).json({ message: 'Error interno del servidor' }); }
  }

  return res.status(404).json({ error: 'Ruta no encontrada' });
};