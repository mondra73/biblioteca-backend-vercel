const connectDB = require('../../lib/db');
const { handleCors } = require('../../lib/cors');
const User = require('../../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('@hapi/joi');
const { OAuth2Client } = require('google-auth-library');
const admin = require('firebase-admin');

// ── Firebase Admin (singleton) ─────────────────────────────────────────────
if (!admin.apps.length) {
  try {
    const firebaseConfigJson = Buffer
      .from(process.env.FIREBASE_CONFIG_BASE64, 'base64')
      .toString('utf-8');
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(firebaseConfigJson)),
    });
  } catch (e) {
    console.warn('⚠️ Firebase Admin no inicializado:', e.message);
  }
}

// ── Helpers JWT ────────────────────────────────────────────────────────────
const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, name: user.name }, process.env.TOKEN_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (user, rememberMe) =>
  jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, {
    expiresIn: rememberMe ? '30d' : '1d',
  });

const generateResetToken = (user) =>
  jwt.sign(
    { id: user._id, purpose: 'password_reset', timestamp: Date.now() },
    process.env.TOKEN_SECRET,
    { expiresIn: '1h' }
  );

// ── Schemas Joi ────────────────────────────────────────────────────────────
const schemaRegister = Joi.object({
  name: Joi.string().min(4).max(255).required().pattern(/^[A-Za-z]+$/),
  email: Joi.string().min(6).max(255).required().email(),
  password1: Joi.string().min(6).max(1024).required(),
  password2: Joi.string().valid(Joi.ref('password1')).required(),
});

