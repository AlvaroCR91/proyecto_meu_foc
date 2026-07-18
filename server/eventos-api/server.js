require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// NPM (10.10.10.80) reenvía X-Forwarded-For; hace falta para que
// express-rate-limit identifique la IP real del visitante, no la de NPM.
app.set('trust proxy', 1);

app.use(
  helmet({
    // HSTS se desactiva a propósito: ya tuvimos un incidente con caché de HSTS
    // del navegador causando un bucle de redirecciones en este dominio.
    hsts: false,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Límite general de abuso/scraping sobre toda la API (los endpoints sensibles
// llevan además su propio límite más estricto).
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

app.use('/api', require('./routes/health'));
app.use('/api', require('./routes/uploads'));
app.use('/api', require('./routes/eventos'));
app.use('/api', require('./routes/suscriptores'));
app.use('/api', require('./routes/admin'));

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'No encontrado' });
});

// Handler de error genérico: nunca se mandan stack traces ni detalles
// internos al cliente.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: 'Error interno' });
});

const port = process.env.PORT || 8523;
app.listen(port, () => {
  console.log(`eventos-api escuchando en :${port}`);
});
