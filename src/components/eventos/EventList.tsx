import { useState, useMemo, useEffect, useRef } from 'react';
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

function MonthStrip({ eventos, onSelectDay }: { eventos: Evento[]; onSelectDay: (key: string) => void }) {
  const eventDays = useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of eventos) {
      const key = dateKey(new Date(ev.fecha));
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [eventos]);

  const initialCursor = useMemo(() => {
    const base = eventos.length ? new Date(eventos[0].fecha) : new Date();
    return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1, 12));
  }, [eventos]);

  const [cursor, setCursor] = useState(initialCursor);
  const todayKey = dateKey(new Date());
  const daysRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    const total = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(Date.UTC(year, month, i + 1, 12));
      const key = dateKey(d);
      return { day: i + 1, key, hasEvent: eventDays.has(key) };
    });
  }, [cursor, eventDays]);

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + delta, 1, 12)));
  }

  // Al cargar o cambiar de mes, desplaza la tira para que el primer día con
  // evento quede visible sin que el usuario tenga que buscarlo a mano.
  useEffect(() => {
    const container = daysRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>('.has-event') || container.firstElementChild as HTMLElement | null;
    target?.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
  }, [cursor, eventDays]);

  return (
    <div className="month-strip">
      <div className="month-strip-header">
        <button type="button" className="month-strip-nav" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">‹</button>
        <span className="month-strip-label">{monthLabel(cursor)}</span>
        <button type="button" className="month-strip-nav" onClick={() => shiftMonth(1)} aria-label="Mes siguiente">›</button>
      </div>
      <div className="month-strip-days" ref={daysRef}>
        {days.map(({ day, key, hasEvent }) => (
          <button
            type="button"
            key={key}
            className={`month-strip-day${hasEvent ? ' has-event' : ''}${key === todayKey ? ' is-today' : ''}`}
            disabled={!hasEvent}
            onClick={() => onSelectDay(key)}
          >
            {day}
          </button>
        ))}
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
    document.getElementById(`event-${first.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (state === 'loading') {
    return <p className="event-empty">Cargando próximos eventos…</p>;
  }

  // La tira de mes se muestra siempre (aunque esté vacía) para que la sección
  // no parezca incompleta; solo el contenido de debajo cambia según el estado.
  return (
    <>
      <MonthStrip eventos={eventos} onSelectDay={scrollToDay} />
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
