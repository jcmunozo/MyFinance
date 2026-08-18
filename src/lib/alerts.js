import { daysBetween, billStatus, nextCheckupDate } from './dates';
import { BILL_LABELS, INS_LABELS, CHECKUP_LABELS } from './labels';

// Toma el store completo (o cualquier objeto con las mismas colecciones) y
// devuelve la misma lista de alertas que collectAlerts() tenía en el prototipo.
export function collectAlerts(state) {
  const alerts = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  state.assets.filter((a) => a.tipo === 'cdt' && a.venc).forEach((a) => {
    const v = new Date(a.venc + 'T00:00:00');
    const diff = daysBetween(v, today);
    if (diff <= 30) {
      alerts.push({
        kind: 'cdt',
        urgent: diff <= 0,
        text: diff < 0 ? `CDT de ${a.entidad} venció hace ${Math.abs(diff)} día(s)`
          : diff === 0 ? `CDT de ${a.entidad} vence hoy`
          : `CDT de ${a.entidad} vence en ${diff} día(s) (${a.venc})`,
      });
    }
  });

  state.bills.forEach((b) => {
    const st = billStatus(b);
    if (st.paidThisMonth) return;
    if (st.overdue) {
      alerts.push({ kind: 'bill', urgent: true, text: `${BILL_LABELS[b.tipo] || b.tipo} (${b.nombre || b.entidad || ''}) está vencido` });
    } else if (st.daysUntil <= 5) {
      const d = st.daysUntil;
      alerts.push({ kind: 'bill', urgent: d <= 1, text: `${BILL_LABELS[b.tipo] || b.tipo} (${b.nombre || b.entidad || ''}) vence en ${d} día(s)` });
    }
  });

  state.insurances.filter((i) => i.vigencia).forEach((i) => {
    const v = new Date(i.vigencia + 'T00:00:00');
    const diff = daysBetween(v, today);
    if (diff <= 30) {
      alerts.push({
        kind: 'seguro',
        urgent: diff <= 0,
        text: diff < 0 ? `El seguro de ${INS_LABELS[i.tipo] || i.tipo} (${i.entidad}) venció hace ${Math.abs(diff)} día(s)`
          : diff === 0 ? `El seguro de ${INS_LABELS[i.tipo] || i.tipo} (${i.entidad}) vence hoy`
          : `El seguro de ${INS_LABELS[i.tipo] || i.tipo} (${i.entidad}) vence en ${diff} día(s)`,
      });
    }
  });

  state.checkups.forEach((c) => {
    const next = nextCheckupDate(c);
    if (!next) return;
    const diff = daysBetween(next, today);
    if (diff <= 15) {
      alerts.push({
        kind: 'chequeo',
        urgent: diff <= 0,
        text: diff < 0 ? `Se te pasó el ${(CHECKUP_LABELS[c.tipo] || c.tipo).toLowerCase()} hace ${Math.abs(diff)} día(s)`
          : diff === 0 ? `Hoy toca ${(CHECKUP_LABELS[c.tipo] || c.tipo).toLowerCase()}`
          : `Te queda ${diff} día(s) para el ${(CHECKUP_LABELS[c.tipo] || c.tipo).toLowerCase()}`,
      });
    }
  });

  if (state.taxDeclaration && state.taxDeclaration.fecha) {
    const v = new Date(state.taxDeclaration.fecha + 'T00:00:00');
    const diff = daysBetween(v, today);
    if (diff <= 30) {
      alerts.push({
        kind: 'renta',
        urgent: diff <= 0,
        text: diff < 0 ? `La fecha de declaración de renta que registraste ya pasó hace ${Math.abs(diff)} día(s)`
          : diff === 0 ? `Hoy es la fecha límite para tu declaración de renta`
          : `Te quedan ${diff} día(s) para declarar renta`,
      });
    }
  }

  return alerts;
}
