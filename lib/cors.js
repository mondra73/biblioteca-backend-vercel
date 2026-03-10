const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://biblioteca-front-vercel.vercel.app',
  'https://bibliotecamultimedia.com.ar',
  'https://www.bibliotecamultimedia.com.ar',
]

function setCors(req, res) {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, auth-token, Authorization, Cache-Control, Pragma, Expires');
}

function handleCors(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

module.exports = { setCors, handleCors };