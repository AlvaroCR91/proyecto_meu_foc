export interface Evento {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  imagen_placeholder: string | null;
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

export const crearEvento = (payload: {
  titulo: string;
  fecha: string;
  descripcion: string;
  imagen?: File | null;
}) => {
  const form = new FormData();
  form.set('titulo', payload.titulo);
  form.set('fecha', payload.fecha);
  form.set('descripcion', payload.descripcion);
  if (payload.imagen) form.set('imagen', payload.imagen);

  return apiFetch<{ evento: Evento }>('/api/admin/nuevo-evento', {
    method: 'POST',
    body: form,
  });
};
