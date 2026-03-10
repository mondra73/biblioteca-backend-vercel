const connectDB = require('../../lib/db');
const { handleCors } = require('../../lib/cors');
const User = require('../../models/User');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  await connectDB();

  const rawUrl = req.url.replace(/^\/api\/admin\/?/, '');
  const urlPath = rawUrl.split('?')[0];

  const pathIdMatch = urlPath.match(/^(?:user\/)?(estadisticas-libros|estadisticas-peliculas|estadisticas-series)\/([a-f0-9]{24})$/i);
  const url = pathIdMatch ? pathIdMatch[1] : urlPath;
  const idFromPath = pathIdMatch ? pathIdMatch[2] : null;

  const { id: idFromQuery } = req.query;
  const idUsuario = idFromQuery || idFromPath;

  // ── GET /api/admin/estadisticas ─────────────────────────────────────────
  if (url === 'estadisticas' && req.method === 'GET') {
    try {
      const allUsers = await User.find();
      let topLibros = [], topSeries = [], topPeliculas = [];

      allUsers.forEach(u => {
        const nl = u.libros?.length || 0;
        const ns = u.series?.length || 0;
        const np = u.peliculas?.length || 0;
        if (nl > 0) topLibros.push({ nombre: u.name, cantidad: nl });
        if (ns > 0) topSeries.push({ nombre: u.name, cantidad: ns });
        if (np > 0) topPeliculas.push({ nombre: u.name, cantidad: np });
      });

      const top3 = (arr) => arr.sort((a, b) => b.cantidad - a.cantidad).slice(0, 3);

      return res.status(200).json({
        topLibros: top3(topLibros),
        topSeries: top3(topSeries),
        topPeliculas: top3(topPeliculas),
        totalUsuarios: allUsers.length,
      });
    } catch (e) {
      return res.status(500).json({ error: true, mensaje: 'Error al obtener estadísticas' });
    }
  }

  // ── GET /api/admin/estadisticas-libros?id=:idUsuario ────────────────────
  if (url === 'estadisticas-libros' && req.method === 'GET') {
    if (!idUsuario) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    try {
      const usuario = await User.findById(idUsuario);
      if (!usuario) return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado' });

      let sumaRatings = 0, librosConRating = 0;
      usuario.libros?.forEach(l => {
        if (l.valuacion != null) { sumaRatings += l.valuacion; librosConRating++; }
      });
      const promedio = librosConRating > 0 ? Math.round((sumaRatings / librosConRating) * 10) / 10 : 0;

      return res.status(200).json({
        usuario: { id: usuario._id, nombre: usuario.name },
        totalLibros: usuario.libros?.length || 0,
        promedioRating: promedio,
        totalLibrosConRating: librosConRating,
      });
    } catch (e) {
      return res.status(500).json({ error: true, mensaje: 'Error al obtener estadísticas' });
    }
  }

  // ── GET /api/admin/estadisticas-peliculas?id=:idUsuario ─────────────────
  if (url === 'estadisticas-peliculas' && req.method === 'GET') {
    if (!idUsuario) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    try {
      const usuario = await User.findById(idUsuario);
      if (!usuario) return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado' });

      let sumaRatings = 0, peliculasConRating = 0;
      usuario.peliculas?.forEach(p => {
        if (p.valuacion != null) { sumaRatings += p.valuacion; peliculasConRating++; }
      });
      const promedio = peliculasConRating > 0 ? Math.round((sumaRatings / peliculasConRating) * 10) / 10 : 0;

      return res.status(200).json({
        usuario: { id: usuario._id, nombre: usuario.name },
        totalPeliculas: usuario.peliculas?.length || 0,
        promedioRating: promedio,
        totalPeliculasConRating: peliculasConRating,
      });
    } catch (e) {
      return res.status(500).json({ error: true, mensaje: 'Error al obtener estadísticas' });
    }
  }

  // ── GET /api/admin/estadisticas-series?id=:idUsuario ────────────────────
  if (url === 'estadisticas-series' && req.method === 'GET') {
    if (!idUsuario) return res.status(400).json({ error: true, mensaje: 'Falta el parámetro id' });
    try {
      const usuario = await User.findById(idUsuario);
      if (!usuario) return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado' });

      let sumaRatings = 0, seriesConRating = 0;
      usuario.series?.forEach(s => {
        if (s.valuacion != null) { sumaRatings += s.valuacion; seriesConRating++; }
      });
      const promedio = seriesConRating > 0 ? Math.round((sumaRatings / seriesConRating) * 10) / 10 : 0;

      return res.status(200).json({
        usuario: { id: usuario._id, nombre: usuario.name },
        totalSeries: usuario.series?.length || 0,
        promedioRating: promedio,
        totalSeriesConRating: seriesConRating,
      });
    } catch (e) {
      return res.status(500).json({ error: true, mensaje: 'Error al obtener estadísticas' });
    }
  }

  return res.status(404).json({ error: 'Ruta no encontrada' });
};
