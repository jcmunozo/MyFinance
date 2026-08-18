const API = '/api';

export async function apiGet(path) {
  const r = await fetch(`${API}/${path}`);
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`);
  return r.json();
}
export async function apiPost(path, body) {
  const r = await fetch(`${API}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`POST ${path} -> ${r.status}`);
  return r.json();
}
export async function apiPut(path, body) {
  const r = await fetch(`${API}/${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`PUT ${path} -> ${r.status}`);
  return r.json();
}
export async function apiDelete(path) {
  const r = await fetch(`${API}/${path}`, { method: 'DELETE' });
  if (!r.ok && r.status !== 404) throw new Error(`DELETE ${path} -> ${r.status}`);
}

// La mayoría de tablas usan las mismas columnas que el estado del frontend, así
// que no necesitan traducción. Solo "bills" y "pension" tienen columnas en
// snake_case que difieren del camelCase que usan los componentes; se traducen
// aquí, en un solo lugar — el único punto que tocaría un cambio de backend.
export function fromApiBill(b) {
  return { id: b.id, tipo: b.tipo, entidad: b.entidad, nombre: b.nombre, dia: b.dia, valor: b.valor, lastPaidYm: b.last_paid_ym };
}
export function toApiBill(b) {
  return { id: b.id, tipo: b.tipo, entidad: b.entidad, nombre: b.nombre, dia: Number(b.dia), valor: Number(b.valor || 0), last_paid_ym: b.lastPaidYm || null };
}

export function fromApiPension(p) {
  if (!p) return { fondo: 'RPM', administradora: '', semanasCotizadas: '', fechaCorte: '', metaSemanas: 1300 };
  return {
    fondo: p.fondo || 'RPM',
    administradora: p.administradora || '',
    semanasCotizadas: p.semanas_cotizadas ?? '',
    fechaCorte: p.fecha_corte || '',
    metaSemanas: p.meta_semanas ?? 1300,
  };
}
export function toApiPension(p) {
  return {
    fondo: p.fondo,
    administradora: p.administradora,
    semanas_cotizadas: p.semanasCotizadas === '' || p.semanasCotizadas == null ? null : Number(p.semanasCotizadas),
    fecha_corte: p.fechaCorte || null,
    meta_semanas: p.metaSemanas === '' || p.metaSemanas == null ? null : Number(p.metaSemanas),
  };
}
