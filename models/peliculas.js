const mongoose = require('mongoose');

const peliculaSchema = mongoose.Schema({
        fecha: Date,
        titulo: String,
        director: String,
        descripcion: String,
        valuacion: {
                type: Number,
                min: 1,
                max: 5,
                default: null,
        },
})

module.exports = mongoose.model('Pelicula', peliculaSchema);