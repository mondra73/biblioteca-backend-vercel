const connectDB = require('../../../lib/db');
const { handleCors } = require('../../../lib/cors');
const verifyToken = require('../../../lib/verifyToken');
const User = require('../../../models/User');
const moment = require('moment');
const Joi = require('@hapi/joi');

const schemaCargaLibros = Joi.object({
  fecha: Joi.date().required().max('now'),
  titulo: Joi.string().required(),
  autor: Joi.string().required(),
  genero: Joi.string().allow('').optional(),
  descripcion: Joi.string().allow('').optional(),
  valuacion: Joi.number().integer().min(1).max(5).allow(null).optional(),
});

const PAGE_SIZE = 20;

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  await connectDB();

  const ok = await verifyToken(req, res);
  if (!ok) return;

  const rawUrl = req.url.replace(/^\/api\/admin\/user\/?/, '');
  const urlPath = rawUrl.split('?')[0];
  const method = req.method;

  const pathIdMatch = urlPath.match(/^(libro|serie|pelicula|pendiente)\/([a-f0-9]{24})$/i);
  const url = pathIdMatch ? pathIdMatch[1] : urlPath;
  const idFromPath = pathIdMatch ? pathIdMatch[2] : null;

  const { id: idFromQuery, texto, page: pageParam } = req.query;
  const id = idFromQuery || idFromPath;
  const page = parseInt(pageParam) || 1;

  // ── GET /api/admin/user/libros ──────────────────────────────────────────
  if (url === 'libros' && method === 'GET') {
    try {
      const usuario = await User.findById(req.user.id);
      if (!usuario) return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado' });

      const librosNorm = usuario.libros.map(l => ({
        id: l._id, titulo: l.titulo, autor: l.autor,
        fecha: l.fecha ? new Date(l.fecha) : new Date(0),
        genero: l.genero, descripcion: l.descripcion, valuacion: l.valuacion,
      })).sort((a, b) => b.fecha - a.fecha);

      const total = librosNorm.length;
      const start = (page - 1) * PAGE_SIZE;
      return res.status(200).json({
        libros: librosNorm.slice(start, start + PAGE_SIZE),
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page, totalLibros: total,
      });
    } catch (e) { return res.status(400).json({ error: true, mensaje: e.message }); }
  }

  // ── GET /api/admin/user/libro/buscar?texto=:texto ───────────────────────
  if (url === 'libro/buscar' && method === 'GET') {
    if (!texto) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro texto' });
    const t = texto.toLowerCase().replace(/_/g, ' ');
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado' });

      const encontrados = user.libros.filter(l =>
        l.titulo?.toLowerCase().includes(t) ||
        l.autor?.toLowerCase().includes(t) ||
        l.genero?.toLowerCase().includes(t) ||
        l.descripcion?.toLowerCase().includes(t)
      );
      if (!encontrados.length) return res.status(404).json({ error: true, mensaje: 'No se encontraron libros' });

      const norm = encontrados.map(l => ({
        id: l._id, titulo: l.titulo, autor: l.autor,
        fecha: l.fecha ? new Date(l.fecha) : new Date(0),
        genero: l.genero, descripcion: l.descripcion,
      })).sort((a, b) => b.fecha - a.fecha);

      const start = (page - 1) * PAGE_SIZE;
      const total = norm.length;
      return res.status(200).json({
        libros: norm.slice(start, start + PAGE_SIZE),
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page, totalLibros: total, textoBuscado: t,
      });
    } catch (e) { return res.status(500).json({ error: true, mensaje: e.message }); }
  }

  // ── GET /api/admin/user/libro?id=:libroId ───────────────────────────────
  if (url === 'libro' && method === 'GET') {
    if (!id) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      const libro = user.libros.find(l => l._id.toString() === id);
      if (!libro) return res.status(404).json({ error: true, mensaje: 'Libro no encontrado' });
      return res.json({ id: libro._id, titulo: libro.titulo, autor: libro.autor, fecha: libro.fecha, genero: libro.genero, descripcion: libro.descripcion, valuacion: libro.valuacion });
    } catch (e) { return res.status(500).json({ message: 'Error interno del servidor' }); }
  }

  // ── POST /api/admin/user/carga-libros ───────────────────────────────────
  if (url === 'carga-libros' && method === 'POST') {
    const { error } = schemaCargaLibros.validate(req.body);
    if (error) return res.status(400).json({ error: true, mensaje: error.details[0].message });

    const fechaActual = moment().startOf('day');
    const fechaLibro = moment(req.body.fecha).startOf('day');
    if (fechaLibro.isAfter(fechaActual))
      return res.status(400).json({ error: true, mensaje: 'La fecha no puede ser posterior al día actual.' });

    try {
      const usuario = await User.findById(req.user.id);
      usuario.libros.push({
        fecha: fechaLibro.toDate(), titulo: req.body.titulo,
        autor: req.body.autor, genero: req.body.genero,
        descripcion: req.body.descripcion, valuacion: req.body.valuacion || null,
      });
      await usuario.save();
      return res.status(200).json({ mensaje: 'Libro cargado correctamente' });
    } catch (e) { return res.status(400).json({ error: true, mensaje: 'Error en el servidor: ' + e.message }); }
  }

  // ── DELETE /api/admin/user/libro?id=:libroId ────────────────────────────
  if (url === 'libro' && method === 'DELETE') {
    if (!id) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    try {
      const usuario = await User.findById(req.user.id);
      if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      const idx = usuario.libros.findIndex(l => l._id.toString() === id);
      if (idx === -1) return res.status(404).json({ mensaje: 'Libro no encontrado' });
      usuario.libros.splice(idx, 1);
      await usuario.save();
      return res.json({ mensaje: 'Libro eliminado correctamente' });
    } catch (e) { return res.status(500).json({ mensaje: 'Error del servidor' }); }
  }

  // ── PUT /api/admin/user/libro?id=:libroId ───────────────────────────────
  if (url === 'libro' && method === 'PUT') {
    if (!id) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    const { fecha, titulo, autor, genero, descripcion, valuacion } = req.body;
    if (!titulo) return res.status(400).json({ message: 'El título es obligatorio para editar' });

    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      const idx = user.libros.findIndex(l => l._id.toString() === id);
      if (idx === -1) return res.status(404).json({ message: 'Libro no encontrado' });

      if (fecha) {
        const fechaActual = moment().startOf('day');
        if (moment(fecha).startOf('day').isAfter(fechaActual))
          return res.status(400).json({ message: 'La fecha no puede ser posterior al día actual' });
        user.libros[idx].fecha = fecha;
      }
      if (titulo) user.libros[idx].titulo = titulo;
      if (autor) user.libros[idx].autor = autor;
      if (genero) user.libros[idx].genero = genero;
      if (descripcion) user.libros[idx].descripcion = descripcion;
      if (valuacion !== undefined) user.libros[idx].valuacion = valuacion;

      await user.save();
      return res.json({ message: 'Libro actualizado correctamente' });
    } catch (e) { return res.status(500).json({ message: 'Error interno del servidor' }); }
  }

  return res.status(404).json({ error: 'Ruta no encontrada' });
};
