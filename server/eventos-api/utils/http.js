const fs = require('fs');

// Id numérico de la URL, o null si no lo es.
function parseId(v) {
  return /^\d{1,10}$/.test(v) ? Number(v) : null;
}

// Responde con error y borra la foto que multer ya haya guardado en disco,
// para no dejar huérfanos.
function rejectAndCleanup(req, res, status, error) {
  if (req.file) fs.unlink(req.file.path, () => {});
  return res.status(status).json({ ok: false, error });
}

module.exports = { parseId, rejectAndCleanup };
