const router = require("express").Router();
const moment = require("moment");
const Joi = require("@hapi/joi");

const usuarios = require("../models/Users");
const Pelicula = require("../models/peliculas");

const schemaCargaPeliculas = Joi.object({
  fecha: Joi.date().required().messages({
    "any.required": "La fecha es obligatoria.",
  }),
  titulo: Joi.string().required().messages({
    "any.required": "El título es obligatorio.",
  }),
  director: Joi.string().allow("").optional(),
  descripcion: Joi.string().allow("").optional(),
  valuacion: Joi.number().integer().min(1).max(5).allow(null).optional().messages({
    'number.min': 'La valoración debe ser al menos 1',
    'number.max': 'La valoración no puede ser mayor a 5'
  })
});

router.get("/peliculas", async (req, res) => {
  const PAGE_SIZE = 20;
  try {
    const page = parseInt(req.query.page) || 1;

    const usuario = await usuarios.findOne({ _id: req.user.id });

    if (!usuario) {
      return res.status(404).json({
        error: true,
        mensaje: "Usuario no encontrado",
      });
    }

    const peliculasNormalizados = usuario.peliculas.map((pelicula) => ({
      id: pelicula._id || pelicula.id,
      titulo: pelicula.titulo,
      fecha: pelicula.fecha ? new Date(pelicula.fecha) : new Date(0),
      director: pelicula.director,
      descripcion: pelicula.descripcion,
      valuacion: pelicula.valuacion 
    }));

    const peliculasOrdenados = peliculasNormalizados.sort(
      (a, b) => b.fecha - a.fecha
    );

    const totalPeliculas = peliculasOrdenados.length;
    const startIndex = (page - 1) * PAGE_SIZE;

    const peliculasPaginados = peliculasOrdenados.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

    const totalPages = Math.ceil(totalPeliculas / PAGE_SIZE);

    res.status(200).json({
      peliculas: peliculasPaginados,
      totalPages,
      currentPage: page,
      totalPeliculas,
    });
  } catch (error) {
    res.status(400).json({
      error: true,
      mensaje: error.message,
    });
  }
});

router.get("/pelicula/:peliculaId", async (req, res) => {
  const userId = req.user.id;
  const peliculaId = req.params.peliculaId;
  const { fecha, titulo, director, descripcion } = req.body;

  try {
    const user = await usuarios.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const pelicula = user.peliculas.find(
      (pelicula) => pelicula._id.toString() === peliculaId
    );
    if (!pelicula) {
      return res
        .status(404)
        .json({ error: true, mensaje: "Pelicula no encontrada" });
    }
    res.json(pelicula);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

router.get("/pelicula/buscar/:texto", async (req, res) => {
  const PAGE_SIZE = 20;
  const userId = req.user.id;
  const texto = req.params.texto.toLowerCase().replace(/_/g, " ");
  const page = parseInt(req.query.page) || 1; // Obtenemos el número de página

  try {
    const user = await usuarios.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const peliculasEncontradas = user.peliculas.filter((pelicula) => {
      return (
        pelicula.titulo.toLowerCase().includes(texto) ||
        pelicula.director.toLowerCase().includes(texto) ||
        pelicula.descripcion.toLowerCase().includes(texto)
      );
    });

    if (peliculasEncontradas.length === 0) {
      return res.status(404).json({
        error: true,
        mensaje: "No se encontraron libros que coincidan con la búsqueda",
      });
    }

    const peliculasNormalizadas = peliculasEncontradas.map((pelicula) => ({
      id: pelicula._id || pelicula.id,
      fecha: pelicula.fecha ? new Date(pelicula.fecha) : new Date(0),
      titulo: pelicula.titulo,
      director: pelicula.director,
      descripcion: pelicula.descripcion,
      valuacion: pelicula.valuacion,
    }));

    const peliculasOrdenadas = peliculasNormalizadas.sort(
      (a, b) => b.fecha - a.fecha
    );

    const startIndex = (page - 1) * PAGE_SIZE;
    const peliculasPaginadas = peliculasOrdenadas.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );
    const totalPeliculas = peliculasOrdenadas.length;
    const totalPages = Math.ceil(totalPeliculas / PAGE_SIZE);

    res.status(200).json({
      peliculas: peliculasPaginadas,
      totalPages,
      currentPage: page,
      totalPeliculas,
      textoBuscado: texto,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

router.post("/carga-peliculas", async (req, res) => {
  try {
    const { error } = schemaCargaPeliculas.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        mensaje: error.details[0].message,
      });
    }

    const usuarioDB = await usuarios.findOne({ _id: req.user.id });
    const fechaActual = moment().startOf("day");
    const fechaPelicula = moment(req.body.fecha).startOf("day");

    if (fechaPelicula.isAfter(fechaActual)) {
      return res.status(400).json({
        error: true,
        mensaje:
          "La fecha de la película no puede ser posterior al día actual.",
      });
    }

    const nuevaPelicula = new Pelicula({
      fecha: fechaPelicula.toDate(),
      titulo: req.body.titulo,
      director: req.body.director,
      descripcion: req.body.descripcion,
      valuacion: req.body.valuacion || null,
    });

    usuarioDB.peliculas.push(nuevaPelicula);
    await usuarioDB.save();

    res.status(200).json({
      mensaje: "Película cargada correctamente",
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: true,
      mensaje: "Error en el servidor: " + error.message,
    });
  }
});

router.delete("/pelicula/:idPelicula", async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const peliculaId = req.params.idPelicula;

    const usuario = await usuarios.findById(usuarioId);

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const indicePelicula = usuario.peliculas.findIndex(
      (pelicula) => pelicula._id.toString() === peliculaId
    );

    if (indicePelicula === -1) {
      return res
        .status(404)
        .json({ mensaje: "pelicula no encontrada para este usuario" });
    }

    usuario.peliculas.splice(indicePelicula, 1);

    await usuario.save();

    res.json({ mensaje: "Pelicula eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
});

router.put("/pelicula/:peliculaId", async (req, res) => {
  const userId = req.user.id;
  const peliculaId = req.params.peliculaId;
  const { fecha, titulo, director, descripcion, valuacion } = req.body;

  try {
    const user = await usuarios.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const peliculaIndex = user.peliculas.findIndex(
      (pelicula) => pelicula._id.toString() === peliculaId
    );
    if (peliculaIndex === -1) {
      return res.status(404).json({ message: "pelicula no encontrado" });
    }

    if (!titulo) {
      return res
        .status(400)
        .json({
          message: "El campo título es obligatorio para editar una pelicula",
        });
    }

    if (fecha) {
      const fechaActual = moment().startOf("day");
      const fechaPelicula = moment(fecha).startOf("day");
      if (fechaPelicula.isAfter(fechaActual)) {
        return res
          .status(400)
          .json({
            message:
              "La fecha de la pelicula no puede ser posterior al día actual",
          });
      }
    }

    if (fecha) user.peliculas[peliculaIndex].fecha = fecha;
    if (titulo) user.peliculas[peliculaIndex].titulo = titulo;
    if (director) user.peliculas[peliculaIndex].director = director;
    if (descripcion) user.peliculas[peliculaIndex].descripcion = descripcion;
    if (valuacion !== undefined) user.peliculas[peliculaIndex].valuacion = valuacion; 

    await user.save();

    res.json({ message: "pelicula actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

module.exports = router;
