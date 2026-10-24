const fs = require('fs');
const router = require('express').Router();
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { uploadEventImage, imagenUrl, borrarImagen } = require('../middleware/upload');
const { notifyWebhook } = require('../utils/webhook');
const { validateEvento } = require('../utils/validators');
const { parseId, rejectAndCleanup } = require('../utils/http');

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

// GET /api/eventos/pasados-con-imagen — público, eventos ya celebrados que
// subieron foto al crearse. Alimenta la galeria "Eventos anteriores": en
// cuanto la fecha de un evento pasa, su imagen aparece aqui sola, sin tocar
// nada a mano.
router.get('/eventos/pasados-con-imagen', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, titulo, fecha, imagen_placeholder FROM eventos WHERE fecha < NOW() AND imagen_placeholder IS NOT NULL ORDER BY fecha DESC'
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
  // Si algo del texto no vale, borramos la imagen que multer ya haya guardado
  // en disco para no dejar huérfanos.
  const { error, data } = validateEvento(req.body);
  if (error) return rejectAndCleanup(req, res, 400, error);

  const imagen = imagenUrl(req.file);

  try {
    const [result] = await pool.execute(
      'INSERT INTO eventos (titulo, descripcion, fecha, imagen_placeholder) VALUES (:titulo, :descripcion, :fecha, :imagen)',
      { titulo: data.titulo, descripcion: data.descripcion, fecha: data.fechaSql, imagen }
    );

    const nuevoEvento = {
      id: result.insertId,
      titulo: data.titulo,
      descripcion: data.descripcion,
      fecha: data.fecha,
      imagen_placeholder: imagen,
    };

    notifyWebhook(process.env.N8N_NEW_EVENT_WEBHOOK_URL, { tipo: 'evento', ...nuevoEvento });

    res.status(201).json({ ok: true, evento: nuevoEvento });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
});

// GET /api/admin/eventos — protegido, todos (también los pasados), los más
// recientes primero. `fecha_local` es la fecha tal como se escribió en el
// formulario ("YYYY-MM-DDTHH:MM", hora de Madrid), para poder editarla.
router.get('/admin/eventos', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, titulo, descripcion, fecha, DATE_FORMAT(fecha, '%Y-%m-%dT%H:%i') AS fecha_local,
              imagen_placeholder
       FROM eventos ORDER BY fecha DESC`
    );
    res.json({ ok: true, eventos: rows });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/eventos/:id — protegido. Mismos campos que al crear; la
// foto se sustituye si llega una nueva o se quita con quitar_imagen=1. No
// vuelve a avisar a los suscriptores.
router.put('/admin/eventos/:id', requireAdmin, uploadEventImage, async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return rejectAndCleanup(req, res, 404, 'No encontrado');

  const { error, data } = validateEvento(req.body);
  if (error) return rejectAndCleanup(req, res, 400, error);

  try {
    const [[actual]] = await pool.execute('SELECT imagen_placeholder FROM eventos WHERE id = :id', { id });
    if (!actual) return rejectAndCleanup(req, res, 404, 'No encontrado');

    const quitar = req.body.quitar_imagen === '1';
    const imagen = req.file ? imagenUrl(req.file) : quitar ? null : actual.imagen_placeholder;

    await pool.execute(
      'UPDATE eventos SET titulo = :titulo, descripcion = :descripcion, fecha = :fecha, imagen_placeholder = :imagen WHERE id = :id',
      { id, titulo: data.titulo, descripcion: data.descripcion, fecha: data.fechaSql, imagen }
    );
    if (imagen !== actual.imagen_placeholder) borrarImagen(actual.imagen_placeholder);

    res.json({
      ok: true,
      evento: { id, titulo: data.titulo, descripcion: data.descripcion, fecha: data.fecha, imagen_placeholder: imagen },
    });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
});

// DELETE /api/admin/eventos/:id — protegido. Borra también su foto (y con
// ella desaparece de "Eventos anteriores").
router.delete('/admin/eventos/:id', requireAdmin, async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ ok: false, error: 'No encontrado' });

  try {
    const [[actual]] = await pool.execute('SELECT imagen_placeholder FROM eventos WHERE id = :id', { id });
    if (!actual) return res.status(404).json({ ok: false, error: 'No encontrado' });

    await pool.execute('DELETE FROM eventos WHERE id = :id', { id });
    borrarImagen(actual.imagen_placeholder);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
