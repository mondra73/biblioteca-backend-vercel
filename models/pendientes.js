const mongoose = require('mongoose');

const pendienteSchema = mongoose.Schema({
        titulo: String,
        autorDirector: String,
        descripcion: String,
        tipo: String,
        confirma: {
                type: Boolean,
                default: false
        }
})

module.exports = mongoose.model('Pendiente', pendienteSchema);