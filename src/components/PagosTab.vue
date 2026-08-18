<script setup>
import { ref, computed } from 'vue';
import { useFinanceStore } from '../stores/finance';
import { fmtCOP } from '../lib/format';
import { daysBetween, billStatus } from '../lib/dates';
import { BILL_LABELS, DEBT_LABELS } from '../lib/labels';

const store = useFinanceStore();

// Tarjetas / servicios
const bTipo = ref('tarjeta');
const bEntidad = ref('');
const bNombre = ref('');
const bDia = ref('');
const bValor = ref('');
async function addBill() {
  if (!bEntidad.value.trim() || !bDia.value) { alert('Completa al menos la entidad y el día de pago.'); return; }
  try {
    await store.addBill({ tipo: bTipo.value, entidad: bEntidad.value.trim(), nombre: bNombre.value.trim(), dia: Number(bDia.value), valor: Number(bValor.value || 0), lastPaidYm: null });
  } catch (e) { alert('No se pudo guardar la tarjeta/servicio.'); return; }
  bEntidad.value = ''; bNombre.value = ''; bDia.value = ''; bValor.value = '';
}
async function payBill(id) {
  try {
    await store.payBill(id);
  } catch (e) { alert('No se pudo marcar como pagado.'); }
}
async function removeBill(id) {
  try {
    await store.removeBill(id);
  } catch (e) { alert('No se pudo eliminar.'); }
}
const sortedBills = computed(() => store.bills.slice().sort((x, y) => Number(x.dia) - Number(y.dia)));
function dueStr(b) { return billStatus(b).due.toISOString().slice(0, 10); }
function statusFor(b) {
  const st = billStatus(b);
  if (st.paidThisMonth) return { cls: 'ok', text: 'pagado este mes' };
  if (st.overdue) return { cls: 'overdue', text: 'vencido' };
  if (st.daysUntil <= 5) return { cls: 'soon', text: `en ${st.daysUntil}d` };
  return { cls: 'ok', text: 'al día' };
}

// CDT (leídos de Activos)
const cdts = computed(() => store.assets.filter((a) => a.tipo === 'cdt').slice().sort((x, y) => (x.venc || '').localeCompare(y.venc || '')));
function cdtStatus(a) {
  if (!a.venc) return { cls: '', text: 'sin fecha', note: true };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const v = new Date(a.venc + 'T00:00:00');
  const diff = daysBetween(v, today);
  if (diff < 0) return { cls: 'overdue', text: `vencido hace ${Math.abs(diff)}d` };
  if (diff <= 30) return { cls: 'soon', text: `vence en ${diff}d` };
  return { cls: 'ok', text: 'vigente' };
}

// Deudas
const dTipo = ref('tarjeta');
const dEntidad = ref('');
const dSaldo = ref('');
const dTasa = ref('');
const dCuota = ref('');
const dPlazo = ref('');
async function addDebt() {
  if (!dEntidad.value.trim() || dSaldo.value === '') { alert('Completa al menos la entidad y el saldo.'); return; }
  try {
    await store.addDebt({ tipo: dTipo.value, entidad: dEntidad.value.trim(), saldo: Number(dSaldo.value), tasa: dTasa.value || null, cuota: Number(dCuota.value || 0), plazo: dPlazo.value || null });
  } catch (e) { alert('No se pudo guardar la deuda.'); return; }
  dEntidad.value = ''; dSaldo.value = ''; dTasa.value = ''; dCuota.value = ''; dPlazo.value = '';
}
async function removeDebt(id) {
  try {
    await store.removeDebt(id);
  } catch (e) { alert('No se pudo eliminar la deuda.'); }
}
const sortedDebts = computed(() => store.debts.slice().sort((x, y) => Number(y.saldo) - Number(x.saldo)));
const totalDeuda = computed(() => store.debts.reduce((s, d) => s + Number(d.saldo || 0), 0));

// Declaración de renta
const taxFecha = ref(store.taxDeclaration.fecha || '');
async function saveTax() {
  try {
    await store.saveTaxDeclaration(taxFecha.value);
  } catch (e) { alert('No se pudo guardar la fecha.'); }
}
</script>

