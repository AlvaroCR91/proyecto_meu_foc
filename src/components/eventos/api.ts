export interface Evento {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  imagen_placeholder: string | null;
}

export interface EventoAdmin extends Evento {
  fecha_local: string; // "YYYY-MM-DDTHH:MM" en hora de Madrid
}

export type Vigencia = 'permanente' | 'temporal' | 'dia';

export interface Anuncio {
  id: number;
  titulo: string;
  descripcion: string;
  imagen_placeholder: string | null;
  vigencia: Vigencia;
  fecha_inicio: string | null; // "YYYY-MM-DD"
  fecha_fin: string | null;
  creado_en: string;
}

interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  data: T & { ok?: boolean; error?: string; message?: string };
}

async function apiFetch<T = any>(path: string, opts: RequestInit = {}): Promise<ApiResult<T>> {
  // Con FormData, el navegador debe fijar su propio Content-Type (con el
  // boundary del multipart) — si lo forzamos a JSON aquí, el backend no
  // consigue parsear el cuerpo.
  const isFormData = opts.body instanceof FormData;
  const res = await fetch(path, {
    credentials: 'include',
    ...opts,
    headers: isFormData ? opts.headers : { 'Content-Type': 'application/json', ...opts.headers },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok !== false, status: res.status, data };
}

export const getEventos = () =>
  apiFetch<{ eventos: Evento[] }>('/api/eventos');

export const getEventosPasados = () =>
  apiFetch<{ eventos: Evento[] }>('/api/eventos/pasados-con-imagen');

export const subscribe = (email: string) =>
  apiFetch('/api/suscribirse', { method: 'POST', body: JSON.stringify({ email }) });

export const adminMe = () =>
  apiFetch<{ usuario: string }>('/api/admin/me');

export const adminLogin = (usuario: string, contrasena: string) =>
  apiFetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ usuario, contrasena }) });

export const adminLogout = () =>
  apiFetch('/api/admin/logout', { method: 'POST' });

export const getAnuncios = () =>
  apiFetch<{ anuncios: Anuncio[] }>('/api/anuncios');

export interface EventoPayload {
  titulo: string;
  fecha: string;
  descripcion: string;
  imagen?: File | null;
  quitarImagen?: boolean;
}

export interface AnuncioPayload {
  titulo: string;
  descripcion: string;
  vigencia: Vigencia;
  fecha_inicio?: string;
  fecha_fin?: string;
  imagen?: File | null;
  quitarImagen?: boolean;
}

// Multipart con los campos de texto, la foto nueva (si hay) y la marca para
// quitar la actual al editar.
function toForm(payload: EventoPayload | AnuncioPayload) {
  const form = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'imagen' || key === 'quitarImagen' || value == null) continue;
    form.set(key, String(value));
  }
  if (payload.imagen) form.set('imagen', payload.imagen);
  if (payload.quitarImagen) form.set('quitar_imagen', '1');
  return form;
}

export const crearEvento = (payload: EventoPayload) =>
  apiFetch<{ evento: Evento }>('/api/admin/nuevo-evento', { method: 'POST', body: toForm(payload) });

export const editarEvento = (id: number, payload: EventoPayload) =>
  apiFetch<{ evento: Evento }>(`/api/admin/eventos/${id}`, { method: 'PUT', body: toForm(payload) });

export const borrarEvento = (id: number) =>
  apiFetch(`/api/admin/eventos/${id}`, { method: 'DELETE' });

export const getAdminEventos = () =>
  apiFetch<{ eventos: EventoAdmin[] }>('/api/admin/eventos');

export const crearAnuncio = (payload: AnuncioPayload) =>
  apiFetch<{ anuncio: Anuncio }>('/api/admin/nuevo-anuncio', { method: 'POST', body: toForm(payload) });

export const editarAnuncio = (id: number, payload: AnuncioPayload) =>
  apiFetch<{ anuncio: Anuncio }>(`/api/admin/anuncios/${id}`, { method: 'PUT', body: toForm(payload) });

export const borrarAnuncio = (id: number) =>
  apiFetch(`/api/admin/anuncios/${id}`, { method: 'DELETE' });

export const getAdminAnuncios = () =>
  apiFetch<{ anuncios: Anuncio[] }>('/api/admin/anuncios');
