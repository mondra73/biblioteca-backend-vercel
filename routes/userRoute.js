const router = require('express').Router();
const usuarios = require('../models/Users');

router.get('/estadisticas', async (req, res) => {
  try {
    const allUsers = await usuarios.find();

    let topLibros = [];
    let topSeries = [];
    let topPeliculas = [];

    allUsers.forEach(usuario => {
      const numLibros = usuario.libros ? usuario.libros.length : 0;
      const numSeries = usuario.series ? usuario.series.length : 0;
      const numPeliculas = usuario.peliculas ? usuario.peliculas.length : 0;

      if (numLibros > 0) {
        topLibros.push({ nombre: usuario.name, cantidad: numLibros });
      }
      if (numSeries > 0) {
        topSeries.push({ nombre: usuario.name, cantidad: numSeries });
      }
      if (numPeliculas > 0) {
        topPeliculas.push({ nombre: usuario.name, cantidad: numPeliculas });
      }
    });

    const obtenerTop3 = (array) => {
      return array
        .sort((a, b) => b.cantidad - a.cantidad) 
        .slice(0, 3);
    };

    const top3Libros = obtenerTop3(topLibros);
    const top3Series = obtenerTop3(topSeries);
    const top3Peliculas = obtenerTop3(topPeliculas);

    const numUsuarios = allUsers.length;

    res.status(200).json({
      topLibros: top3Libros,
      topSeries: top3Series,
      topPeliculas: top3Peliculas,
      totalUsuarios: numUsuarios
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al obtener las estadísticas',
    });
  }
});


router.get('/estadisticas-libros/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;

    const usuario = await usuarios.findById(idUsuario);

    if (!usuario) {
      return res.status(404).json({
        error: true,
        mensaje: 'Usuario no encontrado',
      });
    }

    const numLibros = usuario.libros ? usuario.libros.length : 0;
    let sumaRatings = 0;
    let librosConRating = 0;

    if (usuario.libros && usuario.libros.length > 0) {
      usuario.libros.forEach(libro => {
        if (libro.valuacion !== null && libro.valuacion !== undefined) {
          sumaRatings += libro.valuacion;
          librosConRating++;
        }
      });
    }

    let promedioRating = 0;
    if (librosConRating > 0) {
      promedioRating = sumaRatings / librosConRating;
      promedioRating = Math.round(promedioRating * 10) / 10;
    }

    res.status(200).json({
      usuario: {
        id: usuario._id,
        nombre: usuario.name,
      },
      totalLibros: numLibros,
      promedioRating: promedioRating,
      totalLibrosConRating: librosConRating,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al obtener las estadísticas del usuario',
    });
  }
});

router.get('/estadisticas-peliculas/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;

    const usuario = await usuarios.findById(idUsuario);

    if (!usuario) {
      return res.status(404).json({
        error: true,
        mensaje: 'Usuario no encontrado',
      });
    }

    const numPeliculas = usuario.peliculas ? usuario.peliculas.length : 0;
    let sumaRatings = 0;
    let peliculasConRating = 0;

    if (usuario.peliculas && usuario.peliculas.length > 0) {
      usuario.peliculas.forEach(pelicula => {
        if (pelicula.valuacion !== null && pelicula.valuacion !== undefined) {
          sumaRatings += pelicula.valuacion;
          peliculasConRating++;
        }
      });
    }

    let promedioRating = 0;
    if (peliculasConRating > 0) {
      promedioRating = sumaRatings / peliculasConRating;
      promedioRating = Math.round(promedioRating * 10) / 10;
    }

    res.status(200).json({
      usuario: {
        id: usuario._id,
        nombre: usuario.name,
      },
      totalPeliculas: numPeliculas,
      promedioRating: promedioRating,
      totalPeliculasConRating: peliculasConRating,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al obtener las estadísticas de películas del usuario',
    });
  }
});

router.get('/estadisticas-series/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;

    const usuario = await usuarios.findById(idUsuario);

    if (!usuario) {
      return res.status(404).json({
        error: true,
        mensaje: 'Usuario no encontrado',
      });
    }

    const numSeries = usuario.series ? usuario.series.length : 0;
    let sumaRatings = 0;
    let seriesConRating = 0;

    if (usuario.series && usuario.series.length > 0) {
      usuario.series.forEach(serie => {
        if (serie.valuacion !== null && serie.valuacion !== undefined) {
          sumaRatings += serie.valuacion;
          seriesConRating++;
        }
      });
    }

    let promedioRating = 0;
    if (seriesConRating > 0) {
      promedioRating = sumaRatings / seriesConRating;
      promedioRating = Math.round(promedioRating * 10) / 10;
    }

    res.status(200).json({
      usuario: {
        id: usuario._id,
        nombre: usuario.name,
      },
      totalSeries: numSeries,
      promedioRating: promedioRating,
      totalSeriesConRating: seriesConRating,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al obtener las estadísticas de series del usuario',
    });
  }
});

//----------------------------------------------------------------

router.get('/estadisticas-user', async (req, res) => {
  try {
    const usuario = await usuarios.findById(req.user.id);

    const numLibros = usuario.libros.length;
    const numSeries = usuario.series.length;
    const numPeliculas = usuario.peliculas.length;
    const numPendientes = usuario.pendientes.length;

    res.status(200).json({
      libros: numLibros,
      series: numSeries,
      peliculas: numPeliculas,
      pendientes: numPendientes 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al obtener las estadísticas del usuario',
    });
  }
});

router.post('/movimiento', async (req, res) => {
  
  try {
    const { fecha, titulo, autor, genero, descripcion, pendienteId } = req.body;

    if (!fecha || !titulo ) {
        return res.status(400).json({ message: "Faltan datos del libro." });
    }

    const usuarioDB = await usuarios.findOne({ _id: req.user.id });

    const nuevoLibro = {
        fecha,
        titulo,
        autor,
        genero,
        descripcion
    };
  
    usuarioDB.libros.push(nuevoLibro);
    console.log(usuarioDB.pendientes)
    
     const indicePendiente = usuarioDB.pendientes.findIndex(pendiente => pendiente._id.toString() === pendienteId);

     if (indicePendiente === -1) {
       return res.status(404).json({ mensaje: 'Pendiente no encontrado para este usuario' });
     }
 
     usuarioDB.pendientes.splice(indicePendiente, 1);
 
     await usuarioDB.save();

    res.status(200).json({ message: "El libro ha sido agregado y eliminado de pendientes correctamente." });
} catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res.status(500).json({ message: "Ha ocurrido un error al procesar la solicitud." });
}
});

module.exports = router;