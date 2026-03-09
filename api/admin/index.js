const connectDB = require('../../lib/db');
const { handleCors } = require('../../lib/cors');
const verifyToken = require('../../lib/verifyToken');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  await connectDB();

  const ok = await verifyToken(req, res);
  if (!ok) return;

  return res.json({
    error: null,
    data: {
      title: 'mi ruta protegida',
      user: req.user,
    },
  });
};