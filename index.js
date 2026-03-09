const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
require('dotenv').config();
const app = express();

const passport = require('./passport');

// cors
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://bibliotecamultimedia.onrender.com',
    'https://biblioteca-testing.onrender.com' ,
    'https://bibliotecamultimedia.com.ar',
    'https://www.bibliotecamultimedia.com.ar'
  ],
  credentials: true
}));

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

// Inicializar passport
app.use(passport.initialize());

const uri = process.env.MONGODB_URI;

mongoose.connect(uri, {
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log('Base de datos conectada'))
.catch(e => console.log('Error conectando a la base de datos:', e))

const authRoutes = require('./routes/auth');
const validaToken = require('./routes/validate-token');
const admin = require('./routes/admin');
const rutasLibros = require('./routes/librosRoute');
const rutasSeries = require('./routes/seriesRoute');
const rutasPeliculas = require('./routes/peliculasRoute');
const rutasPendientes = require('./routes/pendientesRoute');
const rutasUser = require('./routes/userRoute');

app.use('/api/auth', authRoutes); 
app.use('/api/admin', validaToken, admin);
app.use('/api/admin/user', validaToken, rutasUser);
app.use('/api/admin/user', validaToken, rutasLibros);
app.use('/api/admin/user', validaToken, rutasSeries);
app.use('/api/admin/user', validaToken, rutasPeliculas);
app.use('/api/admin/user', validaToken, rutasPendientes);

app.get('/', (req, res) => {
    res.json({
        estado: true,
        mensaje: 'funciona!'
    })
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`servidor andando en: ${PORT}`)
})