<template>
  <div class="mf-tab-panel">
  <div class="mf-section-title">Agregar tarjeta o servicio</div>
  <div class="mf-form">
    <label>Tipo
      <select v-model="bTipo">
        <option value="tarjeta">Tarjeta de crédito</option>
        <option value="energia">Energía</option>
        <option value="agua">Agua</option>
        <option value="gas">Gas</option>
        <option value="internet_movil">Internet móvil</option>
        <option value="internet_hogar">Internet / TV hogar</option>
        <option value="otro">Otro</option>
      </select>
    </label>
    <label>Entidad<input v-model="bEntidad" placeholder="Bancolombia, Claro, EPM..." /></label>
    <label>Nombre / apodo<input v-model="bNombre" placeholder="Tarjeta oro" /></label>
    <label>Día de pago (1-31)<input v-model="bDia" type="number" min="1" max="31" /></label>
    <label>Valor aproximado (COP)<input v-model="bValor" type="number" step="1" /></label>
    <div class="mf-form-actions"><button class="mf-btn" @click="addBill">Agregar</button></div>
  </div>

  <div class="mf-section-title">Vencimientos de CDT</div>
  <p v-if="!cdts.length" class="mf-empty">No tienes CDT registrados en Activos.</p>
  <table v-else class="mf-table">
    <thead><tr><th>Entidad</th><th>Nombre</th><th>Vence</th><th style="text-align:right">Valor</th><th>Estado</th></tr></thead>
    <tbody>
      <tr v-for="a in cdts" :key="a.id">
        <td>{{ a.entidad }}</td><td>{{ a.nombre || '—' }}</td><td>{{ a.venc || '—' }}</td><td class="mf-num">{{ fmtCOP(a.valor) }}</td>
        <td>
          <span v-if="cdtStatus(a).note" class="mf-note">{{ cdtStatus(a).text }}</span>
          <span v-else class="mf-status" :class="cdtStatus(a).cls">{{ cdtStatus(a).text }}</span>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="mf-section-title">Tarjetas y servicios</div>
  <p v-if="!store.bills.length" class="mf-empty">Aún no has agregado tarjetas de crédito ni servicios.</p>
  <table v-else class="mf-table">
    <thead><tr><th>Tipo</th><th>Entidad</th><th>Nombre</th><th>Próximo pago</th><th style="text-align:right">Valor aprox.</th><th>Estado</th><th></th></tr></thead>
    <tbody>
      <tr v-for="b in sortedBills" :key="b.id">
        <td>{{ BILL_LABELS[b.tipo] || b.tipo }}</td>
        <td>{{ b.entidad || '—' }}</td>
        <td>{{ b.nombre || '—' }}</td>
        <td>{{ dueStr(b) }}</td>
        <td class="mf-num">{{ fmtCOP(b.valor) }}</td>
        <td><span class="mf-status" :class="statusFor(b).cls">{{ statusFor(b).text }}</span></td>
        <td style="white-space:nowrap">
          <button v-if="!billStatus(b).paidThisMonth" class="mf-del" style="color:var(--teal)" @click="payBill(b.id)">Marcar pagado</button>
          <button class="mf-del" @click="removeBill(b.id)">Eliminar</button>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="mf-section-title">Deudas</div>
  <div class="mf-form">
    <label>Tipo
      <select v-model="dTipo">
        <option value="tarjeta">Tarjeta de crédito</option>
        <option value="libre_inversion">Crédito libre inversión</option>
        <option value="libranza">Libranza</option>
        <option value="hipoteca">Crédito hipotecario</option>
        <option value="vehiculo">Crédito de vehículo</option>
        <option value="otro">Otro</option>
      </select>
    </label>
    <label>Entidad<input v-model="dEntidad" placeholder="Bancolombia, Falabella..." /></label>
    <label>Saldo actual (COP)<input v-model="dSaldo" type="number" step="1" /></label>
    <label>Tasa E.A. (%)<input v-model="dTasa" type="number" step="0.01" /></label>
    <label>Cuota mensual (COP)<input v-model="dCuota" type="number" step="1" /></label>
    <label>Plazo restante (meses)<input v-model="dPlazo" type="number" /></label>
    <div class="mf-form-actions"><button class="mf-btn" @click="addDebt">Agregar</button></div>
  </div>
  <p v-if="!store.debts.length" class="mf-empty">No tienes deudas registradas.</p>
  <template v-else>
    <table class="mf-table">
      <thead><tr><th>Tipo</th><th>Entidad</th><th style="text-align:right">Saldo</th><th>Tasa E.A.</th><th style="text-align:right">Cuota</th><th>Plazo</th><th></th></tr></thead>
      <tbody>
        <tr v-for="d in sortedDebts" :key="d.id">
          <td>{{ DEBT_LABELS[d.tipo] || d.tipo }}</td>
          <td>{{ d.entidad || '—' }}</td>
          <td class="mf-num">{{ fmtCOP(d.saldo) }}</td>
          <td>{{ d.tasa ? d.tasa + '%' : '—' }}</td>
          <td class="mf-num">{{ d.cuota ? fmtCOP(d.cuota) : '—' }}</td>
          <td>{{ d.plazo ? d.plazo + ' meses' : '—' }}</td>
          <td><button class="mf-del" @click="removeDebt(d.id)">Eliminar</button></td>
        </tr>
      </tbody>
    </table>
    <div class="mf-cards"><div class="mf-card"><div class="lbl">Deuda total</div><div class="val mf-neg">{{ fmtCOP(totalDeuda) }}</div></div></div>
  </template>

  <div class="mf-section-title">Declaración de renta</div>
  <div class="mf-form" style="grid-template-columns:repeat(auto-fit,minmax(168px,1fr));">
    <label>Próxima fecha límite<input v-model="taxFecha" type="date" /></label>
    <div class="mf-form-actions"><button class="mf-btn secondary" @click="saveTax">Guardar</button></div>
  </div>
  <p class="mf-note">Guarda aquí la fecha límite según tu último dígito de cédula, para que te avise cuando se acerque.</p>
  </div>
</template>
