const mongoose = require('mongoose');
const librosSchema = require('../models/libros');
const peliculasSchema = require('../models/peliculas');
const seriesSchema = require('../models/series');
const pendientesSchema = require('../models/pendientes');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 4,
        max: 255
    },
    email: {
        type: String,
        required: true,
        min: 4,
        max: 255,
        unique: true
    },
    password: {
        type: String,
        minlength: 6,
        required: function() {
            return !this.googleId; 
        }
    },
    googleId: {
        type: String,
        sparse: true 
    },
    avatar: {
        type: String
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    libros: [librosSchema.schema],
    peliculas: [peliculasSchema.schema],
    series: [seriesSchema.schema],
    pendientes: [pendientesSchema.schema],
    date: {
        type: Date,
        default: Date.now
    },
    verificado: {
        type: Boolean,
        default: function() {
            return this.authProvider === 'google'; 
        }
    },
    token: String,
    tokenCreatedAt: Date 
});

userSchema.index({ googleId: 1 }, { sparse: true, unique: true });

module.exports = mongoose.model('User', userSchema);