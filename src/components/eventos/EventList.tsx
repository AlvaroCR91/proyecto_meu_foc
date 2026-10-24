import { useState, useMemo, useEffect } from 'react';
import { getEventos, type Evento } from './api';

const TZ = 'Europe/Madrid';

function formatFecha(fecha: string) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  const fmt = new Intl.DateTimeFormat('es-ES', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return fmt.charAt(0).toUpperCase() + fmt.slice(1);
}

// "YYYY-MM-DD" del día en la zona horaria del restaurante, no en UTC ni en la
// zona del visitante — así una fecha a las 21:00 no "salta" de día.
function dateKey(d: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function monthLabel(d: Date) {
  const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone: TZ }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function dayLabel(d: Date) {
  return new Intl.DateTimeFormat('es-ES', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(d);
}

function MonthCalendar({ eventos, onSelectDay }: { eventos: Evento[]; onSelectDay: (key: string) => void }) {
  const eventDays = useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of eventos) {
      const key = dateKey(new Date(ev.fecha));
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [eventos]);

  // Abre en el mes del próximo evento (los eventos llegan ordenados por fecha).
  const initialCursor = useMemo(() => {
    const [y, m] = dateKey(eventos.length ? new Date(eventos[0].fecha) : new Date()).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, 1, 12));
  }, [eventos]);

  const [cursor, setCursor] = useState(initialCursor);
  const todayKey = dateKey(new Date());

  // Celdas del mes: huecos vacíos hasta el primer día (semana de lunes a
  // domingo) y después un día por celda.
  const cells = useMemo(() => {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    const total = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const leading = (new Date(Date.UTC(year, month, 1, 12)).getUTCDay() + 6) % 7;
    const days = Array.from({ length: total }, (_, i) => {
      const date = new Date(Date.UTC(year, month, i + 1, 12));
      const key = dateKey(date);
      return { day: i + 1, key, date, count: eventDays.get(key) || 0 };
    });
    return [...Array.from({ length: leading }, () => null), ...days];
  }, [cursor, eventDays]);

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + delta, 1, 12)));
  }

  return (
    <div className="month-cal">
      <div className="month-cal-header">
        <button type="button" className="month-cal-nav" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">‹</button>
        <span className="month-cal-label" aria-live="polite">{monthLabel(cursor)}</span>
        <button type="button" className="month-cal-nav" onClick={() => shiftMonth(1)} aria-label="Mes siguiente">›</button>
      </div>
      <div className="month-cal-grid">
        {WEEKDAYS.map((w) => (
          <span className="month-cal-weekday" key={w} aria-hidden="true">{w}</span>
        ))}
        {cells.map((cell, i) =>
          cell === null ? (
            <span className="month-cal-blank" key={`blank-${i}`} />
          ) : (
            <button
              type="button"
              key={cell.key}
              className={`month-cal-day${cell.count ? ' has-event' : ''}${cell.key === todayKey ? ' is-today' : ''}${cell.key < todayKey ? ' is-past' : ''}`}
              disabled={!cell.count}
              aria-label={cell.count ? `${dayLabel(cell.date)}: ${cell.count === 1 ? '1 evento' : `${cell.count} eventos`}` : undefined}
              onClick={() => onSelectDay(cell.key)}
            >
              {cell.day}
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function EventList() {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    getEventos().then(({ ok, data }) => {
      if (ok) {
        setEventos(data.eventos || []);
        setState('ok');
      } else {
        setState('error');
      }
    });
  }, []);

  function scrollToDay(key: string) {
    const first = eventos.find((ev) => dateKey(new Date(ev.fecha)) === key);
    if (!first) return;
    const card = document.getElementById(`event-${first.id}`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Realce breve para que se vea qué tarjeta corresponde al día pulsado.
    card.classList.remove('is-highlighted');
    void card.offsetWidth;
    card.classList.add('is-highlighted');
  }

  if (state === 'loading') {
    return <p className="event-empty">Cargando próximos eventos…</p>;
  }

  // El calendario se muestra siempre (aunque esté vacía) para que la sección
  // no parezca incompleta; solo el contenido de debajo cambia según el estado.
  return (
    <>
      <MonthCalendar eventos={eventos} onSelectDay={scrollToDay} />
      {state === 'error' && (
        <p className="event-empty">No hemos podido cargar los eventos. Inténtalo más tarde.</p>
      )}
      {state === 'ok' && eventos.length === 0 && (
        <p className="event-empty">De momento no hay eventos programados. ¡Vuelve pronto!</p>
      )}
      {state === 'ok' && eventos.length > 0 && (
        <div className="event-grid">
          {eventos.map((ev) => (
            <article className="event-card" id={`event-${ev.id}`} key={ev.id}>
              {ev.imagen_placeholder && (
                <img className="event-card-image" src={ev.imagen_placeholder} alt={ev.titulo} />
              )}
              <span className="event-date">{formatFecha(ev.fecha)}</span>
              <h3 className="h2" style={{ fontSize: '32px' }}>{ev.titulo}</h3>
              <p className="lead-p" style={{ fontSize: '18px', maxWidth: 'none' }}>{ev.descripcion}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
