const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

// UPLOADS_DIR por env solo para la API de desarrollo, que comparte BD con
// producción y por tanto debe leer y guardar las fotos en la misma carpeta.
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads', 'eventos');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  // Nombre generado por nosotros (UUID + extensión derivada del mimetype
  // validado) — nunca se confía en el nombre que manda el cliente.
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME_TO_EXT[file.mimetype];
    cb(null, `${crypto.randomUUID()}.${ext}`);
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TO_EXT[file.mimetype]) {
      return cb(new Error('INVALID_FILE_TYPE'));
    }
    cb(null, true);
  },
});

// Envuelve multer para devolver siempre un error JSON amistoso en vez de
// dejar que se cuele al handler de errores genérico.
function uploadEventImage(req, res, next) {
  multerUpload.single('imagen')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        error: 'Imagen inválida. Usa JPG, PNG o WEBP de menos de 5MB.',
      });
    }
    next();
  });
}

// URL pública de la foto recién subida, sin extensión a propósito (ver
// routes/uploads.js), o null si no se subió ninguna.
function imagenUrl(file) {
  return file ? `/api/uploads/eventos/${file.filename.replace(/\.[a-z0-9]+$/i, '')}` : null;
}

const IMAGEN_URL_RE = /^\/api\/uploads\/eventos\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

// Borra del disco la foto de una URL guardada en la BD (best-effort: si no
// existe o la URL no es nuestra, no hace nada).
function borrarImagen(url) {
  const m = typeof url === 'string' && url.match(IMAGEN_URL_RE);
  if (!m) return;
  for (const ext of Object.values(ALLOWED_MIME_TO_EXT)) {
    fs.unlink(path.join(UPLOADS_DIR, `${m[1]}.${ext}`), () => {});
  }
}

module.exports = { uploadEventImage, imagenUrl, borrarImagen, UPLOADS_DIR, ALLOWED_MIME_TO_EXT };