// ── Handler principal ──────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  await connectDB();

  // Extraer sub-ruta: /api/auth/login → "login"
  const url = req.url.replace(/^\/api\/auth\/?/, '').split('?')[0];
  const method = req.method;

  // ── POST /api/auth/login ────────────────────────────────────────────────
  if (url === 'login' && method === 'POST') {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Usuario no registrado' });

    if (user.authProvider === 'google')
      return res.status(400).json({ error: 'Este usuario se registró con Google. Usá el botón de Google.' });

    if (!user.password)
      return res.status(400).json({ error: 'Este usuario no tiene contraseña. Usá el login con Google.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Credenciales inválidas' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, rememberMe);

    res.setHeader('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=None; Max-Age=${rememberMe ? 30 * 24 * 3600 : 24 * 3600}; Path=/`);
    return res.json({ error: null, data: { token: accessToken }, name: user.name });
  }

  // ── POST /api/auth/register ─────────────────────────────────────────────
  if (url === 'register' && method === 'POST') {
    const { name, email, password1, password2, authProvider } = req.body;

    const { error } = schemaRegister.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    if (authProvider === 'google')
      return res.status(400).json({ error: 'Registro Google no permitido aquí' });

    const normalizedEmail = email.toLowerCase().trim();
    const existe = await User.findOne({ email: normalizedEmail });
    if (existe) return res.status(400).json({ error: 'Email ya registrado' });

    try {
      const saltos = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password1, saltos);

      const user = new User({ name, email: normalizedEmail, password: passwordHash, authProvider: 'local', verificado: false });
      const userDB = await user.save();

      // Email bienvenida (no bloqueante)
      try {
        const enviarEmail = require('../../lib/mailer');
        const getEmailTemplate = require('../../email-template/registro-exitoso');
        await enviarEmail(normalizedEmail, '¡Bienvenido a Biblioteca Multimedia!', getEmailTemplate(name), true);
      } catch (e) { console.warn('Email bienvenida no enviado:', e.message); }

      return res.json({ error: null, data: { message: 'Usuario registrado exitosamente.', user: { id: userDB._id, name: userDB.name, email: userDB.email } } });
    } catch (e) {
      return res.status(500).json({ error: 'Error al registrar el usuario' });
    }
  }

  // ── POST /api/auth/refresh-token ────────────────────────────────────────
  if (url === 'refresh-token' && method === 'POST') {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/refreshToken=([^;]+)/);
    const refreshToken = match ? match[1] : null;

    if (!refreshToken) return res.status(401).json({ error: 'No hay refresh token' });

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
      const newAccessToken = generateAccessToken({ _id: decoded.id, name: decoded.name });
      return res.json({ token: newAccessToken });
    } catch (e) {
      return res.status(403).json({ error: 'Refresh token inválido o expirado' });
    }
  }

  // ── POST /api/auth/confirmar ────────────────────────────────────────────
  if (url === 'confirmar' && method === 'POST') {
    try {
      const { mail, token } = req.body;
      const usuario = await User.findOne({ email: mail });
      if (!usuario) return res.status(404).json({ error: true, mensaje: 'Email no registrado' });
      if (token !== usuario.token) return res.status(401).json({ error: true, mensaje: 'Token no válido' });

      usuario.verificado = true;
      await usuario.save();
      return res.json({ error: null, mensaje: 'Usuario verificado correctamente' });
    } catch (e) {
      return res.status(500).json({ error: true, mensaje: 'Error al verificar usuario' });
    }
  }

  // ── POST /api/auth/olvido-password ──────────────────────────────────────
  if (url === 'olvido-password' && method === 'POST') {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email: email.toLowerCase().trim() });

      if (!user || (user.tokenCreatedAt && Date.now() - user.tokenCreatedAt.getTime() < 5 * 60 * 1000)) {
        return res.status(200).json({ message: 'Si el email existe, se ha enviado un enlace de restablecimiento' });
      }

      const token = generateResetToken(user);
      user.token = token;
      user.tokenCreatedAt = new Date();
      await user.save();

      try {
        const enviarEmail = require('../../lib/mailer');
        const generarEmailRecuperacion = require('../../email-template/recuperar-password');
        const urlRecuperacion = `${process.env.URLUSER}/nuevo-password/${encodeURIComponent(user.email)}/${token}`;
        await enviarEmail(user.email, 'Restablecer contraseña - Biblioteca Multimedia', generarEmailRecuperacion(user.name, urlRecuperacion), true);
      } catch (e) { console.warn('Email recuperación no enviado:', e.message); }

      return res.status(200).json({ message: 'Si el email existe, se ha enviado un enlace de restablecimiento' });
    } catch (e) {
      return res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
  }

  // ── POST /api/auth/restablecer-password ─────────────────────────────────
  if (url === 'restablecer-password' && method === 'POST') {
    const { mail, nuevaContrasena, nuevaContrasena2 } = req.body;
    try {
      const usuario = await User.findOne({ email: mail });
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      if (nuevaContrasena !== nuevaContrasena2) return res.status(401).json({ error: 'Contraseñas nuevas diferentes' });

      const saltos = await bcrypt.genSalt(10);
      usuario.password = await bcrypt.hash(nuevaContrasena, saltos);
      await usuario.save();

      return res.json({ mensaje: 'Contraseña restablecida exitosamente', nombre: usuario.name });
    } catch (e) {
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // ── POST /api/auth/cambiar-password ─────────────────────────────────────
  if (url === 'cambiar-password' && method === 'POST') {
    const verifyToken = require('../../lib/verifyToken');
    const ok = await verifyToken(req, res);
    if (!ok) return;

    const { contrasenaActual, nuevaContrasena, nuevaContrasena2 } = req.body;
    try {
      const usuario = await User.findById(req.user.id);
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

      const valida = await bcrypt.compare(contrasenaActual, usuario.password);
      if (!valida) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      if (nuevaContrasena !== nuevaContrasena2) return res.status(401).json({ error: 'Contraseñas nuevas diferentes' });

      const saltos = await bcrypt.genSalt(10);
      usuario.password = await bcrypt.hash(nuevaContrasena, saltos);
      await usuario.save();

      return res.json({ mensaje: 'Contraseña cambiada exitosamente' });
    } catch (e) {
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // ── POST /api/auth/google/token ─────────────────────────────────────────
  if (url === 'google/token' && method === 'POST') {
    const { googleToken } = req.body;
    if (!googleToken) return res.status(400).json({ error: 'Token de Google requerido' });

    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({ idToken: googleToken, audience: process.env.GOOGLE_CLIENT_ID });
      const { sub: googleId, email, name, picture } = ticket.getPayload();

      let user = await User.findOne({ $or: [{ googleId }, { email, authProvider: 'google' }] });
      if (!user) {
        user = await User.findOne({ email });
        if (user) {
          user.googleId = googleId; user.authProvider = 'google'; user.avatar = picture; user.verificado = true;
          await user.save();
        } else {
          user = await new User({ googleId, name, email, avatar: picture, authProvider: 'google', verificado: true }).save();
        }
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user, false);
      res.setHeader('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=None; Max-Age=${24 * 3600}; Path=/`);

      return res.json({ error: null, data: { token: accessToken, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } } });
    } catch (e) {
      return res.status(400).json({ error: 'Error en autenticación con Google' });
    }
  }

  // ── POST /api/auth/google/firebase ──────────────────────────────────────
  if (url === 'google/firebase' && method === 'POST') {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Token de Firebase requerido' });

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const { uid, email, name, picture } = decoded;

      let user = await User.findOne({ $or: [{ googleId: uid }, { email: email.toLowerCase() }] });
      if (!user) {
        user = await new User({ googleId: uid, name, email: email.toLowerCase(), avatar: picture, authProvider: 'google', verificado: true }).save();

        // Email bienvenida (no bloqueante)
        try {
          const enviarEmail = require('../../lib/mailer');
          const getEmailTemplate = require('../../email-template/registro-exitoso');
          await enviarEmail(email, '¡Bienvenido a Biblioteca Multimedia!', getEmailTemplate(name), true);
        } catch (e) { console.warn('Email bienvenida no enviado:', e.message); }
      } else if (!user.googleId) {
        user.googleId = uid; user.authProvider = 'google'; user.avatar = picture; user.verificado = true;
        await user.save();
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user, false);
      res.setHeader('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=None; Max-Age=${24 * 3600}; Path=/`);

      return res.json({ error: null, data: { token: accessToken, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } } });
    } catch (e) {
      return res.status(401).json({ error: 'Token de Firebase inválido o expirado' });
    }
  }

  // ── POST /api/auth/contacto ─────────────────────────────────────────────
  if (url === 'contacto' && method === 'POST') {
    try {
      const { nombre, email, telefono, asunto, mensaje } = req.body;
      if (!nombre || !email || !asunto || !mensaje)
        return res.status(400).json({ success: false, message: 'Todos los campos obligatorios deben completarse' });

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        return res.status(400).json({ success: false, message: 'Email inválido' });

      const fechaEnvio = new Date().toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const datosContacto = { nombre, email, telefono: telefono || 'No proporcionado', asunto, mensaje, fechaEnvio };

      const enviarEmail = require('../../lib/mailer');
      const contactoAdminTemplate = require('../../email-template/contacto-admin');
      const contactoUsuarioTemplate = require('../../email-template/contacto-usuario');

      const resultadoAdmin = await enviarEmail('biblotecamultimedia@gmail.com', `Nuevo mensaje de contacto: ${asunto}`, contactoAdminTemplate(datosContacto), true);
      if (!resultadoAdmin.success)
        return res.status(500).json({ success: false, message: 'Error al enviar el mensaje' });

      await enviarEmail(email, 'Confirmación de recepción - Entertainment Hub', contactoUsuarioTemplate(datosContacto), true).catch(() => {});

      return res.status(200).json({ success: true, message: 'Mensaje enviado correctamente' });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Error al enviar el mensaje' });
    }
  }

  // ── GET /api/auth/ping ──────────────────────────────────────────────────
  if (url === 'ping' && method === 'GET') {
    return res.status(200).json({ mensaje: 'ok' });
  }

  // ── GET /api/auth/google (OAuth redirect) ───────────────────────────────
  if (url === 'google' && method === 'GET') {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL)}&` +
      `response_type=code&scope=profile%20email`;
    return res.redirect(googleAuthUrl);
  }

  return res.status(404).json({ error: 'Ruta no encontrada' });
};
