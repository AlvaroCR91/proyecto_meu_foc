const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'eventos');
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

module.exports = { uploadEventImage, UPLOADS_DIR, ALLOWED_MIME_TO_EXT };
