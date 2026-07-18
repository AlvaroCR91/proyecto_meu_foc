const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'eventos_admin_session';

function requireAdmin(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ ok: false, error: 'No autenticado' });

  try {
    req.admin = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Sesión inválida o caducada' });
  }
}

module.exports = { requireAdmin, COOKIE_NAME };
