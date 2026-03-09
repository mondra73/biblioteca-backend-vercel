const router = require("express").Router();
const moment = require("moment");
const Joi = require("@hapi/joi");

const usuarios = require("../models/Users");
const Serie = require("../models/series");

const schemaCargaSeries = Joi.object({
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

router.get("/series", async (req, res) => {
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

    const seriesNormalizados = usuario.series.map((serie) => ({
      id: serie._id || serie.id,
      titulo: serie.titulo,
      fecha: serie.fecha ? new Date(serie.fecha) : new Date(0),
      director: serie.director,
      descripcion: serie.descripcion,
      valuacion: serie.valuacion
    }));

    const seriesOrdenadas = seriesNormalizados.sort(
      (a, b) => b.fecha - a.fecha
    );

    const totalSeries = seriesOrdenadas.length;

    const startIndex = (page - 1) * PAGE_SIZE;

    const seriesPaginadas = seriesOrdenadas.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

    const totalPages = Math.ceil(totalSeries / PAGE_SIZE);

    res.status(200).json({
      series: seriesPaginadas,
      totalPages,
      currentPage: page,
      totalSeries,
    });
  } catch (error) {
    res.json("400", {
      error: true,
      mensaje: error.message,
    });
  }
});

router.get("/serie/:serieId", async (req, res) => {
  const userId = req.user.id;
  const serieId = req.params.serieId;
  const { fecha, titulo, director, descripcion } = req.body;

  try {
    const user = await usuarios.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const serie = user.series.find((serie) => serie._id.toString() === serieId);
    if (!serie) {
      return res
        .status(404)
        .json({ error: true, mensaje: "Serie no encontrada" });
    }
    res.json(serie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

router.get("/serie/buscar/:texto", async (req, res) => {
  const PAGE_SIZE = 20;
  const userId = req.user.id;
  const texto = req.params.texto.toLowerCase().replace(/_/g, " ");
  const page = parseInt(req.query.page) || 1; 

  try {
    const user = await usuarios.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const seriesEncontradas = user.series.filter((serie) => {
      return (
        serie.titulo.toLowerCase().includes(texto) ||
        serie.director.toLowerCase().includes(texto) ||
        serie.descripcion.toLowerCase().includes(texto)
      );
    });

    if (seriesEncontradas.length === 0) {
      return res.status(404).json({
        error: true,
        mensaje: "No se encontraron libros que coincidan con la búsqueda",
      });
    }
    const seriesNormalizadas = seriesEncontradas.map((serie) => ({
      id: serie._id || serie.id,
      fecha: serie.fecha ? new Date(serie.fecha) : new Date(0),
      titulo: serie.titulo,
      director: serie.director,
      descripcion: serie.descripcion,
      valuacion: serie.valuacion,
    }));

    const seriesOrdenadas = seriesNormalizadas.sort(
      (a, b) => b.fecha - a.fecha
    );

    const startIndex = (page - 1) * PAGE_SIZE;
    const seriesPaginadas = seriesOrdenadas.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );
    const totalSeries = seriesOrdenadas.length;
    const totalPages = Math.ceil(totalSeries / PAGE_SIZE);

    res.status(200).json({
      series: seriesPaginadas,
      totalPages,
      currentPage: page,
      totalSeries,
      textoBuscado: texto, 
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

router.post("/carga-series", async (req, res) => {
  try {
    const { error } = schemaCargaSeries.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        mensaje: error.details[0].message,
      });
    }

    const usuarioDB = await usuarios.findOne({ _id: req.user.id });

    const fechaActual = moment().startOf("day"); 

    const fechaSerie = moment(req.body.fecha).startOf("day"); 

    if (fechaSerie.isAfter(fechaActual)) {
      return res.status(400).json({
        error: true,
        mensaje: "La fecha de la serie no puede ser posterior al día actual.",
      });
    }

    const serie = new Serie({
      fecha: fechaSerie.toDate(),
      titulo: req.body.titulo,
      director: req.body.director,
      descripcion: req.body.descripcion,
      valuacion: req.body.valuacion || null,
    });

    usuarioDB.series.push(serie);

    await usuarioDB.save();

    res.json("200", {
      mensaje: "Serie cargada correctamente",
    });
  } catch (error) {
    console.log(error);
    res.json("400", {
      error: true,
      mensaje: error,
    });
  }
});

router.delete("/serie/:idSerie", async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const serieId = req.params.idSerie;

    const usuario = await usuarios.findById(usuarioId);

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const indiceSerie = usuario.series.findIndex(
      (serie) => serie._id.toString() === serieId
    );

    if (indiceSerie === -1) {
      return res
        .status(404)
        .json({ mensaje: "Serie no encontrada para este usuario" });
    }

    usuario.series.splice(indiceSerie, 1);

    await usuario.save();

    res.json({ mensaje: "Serie eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
});

router.put("/serie/:serieId", async (req, res) => {
  const userId = req.user.id;
  const serieId = req.params.serieId;
  const { fecha, titulo, director, descripcion, valuacion } = req.body;

  try {
    const user = await usuarios.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const serieIndex = user.series.findIndex(
      (serie) => serie._id.toString() === serieId
    );
    if (serieIndex === -1) {
      return res.status(404).json({ message: "serie no encontrado" });
    }

    if (!titulo) {
      return res
        .status(400)
        .json({
          message: "El campo título es obligatorio para editar una serie",
        });
    }

    if (fecha) {
      const fechaActual = moment().startOf("day");
      const fechaSerie = moment(fecha).startOf("day");
      if (fechaSerie.isAfter(fechaActual)) {
        return res
          .status(400)
          .json({
            message:
              "La fecha de la serie no puede ser posterior al día actual",
          });
      }
    }

    if (fecha) user.series[serieIndex].fecha = fecha;
    if (titulo) user.series[serieIndex].titulo = titulo;
    if (director) user.series[serieIndex].director = director;
    if (descripcion) user.series[serieIndex].descripcion = descripcion;
    if (valuacion !== undefined) user.series[serieIndex].valuacion = valuacion;

    await user.save();

    res.json({ message: "Serie actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

module.exports = router;
