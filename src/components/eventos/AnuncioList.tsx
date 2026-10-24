import { useState, useEffect } from 'react';
import { getAnuncios, type Anuncio } from './api';

const TZ = 'Europe/Madrid';

// "YYYY-MM-DD" -> Date a mediodía UTC, para formatear el día sin que la zona
// horaria del visitante lo mueva.
function toDate(v: string) {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function fmt(v: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', ...opts }).format(toDate(v));
}

function vigenciaLabel(a: Anuncio) {
  if (a.vigencia === 'permanente' || !a.fecha_inicio || !a.fecha_fin) return 'Novedad';
  const thisYear = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric' }).format(new Date());
  const withYear = a.fecha_fin.slice(0, 4) !== thisYear;
  const diaMes: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', ...(withYear && { year: 'numeric' }) };

  if (a.vigencia === 'dia') {
    return `Solo el ${fmt(a.fecha_inicio, { weekday: 'long' })} ${fmt(a.fecha_inicio, diaMes)}`;
  }
  const mismoMes = a.fecha_inicio.slice(0, 7) === a.fecha_fin.slice(0, 7);
  const desde = mismoMes ? fmt(a.fecha_inicio, { day: 'numeric' }) : fmt(a.fecha_inicio, { day: 'numeric', month: 'long' });
  return `Del ${desde} al ${fmt(a.fecha_fin, diaMes)}`;
}

// Tablón de anuncios de /eventos. Pinta la sección entera para poder
// ocultarla del todo cuando no hay publicaciones vigentes (o la API falla).
export default function AnuncioList() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);

  useEffect(() => {
    getAnuncios().then(({ ok, data }) => {
      if (ok) setAnuncios(data.anuncios || []);
    });
  }, []);

  if (anuncios.length === 0) return null;

  return (
    <section className="section surf-paper" id="novedades">
      <div className="wrap">
        <div className="sec-head sec-head--center">
          <span className="eyebrow">Tablón de la casa</span>
          <h2 className="h2">Novedades</h2>
        </div>
        <div className="anuncio-grid">
          {anuncios.map((a) => (
            <article className="event-card anuncio-card" id={`anuncio-${a.id}`} key={a.id}>
              {a.imagen_placeholder && (
                <img className="event-card-image anuncio-card-image" src={a.imagen_placeholder} alt={a.titulo} loading="lazy" />
              )}
              <span className="event-date">{vigenciaLabel(a)}</span>
              <h3 className="h2 anuncio-card-title">{a.titulo}</h3>
              <p className="lead-p anuncio-card-text">{a.descripcion}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
