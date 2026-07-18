const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const { notifyWebhook } = require('../utils/webhook');
const { isValidEmail } = require('../utils/validators');

const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados intentos. Inténtalo de nuevo más tarde.' },
});

router.post('/suscribirse', subscribeLimiter, async (req, res, next) => {
  const email = (req.body?.email || '').trim().toLowerCase();

  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: 'Introduce un email válido' });
  }

  try {
    await pool.execute('INSERT INTO suscriptores (email) VALUES (:email)', { email });
    notifyWebhook(process.env.N8N_SUBSCRIBE_WEBHOOK_URL, { email });
    res.status(201).json({ ok: true, message: '¡Gracias! Te avisaremos de los próximos eventos.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ ok: false, error: 'Este email ya está suscrito.' });
    }
    next(err);
  }
});

module.exports = router;
