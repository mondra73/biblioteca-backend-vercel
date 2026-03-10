const connectDB = require('../../../lib/db');
const { handleCors } = require('../../../lib/cors');
const verifyToken = require('../../../lib/verifyToken');
const User = require('../../../models/User');
const moment = require('moment');
const Joi = require('@hapi/joi');

const schemaCargaPeliculas = Joi.object({
  fecha: Joi.date().required(),
  titulo: Joi.string().required(),
  director: Joi.string().allow('').optional(),
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

  const pathIdMatch = urlPath.match(/^(libro|serie|pelicula|pendiente)\/([a-f0-9]{24})$/i);
  const url = pathIdMatch ? pathIdMatch[1] : urlPath;
  const idFromPath = pathIdMatch ? pathIdMatch[2] : null;

  const { id: idFromQuery, texto, page: pageParam } = req.query;
  const id = idFromQuery || idFromPath;
  const page = parseInt(pageParam) || 1;
  const method = req.method;

  if (url === 'peliculas' && method === 'GET') {
    try {
      const usuario = await User.findById(req.user.id);
      if (!usuario) return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado' });

      const norm = usuario.peliculas.map(p => ({
        id: p._id, titulo: p.titulo, fecha: p.fecha ? new Date(p.fecha) : new Date(0),
        director: p.director, descripcion: p.descripcion, valuacion: p.valuacion,
      })).sort((a, b) => b.fecha - a.fecha);

      const total = norm.length;
      const start = (page - 1) * PAGE_SIZE;
      return res.status(200).json({
        peliculas: norm.slice(start, start + PAGE_SIZE),
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page, totalPeliculas: total,
      });
    } catch (e) { return res.status(400).json({ error: true, mensaje: e.message }); }
  }

  if (url === 'pelicula/buscar' && method === 'GET') {
    if (!texto) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro texto' });
    const t = texto.toLowerCase().replace(/_/g, ' ');
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

      const encontradas = user.peliculas.filter(p =>
        p.titulo?.toLowerCase().includes(t) ||
        p.director?.toLowerCase().includes(t) ||
        p.descripcion?.toLowerCase().includes(t)
      );
      if (!encontradas.length) return res.status(404).json({ error: true, mensaje: 'No se encontraron películas' });

      const norm = encontradas.map(p => ({
        id: p._id, fecha: p.fecha ? new Date(p.fecha) : new Date(0),
        titulo: p.titulo, director: p.director, descripcion: p.descripcion, valuacion: p.valuacion,
      })).sort((a, b) => b.fecha - a.fecha);

      const start = (page - 1) * PAGE_SIZE;
      const total = norm.length;
      return res.status(200).json({
        peliculas: norm.slice(start, start + PAGE_SIZE),
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page, totalPeliculas: total, textoBuscado: t,
      });
    } catch (e) { return res.status(500).json({ message: 'Error interno del servidor' }); }
  }

  if (url === 'pelicula' && method === 'GET') {
    if (!id) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      const pelicula = user.peliculas.find(p => p._id.toString() === id);
      if (!pelicula) return res.status(404).json({ error: true, mensaje: 'Película no encontrada' });
      return res.json(pelicula);
    } catch (e) { return res.status(500).json({ message: 'Error interno del servidor' }); }
  }

  if (url === 'carga-peliculas' && method === 'POST') {
    const { error } = schemaCargaPeliculas.validate(req.body);
    if (error) return res.status(400).json({ error: true, mensaje: error.details[0].message });

    const fechaActual = moment().startOf('day');
    const fechaPelicula = moment(req.body.fecha).startOf('day');
    if (fechaPelicula.isAfter(fechaActual))
      return res.status(400).json({ error: true, mensaje: 'La fecha no puede ser posterior al día actual.' });

    try {
      const usuario = await User.findById(req.user.id);
      usuario.peliculas.push({
        fecha: fechaPelicula.toDate(), titulo: req.body.titulo,
        director: req.body.director, descripcion: req.body.descripcion,
        valuacion: req.body.valuacion || null,
      });
      await usuario.save();
      return res.status(200).json({ mensaje: 'Película cargada correctamente' });
    } catch (e) { return res.status(400).json({ error: true, mensaje: 'Error en el servidor: ' + e.message }); }
  }

  if (url === 'pelicula' && method === 'DELETE') {
    if (!id) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    try {
      const usuario = await User.findById(req.user.id);
      if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      const idx = usuario.peliculas.findIndex(p => p._id.toString() === id);
      if (idx === -1) return res.status(404).json({ mensaje: 'Película no encontrada' });
      usuario.peliculas.splice(idx, 1);
      await usuario.save();
      return res.json({ mensaje: 'Pelicula eliminada correctamente' });
    } catch (e) { return res.status(500).json({ mensaje: 'Error del servidor' }); }
  }

  if (url === 'pelicula' && method === 'PUT') {
    if (!id) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    const { fecha, titulo, director, descripcion, valuacion } = req.body;
    if (!titulo) return res.status(400).json({ message: 'El título es obligatorio para editar' });

    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      const idx = user.peliculas.findIndex(p => p._id.toString() === id);
      if (idx === -1) return res.status(404).json({ message: 'Película no encontrada' });

      if (fecha) {
        if (moment(fecha).startOf('day').isAfter(moment().startOf('day')))
          return res.status(400).json({ message: 'La fecha no puede ser posterior al día actual' });
        user.peliculas[idx].fecha = fecha;
      }
      if (titulo) user.peliculas[idx].titulo = titulo;
      if (director) user.peliculas[idx].director = director;
      if (descripcion) user.peliculas[idx].descripcion = descripcion;
      if (valuacion !== undefined) user.peliculas[idx].valuacion = valuacion;

      await user.save();
      return res.json({ message: 'pelicula actualizada correctamente' });
    } catch (e) { return res.status(500).json({ message: 'Error interno del servidor' }); }
  }

  return res.status(404).json({ error: 'Ruta no encontrada' });
};