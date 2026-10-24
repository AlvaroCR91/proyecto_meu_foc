import { useState, useEffect, useRef, useCallback, type ChangeEvent, type FormEvent } from 'react';
import {
  adminMe,
  adminLogin,
  adminLogout,
  crearEvento,
  editarEvento,
  borrarEvento,
  getAdminEventos,
  crearAnuncio,
  editarAnuncio,
  borrarAnuncio,
  getAdminAnuncios,
  type EventoAdmin,
  type Anuncio,
  type Vigencia,
} from './api';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const TZ = 'Europe/Madrid';

type Tipo = 'evento' | 'anuncio';
type Editing = { tipo: 'evento'; item: EventoAdmin } | { tipo: 'anuncio'; item: Anuncio } | null;

function hoy() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

function formatDia(v: string) {
  const [y, m, d] = v.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d, 12))
  );
}

function formatFechaHora(iso: string) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function estadoEvento(ev: EventoAdmin) {
  return new Date(ev.fecha).getTime() >= Date.now()
    ? { label: 'Próximo', tone: 'on' }
    : { label: 'Pasado', tone: 'off' };
}

function estadoAnuncio(a: Anuncio) {
  if (a.vigencia === 'permanente') return { label: 'Vigente', tone: 'on' };
  const today = hoy();
  if (a.fecha_fin && a.fecha_fin < today) return { label: 'Caducada', tone: 'off' };
  if (a.fecha_inicio && a.fecha_inicio > today) return { label: 'Programada', tone: 'soon' };
  return { label: 'Vigente', tone: 'on' };
}

function vigenciaTexto(a: Anuncio) {
  if (a.vigencia === 'permanente') return 'Sin fecha de fin';
  if (a.vigencia === 'dia' && a.fecha_inicio) return `Solo el ${formatDia(a.fecha_inicio)}`;
  if (a.fecha_inicio && a.fecha_fin) return `Del ${formatDia(a.fecha_inicio)} al ${formatDia(a.fecha_fin)}`;
  return '';
}

function ImagePicker({
  file,
  currentUrl,
  onChange,
  onRemoveCurrent,
  error,
}: {
  file: File | null;
  currentUrl: string | null; // foto ya guardada (al editar)
  onChange: (file: File | null, error?: string) => void;
  onRemoveCurrent: () => void;
  error: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] || null;
    if (!picked) {
      onChange(null);
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(picked.type)) {
      onChange(null, 'Solo se admiten imágenes JPG, PNG o WEBP.');
      return;
    }
    if (picked.size > MAX_IMAGE_BYTES) {
      onChange(null, 'La imagen no puede superar los 5MB.');
      return;
    }
    onChange(picked);
  }

  function handleRemove() {
    if (inputRef.current) inputRef.current.value = '';
    if (file) onChange(null);
    else onRemoveCurrent();
  }

  const shown = previewUrl || currentUrl;

  return (
    <div className="field">
      <label htmlFor="ev-imagen">Foto (opcional)</label>
      <input
        ref={inputRef}
        id="ev-imagen"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        hidden
      />
      <div className="image-picker">
        {shown && <img className="image-picker-preview" src={shown} alt="Vista previa" />}
        <div className="image-picker-actions">
          <label htmlFor="ev-imagen" className="btn image-picker-btn">
            {shown ? 'Cambiar imagen' : 'Elegir imagen'}
          </label>
          {shown && (
            <button type="button" className="logout-link" onClick={handleRemove}>
              Quitar
            </button>
          )}
        </div>
        {file && <span className="image-picker-filename">{file.name}</span>}
        {error && <p className="form-msg form-msg--err">{error}</p>}
      </div>
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: (usuario: string) => void }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const { ok, data } = await adminLogin(usuario, contrasena);
    if (ok) {
      onSuccess(usuario);
      return;
    }
    setMsg(data.error || 'No se ha podido iniciar sesión.');
    setStatus('error');
  }

  return (
    <form className="admin-login" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="admin-user">Usuario</label>
        <input
          id="admin-user"
          className="input"
          type="text"
          required
          autoComplete="username"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="admin-pass">Contraseña</label>
        <input
          id="admin-pass"
          className="input"
          type="password"
          required
          autoComplete="current-password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
      </div>
      <button className="btn" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Entrando…' : 'Entrar'} <span className="ar">→</span>
      </button>
      {status === 'error' && <p className="form-msg form-msg--err">{msg}</p>}
    </form>
  );
}

