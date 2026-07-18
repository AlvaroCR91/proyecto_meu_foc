const fs = require('fs');
const router = require('express').Router();
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { uploadEventImage } = require('../middleware/upload');
const { notifyWebhook } = require('../utils/webhook');
const {
  isValidFechaLocal,
  fechaLocalToSql,
  DESCRIPCION_MAX,
  TITULO_MAX,
} = require('../utils/validators');

// GET /api/eventos — público, solo eventos futuros
router.get('/eventos', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, titulo, descripcion, fecha, imagen_placeholder FROM eventos WHERE fecha >= NOW() ORDER BY fecha ASC'
    );
    res.json({ ok: true, eventos: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/nuevo-evento — protegido, la barrera real es requireAdmin,
// nunca el gating de la UI en el cliente. Multipart: campos de texto +
// imagen opcional (uploadEventImage ya valida tipo/tamaño antes de llegar aquí).
router.post('/admin/nuevo-evento', requireAdmin, uploadEventImage, async (req, res, next) => {
  const { titulo, fecha, descripcion } = req.body || {};

  // Si algo del texto no vale, borramos la imagen que multer ya haya guardado
  // en disco para no dejar huérfanos.
  function rejectAndCleanup(status, error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(status).json({ ok: false, error });
  }

  if (typeof titulo !== 'string' || titulo.trim().length < 1 || titulo.trim().length > TITULO_MAX) {
    return rejectAndCleanup(400, 'Título inválido');
  }
  if (typeof descripcion !== 'string' || descripcion.trim().length < 1 || descripcion.trim().length > DESCRIPCION_MAX) {
    return rejectAndCleanup(400, 'Descripción inválida');
  }
  if (!isValidFechaLocal(fecha)) {
    return rejectAndCleanup(400, 'Fecha inválida');
  }

  // Sin extensión en la URL a propósito (ver comentario en routes/uploads.js):
  // NPM intercepta como "asset" cualquier ruta que termine en .jpg/.png/etc.
  const imagenId = req.file ? req.file.filename.replace(/\.[a-z0-9]+$/i, '') : null;
  const imagen = imagenId ? `/api/uploads/eventos/${imagenId}` : null;

  try {
    const [result] = await pool.execute(
      'INSERT INTO eventos (titulo, descripcion, fecha, imagen_placeholder) VALUES (:titulo, :descripcion, :fecha, :imagen)',
      {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha: fechaLocalToSql(fecha),
        imagen,
      }
    );

    const nuevoEvento = {
      id: result.insertId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      fecha,
      imagen_placeholder: imagen,
    };

    notifyWebhook(process.env.N8N_NEW_EVENT_WEBHOOK_URL, nuevoEvento);

    res.status(201).json({ ok: true, evento: nuevoEvento });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
});

module.exports = router;
