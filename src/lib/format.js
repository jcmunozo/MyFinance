export function fmtCOP(n) {
  n = Number(n) || 0;
  return '$' + n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Precio por unidad real de un producto del catálogo. "valor" es el precio de
// toda la presentación (el paquete); "unidades" cuántas trae — así "3 jabones
// por 5200" (unidades=3) se puede comparar contra un jabón suelto a 2000.
export function unitPrice(item) {
  return Number(item.valor) / (Number(item.unidades) || 1);
}
