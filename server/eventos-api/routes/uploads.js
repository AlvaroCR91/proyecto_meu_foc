const path = require('path');
const fs = require('fs');
const router = require('express').Router();
const { UPLOADS_DIR, ALLOWED_MIME_TO_EXT } = require('../middleware/upload');

const EXTENSIONS = Object.values(ALLOWED_MIME_TO_EXT);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/uploads/eventos/:id — sin extensión en la URL a propósito: NPM
// tiene "Cache Assets" activado en el Proxy Host, que intercepta cualquier
// ruta terminada en .jpg/.png/etc. ANTES de llegar a nuestra Custom Location
// /api, devolviendo un 404 sin ni siquiera reenviar la petición. Al no llevar
// extensión, esa regla no la reconoce como "asset" y sí nos llega. El propio
// res.sendFile() fija el Content-Type correcto mirando el archivo real en
// disco (que sí tiene extensión), así que el navegador ve la imagen bien igual.
router.get('/uploads/eventos/:id', (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) {
    return res.status(404).json({ ok: false, error: 'No encontrado' });
  }

  for (const ext of EXTENSIONS) {
    const filePath = path.join(UPLOADS_DIR, `${id}.${ext}`);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath, { maxAge: '30d', immutable: true });
    }
  }

  res.status(404).json({ ok: false, error: 'No encontrado' });
});

module.exports = router;
