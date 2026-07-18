import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { adminMe, adminLogin, adminLogout, crearEvento } from './api';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function ImagePicker({
  file,
  onChange,
  error,
}: {
  file: File | null;
  onChange: (file: File | null, error?: string) => void;
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
    onChange(null);
  }

  return (
    <div className="field">
      <label htmlFor="ev-imagen">Foto del evento (opcional)</label>
      <input
        ref={inputRef}
        id="ev-imagen"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        hidden
      />
      <div className="image-picker">
        {previewUrl && <img className="image-picker-preview" src={previewUrl} alt="Vista previa" />}
        <div className="image-picker-actions">
          <label htmlFor="ev-imagen" className="btn image-picker-btn">
            {file ? 'Cambiar imagen' : 'Elegir imagen'}
          </label>
          {file && (
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

function NuevoEventoForm({
  usuario,
  onSessionExpired,
  onLogout,
}: {
  usuario: string;
  onSessionExpired: () => void;
  onLogout: () => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenError, setImagenError] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  function handleImagenChange(file: File | null, error?: string) {
    setImagenFile(file);
    setImagenError(error || '');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const { ok, status: httpStatus, data } = await crearEvento({
      titulo,
      fecha,
      descripcion,
      imagen: imagenFile,
    });

    if (httpStatus === 401) {
      onSessionExpired();
      return;
    }
    if (ok) {
      setMsg('Evento publicado correctamente.');
      setStatus('ok');
      setTitulo('');
      setFecha('');
      setDescripcion('');
      setImagenFile(null);
    } else {
      setMsg(data.error || 'No se ha podido publicar el evento.');
      setStatus('error');
    }
  }

  return (
    <>
      <div className="admin-topbar">
        <span className="eyebrow">Sesión de {usuario}</span>
        <button type="button" className="logout-link" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>

      <form className="admin-form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="ev-titulo">Título del evento</label>
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
        <ImagePicker file={imagenFile} onChange={handleImagenChange} error={imagenError} />
        <button className="btn" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Publicando…' : 'Publicar Evento'} <span className="ar">→</span>
        </button>
        {msg && (
          <p className={`form-msg ${status === 'ok' ? 'form-msg--ok' : 'form-msg--err'}`}>{msg}</p>
        )}
      </form>
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
    <NuevoEventoForm usuario={usuario} onSessionExpired={handleSessionExpired} onLogout={handleLogout} />
  );
}
