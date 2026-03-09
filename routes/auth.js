const router = require("express").Router();
const User = require("../models/Users");
const bcrypt = require("bcrypt");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const usuarios = require("../models/Users");
const validaToken = require("./validate-token");
const enviarEmail = require("./mails");
const getEmailTemplate  = require("../email-template/registro-exitoso");
const generarEmailRecuperacion = require('../email-template/recuperar-password');
const contactoAdminTemplate = require('../email-template/contacto-admin');
const contactoUsuarioTemplate = require('../email-template/contacto-usuario')
const rateLimit = require("express-rate-limit");
const admin = require('firebase-admin');
const passport = require('../passport');
const { OAuth2Client } = require('google-auth-library');

try {
  if (!process.env.FIREBASE_CONFIG_BASE64) {
    throw new Error('FIREBASE_CONFIG_BASE64 no está definida');
  }

  const firebaseConfigJson = Buffer
    .from(process.env.FIREBASE_CONFIG_BASE64, 'base64')
    .toString('utf-8');

  const firebaseConfig = JSON.parse(firebaseConfigJson);

  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig)
  });

  console.log('✅ Firebase Admin inicializado desde variables de entorno');

} catch (error) {
  console.warn('⚠️ Error inicializando Firebase:', error.message);
  console.log('⚠️ El login con Google no funcionará hasta resolver esto');
}

const customMessages = {
  "string.base": "{{#label}} debe ser una cadena",
  "string.min": "{{#label}} debe tener al menos {#limit} caracteres",
  "string.max": "{{#label}} debe tener como máximo {#limit} caracteres",
  "string.email": "El formato de {{#label}} no es válido",
  "string.empty": "El nombre no puede estar vacío",
  "any.required": "{{#label}} es un campo requerido",
  "any.only": "{{#label}} debe coincidir con {{#other}}",
  "string.pattern.base": "{{#label}} debe contener solo letras sin espacios",
};

const schemaRegister = Joi.object({
  name: Joi.string()
    .min(4)
    .max(255)
    .required()
    .pattern(new RegExp("^[A-Za-z]+$"))
    .messages(customMessages),
  email: Joi.string()
    .min(6)
    .max(255)
    .required()
    .email()
    .messages(customMessages),
  password1: Joi.string().min(6).max(1024).required().messages(customMessages),
  password2: Joi.string()
    .valid(Joi.ref("password1"))
    .required()
    .label("Confirmación de contraseña")
    .messages({ "any.only": "{{#label}} debe coincidir con la contraseña" }),
});

const schemaLogin = Joi.object({
  email: Joi.string()
    .min(6)
    .max(255)
    .required()
    .email()
    .messages(customMessages),
  password: Joi.string().min(6).max(1024).required().messages(customMessages),
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.get('/google',
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false 
    })
);

