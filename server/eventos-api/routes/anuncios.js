const fs = require('fs');
const router = require('express').Router();
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { uploadEventImage, imagenUrl, borrarImagen } = require('../middleware/upload');
const { notifyWebhook } = require('../utils/webhook');
const { validateAnuncio, hoyMadrid } = require('../utils/validators');
const { parseId, rejectAndCleanup } = require('../utils/http');

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
  const { error, data } = validateAnuncio(req.body);
  if (error) return rejectAndCleanup(req, res, 400, error);
  // Al crear no tiene sentido una publicación que ya ha caducado: no se vería.
  if (data.fecha_fin && data.fecha_fin < hoyMadrid()) {
    return rejectAndCleanup(req, res, 400, 'La fecha de fin ya ha pasado');
  }

  const imagen = imagenUrl(req.file);

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

// GET /api/admin/anuncios — protegido, todos (también los caducados), los
// más nuevos primero.
router.get('/admin/anuncios', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT ${CAMPOS} FROM anuncios ORDER BY creado_en DESC, id DESC`);
    res.json({ ok: true, anuncios: rows });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/anuncios/:id — protegido. Mismos campos que al crear (aquí
// sí se admite una fecha de fin pasada, p. ej. para corregir una caducada);
// la foto se sustituye si llega una nueva o se quita con quitar_imagen=1. No
// vuelve a avisar a los suscriptores.
router.put('/admin/anuncios/:id', requireAdmin, uploadEventImage, async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return rejectAndCleanup(req, res, 404, 'No encontrado');

  const { error, data } = validateAnuncio(req.body);
  if (error) return rejectAndCleanup(req, res, 400, error);

  try {
    const [[actual]] = await pool.execute('SELECT imagen_placeholder FROM anuncios WHERE id = :id', { id });
    if (!actual) return rejectAndCleanup(req, res, 404, 'No encontrado');

    const quitar = req.body.quitar_imagen === '1';
    const imagen = req.file ? imagenUrl(req.file) : quitar ? null : actual.imagen_placeholder;

    await pool.execute(
      `UPDATE anuncios SET titulo = :titulo, descripcion = :descripcion, imagen_placeholder = :imagen,
              vigencia = :vigencia, fecha_inicio = :fecha_inicio, fecha_fin = :fecha_fin
       WHERE id = :id`,
      { id, ...data, imagen }
    );
    if (imagen !== actual.imagen_placeholder) borrarImagen(actual.imagen_placeholder);

    res.json({ ok: true, anuncio: { id, ...data, imagen_placeholder: imagen } });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
});

// DELETE /api/admin/anuncios/:id — protegido. Borra también su foto.
router.delete('/admin/anuncios/:id', requireAdmin, async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ ok: false, error: 'No encontrado' });

  try {
    const [[actual]] = await pool.execute('SELECT imagen_placeholder FROM anuncios WHERE id = :id', { id });
    if (!actual) return res.status(404).json({ ok: false, error: 'No encontrado' });

    await pool.execute('DELETE FROM anuncios WHERE id = :id', { id });
    borrarImagen(actual.imagen_placeholder);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
