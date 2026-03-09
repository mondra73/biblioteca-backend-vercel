const mongoose = require("mongoose");

const libroSchema = mongoose.Schema({
  fecha: Date,
  titulo: String,
  autor: String,
  genero: String,
  descripcion: String,
  valuacion: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
});

module.exports = mongoose.model("Libro", libroSchema);
