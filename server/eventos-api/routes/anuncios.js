const fs = require('fs');
const router = require('express').Router();
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { uploadEventImage } = require('../middleware/upload');
const { notifyWebhook } = require('../utils/webhook');
const { validateAnuncio, hoyMadrid } = require('../utils/validators');

// Las fechas salen como texto "YYYY-MM-DD": si mysql2 las convierte a Date,
// al pasar a JSON se van a UTC y pueden retroceder un día.
const CAMPOS = `id, titulo, descripcion, imagen_placeholder, vigencia,
  DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
  DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fecha_fin,
  creado_en`;

// GET /api/anuncios — público, solo los vigentes: los permanentes siempre y
// los temporales o de un día hasta que pasa su último día (se ven también
// por adelantado). Más nuevos primero.
router.get('/anuncios', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${CAMPOS} FROM anuncios
       WHERE vigencia = 'permanente' OR fecha_fin >= CURDATE()
       ORDER BY creado_en DESC, id DESC`
    );
    res.json({ ok: true, anuncios: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/nuevo-anuncio — protegido. Multipart igual que
// nuevo-evento: campos de texto + imagen opcional.
router.post('/admin/nuevo-anuncio', requireAdmin, uploadEventImage, async (req, res, next) => {
  function rejectAndCleanup(status, error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(status).json({ ok: false, error });
  }

  const { error, data } = validateAnuncio(req.body);
  if (error) return rejectAndCleanup(400, error);
  // Al crear no tiene sentido una publicación que ya ha caducado: no se vería.
  if (data.fecha_fin && data.fecha_fin < hoyMadrid()) {
    return rejectAndCleanup(400, 'La fecha de fin ya ha pasado');
  }

  // Sin extensión en la URL a propósito (ver routes/uploads.js).
  const imagenId = req.file ? req.file.filename.replace(/\.[a-z0-9]+$/i, '') : null;
  const imagen = imagenId ? `/api/uploads/eventos/${imagenId}` : null;

  try {
    const [result] = await pool.execute(
      `INSERT INTO anuncios (titulo, descripcion, imagen_placeholder, vigencia, fecha_inicio, fecha_fin)
       VALUES (:titulo, :descripcion, :imagen, :vigencia, :fecha_inicio, :fecha_fin)`,
      { ...data, imagen }
    );

    const nuevoAnuncio = { id: result.insertId, ...data, imagen_placeholder: imagen };

    notifyWebhook(process.env.N8N_NEW_ANUNCIO_WEBHOOK_URL, { tipo: 'anuncio', ...nuevoAnuncio });

    res.status(201).json({ ok: true, anuncio: nuevoAnuncio });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
});

module.exports = router;
