const connectDB = require('../../../lib/db');
const { handleCors } = require('../../../lib/cors');
const verifyToken = require('../../../lib/verifyToken');
const User = require('../../../models/User');
const moment = require('moment');
const Joi = require('@hapi/joi');

const schemaCargaSeries = Joi.object({
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

  if (url === 'series' && method === 'GET') {
    try {
      const usuario = await User.findById(req.user.id);
      if (!usuario) return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado' });

      const norm = usuario.series.map(s => ({
        id: s._id, titulo: s.titulo, fecha: s.fecha ? new Date(s.fecha) : new Date(0),
        director: s.director, descripcion: s.descripcion, valuacion: s.valuacion,
      })).sort((a, b) => b.fecha - a.fecha);

      const total = norm.length;
      const start = (page - 1) * PAGE_SIZE;
      return res.status(200).json({
        series: norm.slice(start, start + PAGE_SIZE),
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page, totalSeries: total,
      });
    } catch (e) { return res.status(400).json({ error: true, mensaje: e.message }); }
  }

  if (url === 'serie/buscar' && method === 'GET') {
    if (!texto) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro texto' });
    const t = texto.toLowerCase().replace(/_/g, ' ');
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

      const encontradas = user.series.filter(s =>
        s.titulo?.toLowerCase().includes(t) ||
        s.director?.toLowerCase().includes(t) ||
        s.descripcion?.toLowerCase().includes(t)
      );
      if (!encontradas.length) return res.status(404).json({ error: true, mensaje: 'No se encontraron series' });

      const norm = encontradas.map(s => ({
        id: s._id, fecha: s.fecha ? new Date(s.fecha) : new Date(0),
        titulo: s.titulo, director: s.director, descripcion: s.descripcion, valuacion: s.valuacion,
      })).sort((a, b) => b.fecha - a.fecha);

      const start = (page - 1) * PAGE_SIZE;
      const total = norm.length;
      return res.status(200).json({
        series: norm.slice(start, start + PAGE_SIZE),
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page, totalSeries: total, textoBuscado: t,
      });
    } catch (e) { return res.status(500).json({ message: 'Error interno del servidor' }); }
  }

  if (url === 'serie' && method === 'GET') {
    if (!id) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      const serie = user.series.find(s => s._id.toString() === id);
      if (!serie) return res.status(404).json({ error: true, mensaje: 'Serie no encontrada' });
      return res.json(serie);
    } catch (e) { return res.status(500).json({ message: 'Error interno del servidor' }); }
  }

  if (url === 'carga-series' && method === 'POST') {
    const { error } = schemaCargaSeries.validate(req.body);
    if (error) return res.status(400).json({ error: true, mensaje: error.details[0].message });

    const fechaActual = moment().startOf('day');
    const fechaSerie = moment(req.body.fecha).startOf('day');
    if (fechaSerie.isAfter(fechaActual))
      return res.status(400).json({ error: true, mensaje: 'La fecha no puede ser posterior al día actual.' });

    try {
      const usuario = await User.findById(req.user.id);
      usuario.series.push({
        fecha: fechaSerie.toDate(), titulo: req.body.titulo,
        director: req.body.director, descripcion: req.body.descripcion,
        valuacion: req.body.valuacion || null,
      });
      await usuario.save();
      return res.status(200).json({ mensaje: 'Serie cargada correctamente' });
    } catch (e) { return res.status(400).json({ error: true, mensaje: 'Error en el servidor: ' + e.message }); }
  }

  if (url === 'serie' && method === 'DELETE') {
    if (!id) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    try {
      const usuario = await User.findById(req.user.id);
      if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      const idx = usuario.series.findIndex(s => s._id.toString() === id);
      if (idx === -1) return res.status(404).json({ mensaje: 'Serie no encontrada' });
      usuario.series.splice(idx, 1);
      await usuario.save();
      return res.json({ mensaje: 'Serie eliminada correctamente' });
    } catch (e) { return res.status(500).json({ mensaje: 'Error del servidor' }); }
  }

  if (url === 'serie' && method === 'PUT') {
    if (!id) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    const { fecha, titulo, director, descripcion, valuacion } = req.body;
    if (!titulo) return res.status(400).json({ message: 'El título es obligatorio para editar' });

    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      const idx = user.series.findIndex(s => s._id.toString() === id);
      if (idx === -1) return res.status(404).json({ message: 'Serie no encontrada' });

      if (fecha) {
        if (moment(fecha).startOf('day').isAfter(moment().startOf('day')))
          return res.status(400).json({ message: 'La fecha no puede ser posterior al día actual' });
        user.series[idx].fecha = fecha;
      }
      if (titulo) user.series[idx].titulo = titulo;
      if (director) user.series[idx].director = director;
      if (descripcion) user.series[idx].descripcion = descripcion;
      if (valuacion !== undefined) user.series[idx].valuacion = valuacion;

      await user.save();
      return res.json({ message: 'Serie actualizada correctamente' });
    } catch (e) { return res.status(500).json({ message: 'Error interno del servidor' }); }
  }

  return res.status(404).json({ error: 'Ruta no encontrada' });
};