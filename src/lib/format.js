export function fmtCOP(n) {
  n = Number(n) || 0;
  return '$' + n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