function PublicacionForm({
  tipo,
  editing,
  onSaved,
  onCancel,
  onSessionExpired,
}: {
  tipo: Tipo;
  editing: Editing;
  onSaved: (msg: string) => void;
  onCancel: () => void;
  onSessionExpired: () => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(''); // evento: datetime-local
  const [vigencia, setVigencia] = useState<Vigencia>('permanente');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenError, setImagenError] = useState('');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [quitarImagen, setQuitarImagen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  // Rellena el formulario al entrar en edición y lo vacía al salir.
  useEffect(() => {
    setImagenFile(null);
    setImagenError('');
    setQuitarImagen(false);
    setStatus('idle');
    setMsg('');
    if (editing?.tipo === 'evento') {
      setTitulo(editing.item.titulo);
      setDescripcion(editing.item.descripcion);
      setFecha(editing.item.fecha_local);
      setCurrentUrl(editing.item.imagen_placeholder);
    } else if (editing?.tipo === 'anuncio') {
      setTitulo(editing.item.titulo);
      setDescripcion(editing.item.descripcion);
      setVigencia(editing.item.vigencia);
      setFechaInicio(editing.item.fecha_inicio || '');
      setFechaFin(editing.item.fecha_fin || '');
      setCurrentUrl(editing.item.imagen_placeholder);
    } else {
      setTitulo('');
      setDescripcion('');
      setFecha('');
      setVigencia('permanente');
      setFechaInicio('');
      setFechaFin('');
      setCurrentUrl(null);
    }
  }, [editing]);

  function handleImagenChange(file: File | null, error?: string) {
    setImagenFile(file);
    setImagenError(error || '');
  }

  function handleRemoveCurrent() {
    setCurrentUrl(null);
    setQuitarImagen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const imagen = { imagen: imagenFile, quitarImagen: quitarImagen && !imagenFile };

    const result =
      tipo === 'evento'
        ? editing?.tipo === 'evento'
          ? await editarEvento(editing.item.id, { titulo, descripcion, fecha, ...imagen })
          : await crearEvento({ titulo, descripcion, fecha, ...imagen })
        : (() => {
            const payload = {
              titulo,
              descripcion,
              vigencia,
              fecha_inicio: vigencia === 'permanente' ? undefined : fechaInicio,
              fecha_fin: vigencia === 'temporal' ? fechaFin : undefined,
              ...imagen,
            };
            return editing?.tipo === 'anuncio' ? editarAnuncio(editing.item.id, payload) : crearAnuncio(payload);
          })();
    const { ok, status: httpStatus, data } = await result;

    if (httpStatus === 401) {
      onSessionExpired();
      return;
    }
    if (ok) {
      const textos = {
        evento: { creado: 'Evento publicado correctamente.', editado: 'Evento guardado.' },
        anuncio: { creado: 'Publicación añadida al tablón.', editado: 'Publicación guardada.' },
      };
      onSaved(textos[tipo][editing ? 'editado' : 'creado']);
      if (!editing) {
        // Tras crear, el formulario se vacía para la siguiente.
        setTitulo('');
        setDescripcion('');
        setFecha('');
        setFechaInicio('');
        setFechaFin('');
        setImagenFile(null);
      }
      setStatus('idle');
    } else {
      setMsg(data.error || 'No se ha podido guardar.');
      setStatus('error');
    }
  }

  const esEvento = tipo === 'evento';
  const submitLabel = editing ? 'Guardar cambios' : esEvento ? 'Publicar evento' : 'Publicar en el tablón';

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {editing && (
        <p className="admin-editing">
          Editando {esEvento ? 'el evento' : 'la publicación'} «{editing.item.titulo}»
        </p>
      )}
      <div className="field">
        <label htmlFor="ev-titulo">Título</label>
        <input
          id="ev-titulo"
          className="input"
          type="text"
          required
          maxLength={200}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </div>

      {esEvento ? (
        <div className="field">
          <label htmlFor="ev-fecha">Fecha y hora</label>
          <input
            id="ev-fecha"
            className="input"
            type="datetime-local"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
      ) : (
        <fieldset className="field admin-vigencia">
          <legend>¿Hasta cuándo se muestra?</legend>
          <label className="admin-radio">
            <input type="radio" name="vigencia" checked={vigencia === 'permanente'} onChange={() => setVigencia('permanente')} />
            Sin fecha de fin <span>(menú permanente, noticia)</span>
          </label>
          <label className="admin-radio">
            <input type="radio" name="vigencia" checked={vigencia === 'temporal'} onChange={() => setVigencia('temporal')} />
            Temporal <span>(desde una fecha hasta otra)</span>
          </label>
          <label className="admin-radio">
            <input type="radio" name="vigencia" checked={vigencia === 'dia'} onChange={() => setVigencia('dia')} />
            Un día concreto
          </label>
          {vigencia === 'temporal' && (
            <div className="admin-fechas">
              <div className="field">
                <label htmlFor="an-desde">Desde</label>
                <input id="an-desde" className="input" type="date" required value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="an-hasta">Hasta</label>
                <input id="an-hasta" className="input" type="date" required min={fechaInicio || undefined} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
            </div>
          )}
          {vigencia === 'dia' && (
            <div className="field">
              <label htmlFor="an-dia">Día</label>
              <input id="an-dia" className="input" type="date" required value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
          )}
        </fieldset>
      )}

      <div className="field">
        <label htmlFor="ev-descripcion">Descripción</label>
        <textarea
          id="ev-descripcion"
          className="textarea"
          required
          maxLength={5000}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>
      <ImagePicker
        file={imagenFile}
        currentUrl={currentUrl}
        onChange={handleImagenChange}
        onRemoveCurrent={handleRemoveCurrent}
        error={imagenError}
      />
      <div className="admin-form-actions">
        <button className="btn" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Guardando…' : submitLabel} <span className="ar">→</span>
        </button>
        {editing && (
          <button type="button" className="logout-link" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
      {status === 'error' && <p className="form-msg form-msg--err">{msg}</p>}
    </form>
  );
}

function ListaAdmin({
  eventos,
  anuncios,
  editingKey,
  onEdit,
  onDelete,
}: {
  eventos: EventoAdmin[];
  anuncios: Anuncio[];
  editingKey: string | null;
  onEdit: (e: Editing) => void;
  onDelete: (tipo: Tipo, id: number, aviso: string) => void;
}) {
  return (
    <div className="admin-lists">
      <section>
        <h2 className="admin-list-title">Publicaciones del tablón</h2>
        {anuncios.length === 0 ? (
          <p className="admin-list-empty">Todavía no hay publicaciones.</p>
        ) : (
          <ul className="admin-list">
            {anuncios.map((a) => {
              const estado = estadoAnuncio(a);
              return (
                <li key={`a-${a.id}`} className={`admin-item${editingKey === `anuncio-${a.id}` ? ' is-editing' : ''}`}>
                  <div className="admin-item-main">
                    <span className={`admin-badge admin-badge--${estado.tone}`}>{estado.label}</span>
                    <strong>{a.titulo}</strong>
                    <span className="admin-item-meta">{vigenciaTexto(a)}{a.imagen_placeholder ? ' · con foto' : ''}</span>
                  </div>
                  <div className="admin-item-actions">
                    <button type="button" className="logout-link" onClick={() => onEdit({ tipo: 'anuncio', item: a })}>Editar</button>
                    <button type="button" className="logout-link admin-delete" onClick={() => onDelete('anuncio', a.id, `¿Borrar la publicación «${a.titulo}»? No se puede deshacer.`)}>Borrar</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section>
        <h2 className="admin-list-title">Eventos</h2>
        {eventos.length === 0 ? (
          <p className="admin-list-empty">Todavía no hay eventos.</p>
        ) : (
          <ul className="admin-list">
            {eventos.map((ev) => {
              const estado = estadoEvento(ev);
              const aviso =
                estado.label === 'Pasado' && ev.imagen_placeholder
                  ? `¿Borrar el evento «${ev.titulo}»? Su foto también desaparecerá de "Eventos anteriores". No se puede deshacer.`
                  : `¿Borrar el evento «${ev.titulo}»? No se puede deshacer.`;
              return (
                <li key={`e-${ev.id}`} className={`admin-item${editingKey === `evento-${ev.id}` ? ' is-editing' : ''}`}>
                  <div className="admin-item-main">
                    <span className={`admin-badge admin-badge--${estado.tone}`}>{estado.label}</span>
                    <strong>{ev.titulo}</strong>
                    <span className="admin-item-meta">{formatFechaHora(ev.fecha)}{ev.imagen_placeholder ? ' · con foto' : ''}</span>
                  </div>
                  <div className="admin-item-actions">
                    <button type="button" className="logout-link" onClick={() => onEdit({ tipo: 'evento', item: ev })}>Editar</button>
                    <button type="button" className="logout-link admin-delete" onClick={() => onDelete('evento', ev.id, aviso)}>Borrar</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Panel({
  usuario,
  onSessionExpired,
  onLogout,
}: {
  usuario: string;
  onSessionExpired: () => void;
  onLogout: () => void;
}) {
  const [tipo, setTipo] = useState<Tipo>('evento');
  const [editing, setEditing] = useState<Editing>(null);
  const [eventos, setEventos] = useState<EventoAdmin[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    const [ev, an] = await Promise.all([getAdminEventos(), getAdminAnuncios()]);
    if (ev.status === 401 || an.status === 401) {
      onSessionExpired();
      return;
    }
    if (ev.ok) setEventos(ev.data.eventos || []);
    if (an.ok) setAnuncios(an.data.anuncios || []);
  }, [onSessionExpired]);

  useEffect(() => {
    reload();
  }, [reload]);

  function handleEdit(e: Editing) {
    if (!e) return;
    setNotice(null);
    setTipo(e.tipo);
    setEditing(e);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleSaved(text: string) {
    setNotice({ ok: true, text });
    setEditing(null);
    reload();
  }

  async function handleDelete(t: Tipo, id: number, aviso: string) {
    if (!window.confirm(aviso)) return;
    const { ok, status, data } = t === 'evento' ? await borrarEvento(id) : await borrarAnuncio(id);
    if (status === 401) {
      onSessionExpired();
      return;
    }
    if (editing && editing.tipo === t && editing.item.id === id) setEditing(null);
    setNotice(ok ? { ok: true, text: t === 'evento' ? 'Evento borrado.' : 'Publicación borrada.' } : { ok: false, text: data.error || 'No se ha podido borrar.' });
    reload();
  }

  return (
    <>
      <div className="admin-topbar">
        <span className="eyebrow">Sesión de {usuario}</span>
        <button type="button" className="logout-link" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>

      <div ref={formRef} className="admin-form-wrap">
        <div className="admin-tipo" role="radiogroup" aria-label="Qué quieres publicar">
          {(['evento', 'anuncio'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              className={`admin-tipo-btn${tipo === t ? ' is-active' : ''}`}
              disabled={!!editing && editing.tipo !== t}
              onClick={() => { setTipo(t); setNotice(null); }}
            >
              {t === 'evento' ? 'Evento' : 'Publicación'}
              <span>{t === 'evento' ? 'Con fecha, sale en el calendario' : 'Menú, arroz o noticia en el tablón'}</span>
            </button>
          ))}
        </div>

        <PublicacionForm
          tipo={tipo}
          editing={editing}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
          onSessionExpired={onSessionExpired}
        />
        {notice && <p className={`form-msg ${notice.ok ? 'form-msg--ok' : 'form-msg--err'}`}>{notice.text}</p>}
      </div>

      <ListaAdmin
        eventos={eventos}
        anuncios={anuncios}
        editingKey={editing ? `${editing.tipo}-${editing.item.id}` : null}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

export default function AdminPanel() {
  const [view, setView] = useState<'checking' | 'login' | 'panel'>('checking');
  const [usuario, setUsuario] = useState('');
  const [expiredNotice, setExpiredNotice] = useState(false);

  useEffect(() => {
    adminMe().then(({ ok, data }) => {
      if (ok && data.usuario) {
        setUsuario(data.usuario);
        setView('panel');
      } else {
        setView('login');
      }
    });
  }, []);

  function handleLoginSuccess(nombre: string) {
    setExpiredNotice(false);
    setUsuario(nombre);
    setView('panel');
  }

  function handleSessionExpired() {
    setExpiredNotice(true);
    setView('login');
  }

  async function handleLogout() {
    await adminLogout();
    setUsuario('');
    setView('login');
  }

  if (view === 'checking') {
    return <p className="event-empty">Comprobando sesión…</p>;
  }

  if (view === 'login') {
    return (
      <>
        {expiredNotice && (
          <p className="form-msg form-msg--err">Tu sesión ha caducado, entra de nuevo.</p>
        )}
        <LoginForm onSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <Panel usuario={usuario} onSessionExpired={handleSessionExpired} onLogout={handleLogout} />
  );
}