router.get('/google/callback',
    passport.authenticate('google', { 
        failureRedirect: process.env.FRONTEND_URL + '/login?error=auth_failed',
        session: false 
    }),
    async (req, res) => {
        try {
            const accessToken = generateAccessToken(req.user);
            const refreshToken = generateRefreshToken(req.user, false);

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000,
            });

            res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${accessToken}&name=${encodeURIComponent(req.user.name)}`);
        } catch (error) {
            console.error('Error en callback de Google:', error);
            res.redirect(process.env.FRONTEND_URL + '/login?error=auth_failed');
        }
    }
);

router.post('/google/token', async (req, res) => {
    try {
        const { googleToken } = req.body;
        
        if (!googleToken) {
            return res.status(400).json({ error: "Token de Google requerido" });
        }

        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        let user = await User.findOne({ 
            $or: [
                { googleId },
                { email, authProvider: 'google' }
            ]
        });

        if (!user) {
            user = await User.findOne({ email });
            
            if (user) {
                user.googleId = googleId;
                user.authProvider = 'google';
                user.avatar = picture;
                user.verificado = true;
                await user.save();
            } else {
                user = new User({
                    googleId,
                    name,
                    email,
                    avatar: picture,
                    authProvider: 'google',
                    verificado: true
                });
                await user.save();
            }
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user, false);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.json({
            error: null,
            data: { 
                token: accessToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                }
            }
        });

    } catch (error) {
        console.error('Error en autenticación con Google:', error);
        res.status(400).json({ error: "Error en autenticación con Google" });
    }
});

router.post('/google/firebase', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: "Token de Firebase requerido" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    let user = await User.findOne({ 
      $or: [
        { googleId: uid },
        { email: email.toLowerCase() }
      ]
    });
    if (!user) {
      try {
        user = new User({
          googleId: uid,
          name: name,
          email: email.toLowerCase(),
          avatar: picture,
          authProvider: 'google',
          verificado: true
        });
        
        await user.save();
        
        setTimeout(async () => {
          try {
            const asunto = "¡Bienvenido a Biblioteca Multimedia!";
            const cuerpoHTML = getEmailTemplate(name);
            
            const resultado = await enviarEmail(email, asunto, cuerpoHTML, true);
            if (resultado.success) {
              console.log(`✅ Correo de bienvenida enviado a: ${email}`);
            } else {
              console.warn(`⚠️ Error al enviar correo a: ${email}`, resultado.message);
            }
          } catch (emailError) {
            console.error(`❌ Error en envío de correo:`, emailError);
          }
        }, 0);
        
      } catch (registerError) {
        console.error('Error al registrar usuario automáticamente:', registerError);
        return res.status(500).json({ error: "Error al crear usuario automáticamente" });
      }
    } else {
      if (!user.googleId) {
        user.googleId = uid;
        user.authProvider = 'google';
        user.avatar = picture;
        user.verificado = true;
        await user.save();
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, false);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      error: null,
      data: { 
        token: accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      }
    });

  } catch (error) {
    console.error('Error en autenticación con Firebase:', error);
    res.status(401).json({ error: "Token de Firebase inválido o expirado" });
  }
});

//-------------------------------

router.post("/login", async (req, res) => {
  const { email, password, rememberMe } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(400).json({ error: "Usuario no registrado" });

  if (user.authProvider === 'google') {
    return res.status(400).json({ 
      error: "Este usuario se registró con Google. Por favor, usa el botón de Google para iniciar sesión." 
    });
  }

  if (!user.password) {
    return res.status(400).json({ 
      error: "Este usuario no tiene contraseña configurada. Usa el login con Google." 
    });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res.status(400).json({ error: "Credenciales inválidas" });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user, rememberMe);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, 
  });

  res.json({
    error: null,
    data: { token: accessToken },
    name: user.name,
  });
});

router.post("/refresh-token", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "No hay refresh token" });

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Refresh token inválido o expirado" });

    const newAccessToken = generateAccessToken({ _id: user.id, name: user.name });
    res.json({ token: newAccessToken });
  });
});

router.post("/register", async (req, res) => {
  const { name, email, password1, password2, authProvider } = req.body;

  const { error } = schemaRegister.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  if (authProvider === 'google') {
    return res.status(400).json({ error: "Registro Google no permitido aquí" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existeElEmail = await User.findOne({ email: normalizedEmail });
  if (existeElEmail) {
    return res.status(400).json({ error: "Email ya registrado" });
  }

  try {
    const userData = {
      name,
      email: normalizedEmail,
      authProvider: 'local',
      verificado: false
    };

    const saltos = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(password1, saltos);

    const user = new User(userData);
    const userDB = await user.save();

    setTimeout(async () => {
      try {
        const asunto = "¡Bienvenido a Biblioteca Multimedia!";
        const cuerpoHTML = getEmailTemplate(name);
        await enviarEmail(normalizedEmail, asunto, cuerpoHTML, true);
      } catch (emailError) {
        console.error("Error enviando email:", emailError);
      }
    }, 0);

    res.json({
      error: null,
      data: {
        message: "Usuario registrado exitosamente.",
        user: {
          id: userDB._id,
          name: userDB.name,
          email: userDB.email
        }
      }
    });

  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Hubo un error al registrar el usuario" });
  }
});


router.post("/confirmar/", async (req, res) => {
  try {
    const { mail, token } = req.body;

    const usuario = await User.findOne({ email: mail });
    if (!usuario) {
      return res
        .status(404)
        .json({ error: true, mensaje: "Email no registrado" });
    }

    if (token !== usuario.token) {
      return res.status(401).json({ error: true, mensaje: "Token no válido" });
    }

    usuario.verificado = true;
    await usuario.save();

    res.json({ error: null, mensaje: "Usuario verificado correctamente" });
  } catch (error) {
    console.error("Error al verificar usuario:", error);
    res
      .status(500)
      .json({ error: true, mensaje: "Error al verificar usuario" });
  }
});

router.post("/cambiar-password", [validaToken], async (req, res) => {
  const { contrasenaActual, nuevaContrasena, nuevaContrasena2 } = req.body;

  try {
    const usuarioDB = await usuarios.findOne({ _id: req.user.id });

    if (!usuarioDB) {
      return res.status(404).json({ error: "Usuario no encontrada" });
    }

    const contrasenaValida = await bcrypt.compare(
      contrasenaActual,
      usuarioDB.password
    );
    if (!contrasenaValida) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    if (nuevaContrasena !== nuevaContrasena2) {
      return res.status(401).json({ error: "Contraseñas nuevas diferentes" });
    }

    const saltos = await bcrypt.genSalt(10);
    const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, saltos);

    usuarioDB.password = nuevaContrasenaHash;
    await usuarioDB.save();

    res.json({
      mensaje: "Contraseña cambiada exitosamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

//para el que se la olvido y se envio el link por mail
router.post("/restablecer-password", async (req, res) => {
  const { mail, nuevaContrasena, nuevaContrasena2 } = req.body;

  try {
    const usuarioDB = await usuarios.findOne({ email: mail });

    if (!usuarioDB) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (nuevaContrasena !== nuevaContrasena2) {
      return res.status(401).json({ error: "Contraseñas nuevas diferentes" });
    }

    const saltos = await bcrypt.genSalt(10);
    const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, saltos);

    usuarioDB.password = nuevaContrasenaHash;
    await usuarioDB.save();

    const nombreUsuario = usuarioDB.name;

    res.json({
      mensaje: "Contraseña restablecida exitosamente",
      nombre: nombreUsuario,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

const passwordResetLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1, 
  message: {
    error: "Debes esperar 5 minutos antes de solicitar otro restablecimiento"
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Demasiadas solicitudes. Intenta nuevamente en 5 minutos"
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// inicia el proceso de recuperacion de contraseña olvidada
router.post("/olvido-password", passwordResetLimiter, async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(200).json({ 
        message: "Si el email existe, se ha enviado un enlace de restablecimiento" 
      });
    }

    if (user.tokenCreatedAt && Date.now() - user.tokenCreatedAt.getTime() < 5 * 60 * 1000) {
      return res.status(200).json({ 
        message: "Si el email existe, se ha enviado un enlace de restablecimiento" 
      });
    }

    const token = generateResetToken(user);

    user.token = token;
    user.tokenCreatedAt = new Date();
    await user.save();

    const url = process.env.URLUSER;
    const destinatario = user.email;
    const asunto = "Restablecer contraseña - Biblioteca Multimedia";
    const urlRecuperacion = `${url}/nuevo-password/${encodeURIComponent(destinatario)}/${token}`;
    
    const htmlContent = generarEmailRecuperacion(user.name, urlRecuperacion);

    enviarEmail(destinatario, asunto, htmlContent, true);

    res.status(200).json({ 
      message: "Si el email existe, se ha enviado un enlace de restablecimiento" 
    });
  } catch (error) {
    console.error("Error al procesar la solicitud de restablecimiento:", error);
    res.status(500).json({ 
      error: "Error al procesar la solicitud de restablecimiento" 
    });
  }
});

const generateResetToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      purpose: 'password_reset',
      timestamp: Date.now() 
    },
    process.env.TOKEN_SECRET,
    { expiresIn: "1h" } 
  );
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name },
    process.env.TOKEN_SECRET,
    { expiresIn: "15m" } // corto
  );
};

const generateRefreshToken = (user, rememberMe) => {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_SECRET,
    { expiresIn: rememberMe ? "30d" : "1d" }
  );
};

router.get("/ping", (req, res) => {
  res.status(200).json({ mensaje: "ok" });
});

const contactoLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 1, 
  message: {
    success: false,
    message: "Debes esperar 5 minutos antes de enviar otro mensaje de contacto"
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ipKey = rateLimit.ipKeyGenerator(req);
    return ipKey + (req.body.email || '');
  }
});

router.post('/contacto', contactoLimiter, async (req, res) => {
  try {
    const { nombre, email, telefono, asunto, mensaje } = req.body;

    if (!nombre || !email || !asunto || !mensaje) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser completados'
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa un email válido'
      });
    }

    const fechaEnvio = new Date().toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const datosContacto = {
      nombre,
      email,
      telefono: telefono || 'No proporcionado',
      asunto,
      mensaje,
      fechaEnvio
    };

    const emailAdminHtml = contactoAdminTemplate(datosContacto);

    const resultadoAdmin = await enviarEmail(
      "biblotecamultimedia@gmail.com", 
      `Nuevo mensaje de contacto: ${asunto}`,
      emailAdminHtml,
      true 
    );

    if (!resultadoAdmin.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el mensaje. Por favor, intenta nuevamente.'
      });
    }

    const emailUsuarioHtml = contactoUsuarioTemplate(datosContacto);

    const resultadoUsuario = await enviarEmail(
      email,
      'Confirmación de recepción de mensaje - Entertainment Hub',
      emailUsuarioHtml,
      true
    );

    if (!resultadoUsuario.success) {
      console.warn('No se pudo enviar email de confirmación al usuario, pero el mensaje fue recibido');
    }

    res.status(200).json({
      success: true,
      message: 'Mensaje enviado correctamente'
    });

  } catch (error) {
    console.error('Error enviando mensaje de contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar el mensaje. Por favor, intenta nuevamente.'
    });
  }
});

module.exports = router;
