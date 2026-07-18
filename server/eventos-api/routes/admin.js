const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { requireAdmin, COOKIE_NAME } = require('../middleware/auth');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000, // 8h
  path: '/',
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.' },
});

router.post('/admin/login', loginLimiter, async (req, res, next) => {
  const { usuario, contrasena } = req.body || {};

  try {
    const userOk = typeof usuario === 'string' && usuario === process.env.ADMIN_USER;
    // Siempre se ejecuta bcrypt.compare (incluso si el usuario ya es incorrecto)
    // para no filtrar por timing si el usuario existe o no.
    const passOk = await bcrypt.compare(
      typeof contrasena === 'string' ? contrasena : '',
      process.env.ADMIN_PASSWORD_HASH
    );

    if (!userOk || !passOk) {
      // Mensaje idéntico en ambos casos: nunca revelar cuál de los dos falló.
      return res.status(401).json({ ok: false, error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ usuario }, process.env.ADMIN_JWT_SECRET, { expiresIn: '8h' });
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/me', requireAdmin, (req, res) => {
  res.json({ ok: true, usuario: req.admin.usuario });
});

router.post('/admin/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

module.exports = router;
