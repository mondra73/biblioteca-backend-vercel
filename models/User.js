const mongoose = require('mongoose');

// ── Libro ──────────────────────────────────────────────
const libroSchema = new mongoose.Schema({
  fecha: Date,
  titulo: String,
  autor: String,
  genero: String,
  descripcion: String,
  valuacion: { type: Number, default: null },
});

// ── Serie ──────────────────────────────────────────────
const serieSchema = new mongoose.Schema({
  fecha: Date,
  titulo: String,
  director: String,
  descripcion: String,
  valuacion: { type: Number, default: null },
});

// ── Pelicula ───────────────────────────────────────────
const peliculaSchema = new mongoose.Schema({
  fecha: Date,
  titulo: String,
  director: String,
  descripcion: String,
  valuacion: { type: Number, default: null },
});

// ── Pendiente ──────────────────────────────────────────
const pendienteSchema = new mongoose.Schema({
  titulo: String,
  tipo: String,
  autorDirector: String,
  descripcion: String,
  confirma: Boolean,
  fecha_agregado: { type: Date, default: Date.now },
  genero: String,
  notas: String,
});

// ── Usuario ────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  token: String,
  tokenCreatedAt: Date,
  verificado: { type: Boolean, default: false },
  authProvider: { type: String, default: 'local' },
  googleId: String,
  avatar: String,
  libros: [libroSchema],
  series: [serieSchema],
  peliculas: [peliculaSchema],
  pendientes: [pendienteSchema],
});

// Patrón singleton — evita re-registro en entorno serverless
const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

module.exports = User;
