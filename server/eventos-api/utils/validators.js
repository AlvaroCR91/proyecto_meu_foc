const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/; // formato de <input type="datetime-local">
const FECHA_DIA_RE = /^\d{4}-\d{2}-\d{2}$/; // formato de <input type="date">
const VIGENCIAS = ['permanente', 'temporal', 'dia'];

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

// "YYYY-MM-DD" que además sea un día real (descarta 2026-02-30).
function isValidFechaDia(v) {
  if (typeof v !== 'string' || !FECHA_DIA_RE.test(v)) return false;
  const d = new Date(`${v}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

// Hoy en la zona del restaurante, en el mismo formato que isValidFechaDia.
function hoyMadrid() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
}

// Valida los campos de un evento (creación y edición). Devuelve { error } o
// { data } con la fecha ya en formato SQL y `fecha` tal cual llegó.
function validateEvento(body) {
  const { titulo, fecha, descripcion } = body || {};

  if (typeof titulo !== 'string' || titulo.trim().length < 1 || titulo.trim().length > TITULO_MAX) {
    return { error: 'Título inválido' };
  }
  if (typeof descripcion !== 'string' || descripcion.trim().length < 1 || descripcion.trim().length > DESCRIPCION_MAX) {
    return { error: 'Descripción inválida' };
  }
  if (!isValidFechaLocal(fecha)) {
    return { error: 'Fecha inválida' };
  }

  return { data: { titulo: titulo.trim(), descripcion: descripcion.trim(), fecha, fechaSql: fechaLocalToSql(fecha) } };
}

// Valida los campos de un anuncio (creación y edición). Devuelve
// { error } o { data } con los valores listos para la BD.
function validateAnuncio(body) {
  const { titulo, descripcion, vigencia, fecha_inicio, fecha_fin } = body || {};

  if (typeof titulo !== 'string' || titulo.trim().length < 1 || titulo.trim().length > TITULO_MAX) {
    return { error: 'Título inválido' };
  }
  if (typeof descripcion !== 'string' || descripcion.trim().length < 1 || descripcion.trim().length > DESCRIPCION_MAX) {
    return { error: 'Descripción inválida' };
  }
  if (!VIGENCIAS.includes(vigencia)) {
    return { error: 'Vigencia inválida' };
  }

  let inicio = null;
  let fin = null;
  if (vigencia === 'dia') {
    if (!isValidFechaDia(fecha_inicio)) return { error: 'Fecha inválida' };
    inicio = fin = fecha_inicio;
  } else if (vigencia === 'temporal') {
    if (!isValidFechaDia(fecha_inicio) || !isValidFechaDia(fecha_fin)) return { error: 'Fechas inválidas' };
    if (fecha_inicio > fecha_fin) return { error: 'La fecha de inicio no puede ser posterior a la de fin' };
    inicio = fecha_inicio;
    fin = fecha_fin;
  }

  return {
    data: { titulo: titulo.trim(), descripcion: descripcion.trim(), vigencia, fecha_inicio: inicio, fecha_fin: fin },
  };
}

module.exports = {
  isValidEmail,
  isValidFechaLocal,
  fechaLocalToSql,
  isValidFechaDia,
  hoyMadrid,
  validateAnuncio,
  validateEvento,
  DESCRIPCION_MAX,
  TITULO_MAX,
};
