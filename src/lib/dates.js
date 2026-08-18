export function daysBetween(a, b) {
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

export function todayYm() {
  return new Date().toISOString().slice(0, 7);
}

export function weeksBetween(startStr, endStr) {
  const start = new Date(startStr + 'T00:00:00');
  const end = endStr ? new Date(endStr + 'T00:00:00') : new Date();
  const days = Math.max(0, daysBetween(end, start));
  return Math.round(days / 7);
}

export function totalSemanas(pension, pensionPeriods) {
  const base = Number(pension.semanasCotizadas) || 0;
  const extra = pensionPeriods.reduce((s, p) => s + weeksBetween(p.inicio, p.fin), 0);
  return base + extra;
}

export function nextDueDate(dia, from) {
  const ref = from || new Date();
  dia = Math.min(Math.max(Number(dia) || 1, 1), 31);
  function buildFor(year, month) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(dia, lastDay));
  }
  let d = buildFor(ref.getFullYear(), ref.getMonth());
  const refDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  if (d < refDay) d = buildFor(ref.getFullYear(), ref.getMonth() + 1);
  return d;
}

export function billStatus(bill) {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const ym = todayYm();
  const paidThisMonth = bill.lastPaidYm === ym;
  const due = nextDueDate(bill.dia, todayOnly);
  const overdueUnpaid = !paidThisMonth && due < todayOnly;
  return { due, paidThisMonth, overdue: overdueUnpaid, daysUntil: daysBetween(due, todayOnly) };
}

export function nextCheckupDate(c) {
  if (!c.fecha || !c.frecuencia) return null;
  const last = new Date(c.fecha + 'T00:00:00');
  last.setMonth(last.getMonth() + Number(c.frecuencia));
  return last;
}
