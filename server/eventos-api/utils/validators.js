const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/; // formato de <input type="datetime-local">

const DESCRIPCION_MAX = 5000;
const TITULO_MAX = 200;

function isValidEmail(v) {
  return typeof v === 'string' && v.trim().length <= 255 && EMAIL_RE.test(v.trim());
}

function isValidFechaLocal(v) {
  return typeof v === 'string' && FECHA_RE.test(v);
}

function fechaLocalToSql(v) {
  return v.replace('T', ' ') + ':00'; // "2026-08-15T20:00" -> "2026-08-15 20:00:00"
}

module.exports = {
  isValidEmail,
  isValidFechaLocal,
  fechaLocalToSql,
  DESCRIPCION_MAX,
  TITULO_MAX,
};
