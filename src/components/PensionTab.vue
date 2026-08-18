<script setup>
import { ref, computed } from 'vue';
import { useFinanceStore } from '../stores/finance';
import { fmtCOP } from '../lib/format';
import { totalSemanas, weeksBetween, nextCheckupDate } from '../lib/dates';
import { AFF_LABELS, CHECKUP_LABELS } from '../lib/labels';

const store = useFinanceStore();

const pFondo = ref(store.pension.fondo);
const pAdmin = ref(store.pension.administradora);
const pSemanas = ref(store.pension.semanasCotizadas);
const pFecha = ref(store.pension.fechaCorte);
const pMeta = ref(store.pension.metaSemanas);

const total = computed(() => totalSemanas(store.pension, store.pensionPeriods));
const meta = computed(() => Number(store.pension.metaSemanas) || 1300);
const pct = computed(() => Math.min(100, Math.round((total.value / meta.value) * 100)));

async function savePension() {
  const pension = { fondo: pFondo.value, administradora: pAdmin.value.trim(), semanasCotizadas: pSemanas.value, fechaCorte: pFecha.value, metaSemanas: pMeta.value };
  try {
    await store.savePension(pension);
  } catch (e) { alert('No se pudo guardar la información de pensión.'); }
}

// Periodos
const ppEmp = ref('');
const ppInicio = ref('');
const ppFin = ref('');
async function addPeriod() {
  if (!ppInicio.value) { alert('Ingresa al menos la fecha de inicio.'); return; }
  try {
    await store.addPensionPeriod({ emp: ppEmp.value.trim(), inicio: ppInicio.value, fin: ppFin.value || null });
  } catch (e) { alert('No se pudo guardar el periodo.'); return; }
  ppEmp.value = ''; ppInicio.value = ''; ppFin.value = '';
}
async function removePeriod(id) {
  try {
    await store.removePensionPeriod(id);
  } catch (e) { alert('No se pudo eliminar el periodo.'); }
}

// Cesantías
const cEntidad = ref('');
const cNombre = ref('');
const cValor = ref('');
const cFecha = ref('');
const totalCesantias = computed(() => store.cesantias.reduce((s, c) => s + Number(c.valor || 0), 0));
async function addCesantia() {
  if (!cEntidad.value.trim() || cValor.value === '') { alert('Completa al menos la entidad y el valor.'); return; }
  try {
    await store.addCesantia({ entidad: cEntidad.value.trim(), nombre: cNombre.value.trim(), valor: Number(cValor.value), fecha: cFecha.value || null });
  } catch (e) { alert('No se pudo guardar.'); return; }
  cEntidad.value = ''; cNombre.value = ''; cValor.value = ''; cFecha.value = '';
}
async function removeCesantia(id) {
  try {
    await store.removeCesantia(id);
  } catch (e) { alert('No se pudo eliminar.'); }
}
const sortedCesantias = computed(() => store.cesantias.slice().sort((x, y) => (y.fecha || '').localeCompare(x.fecha || '')));

// Afiliaciones
const afTipo = ref('eps');
const afEntidad = ref('');
const afRegimen = ref('');
const afIbc = ref('');
async function addAffiliation() {
  if (!afEntidad.value.trim()) { alert('Ingresa al menos la entidad.'); return; }
  try {
    await store.addAffiliation({ tipo: afTipo.value, entidad: afEntidad.value.trim(), regimen: afRegimen.value.trim(), ibc: Number(afIbc.value || 0) });
  } catch (e) { alert('No se pudo guardar.'); return; }
  afEntidad.value = ''; afRegimen.value = ''; afIbc.value = '';
}
async function removeAffiliation(id) {
  try {
    await store.removeAffiliation(id);
  } catch (e) { alert('No se pudo eliminar.'); }
}

// Chequeos
const chTipo = ref('general');
const chFecha = ref('');
const chFrecuencia = ref(12);
async function addCheckup() {
  if (!chFecha.value) { alert('Ingresa la última fecha en que te lo hiciste.'); return; }
  try {
    await store.addCheckup({ tipo: chTipo.value, fecha: chFecha.value, frecuencia: Number(chFrecuencia.value || 12) });
  } catch (e) { alert('No se pudo guardar.'); return; }
  chFecha.value = ''; chFrecuencia.value = 12;
}
async function removeCheckup(id) {
  try {
    await store.removeCheckup(id);
  } catch (e) { alert('No se pudo eliminar.'); }
}
function nextCheckupStr(c) {
  const next = nextCheckupDate(c);
  return next ? next.toISOString().slice(0, 10) : '—';
}
</script>

<template>
  <div class="mf-tab-panel">
  <div class="mf-section-title">Semanas cotizadas a pensión</div>
  <div class="mf-form">
    <label>Fondo
      <select v-model="pFondo">
        <option value="RPM">RPM (Colpensiones)</option>
        <option value="RAIS">RAIS (fondo privado)</option>
      </select>
    </label>
    <label>Administradora<input v-model="pAdmin" placeholder="Colpensiones, Porvenir..." /></label>
    <label>Semanas según certificado<input v-model="pSemanas" type="number" /></label>
    <label>Fecha del certificado<input v-model="pFecha" type="date" /></label>
    <label>Meta de semanas<input v-model="pMeta" type="number" /></label>
    <div class="mf-form-actions"><button class="mf-btn" @click="savePension">Guardar</button></div>
  </div>

  <div class="mf-progress-lbl"><span>{{ total.toLocaleString('es-CO') }} semanas</span><span>Meta: {{ meta.toLocaleString('es-CO') }}</span></div>
  <div class="mf-progress"><div class="mf-progress-fill" :style="{ width: pct + '%' }"></div></div>
  <p class="mf-note">{{ pct }}% de tu meta. Este total suma las semanas de tu último certificado más los periodos que agregues abajo. Verifica tu historial real (PILA) en Colpensiones o tu AFP de vez en cuando.</p>

  <div class="mf-section-title">Periodos cotizados desde el certificado</div>
  <div class="mf-form">
    <label>Empleador / actividad<input v-model="ppEmp" placeholder="Independiente, Empresa S.A.S..." /></label>
    <label>Fecha inicio<input v-model="ppInicio" type="date" /></label>
    <label>Fecha fin (vacío si sigue activo)<input v-model="ppFin" type="date" /></label>
    <div class="mf-form-actions"><button class="mf-btn" @click="addPeriod">Agregar periodo</button></div>
  </div>
  <p v-if="!store.pensionPeriods.length" class="mf-empty">Aún no has agregado periodos adicionales.</p>
  <table v-else class="mf-table">
    <thead><tr><th>Empleador</th><th>Desde</th><th>Hasta</th><th style="text-align:right">Semanas</th><th></th></tr></thead>
    <tbody>
      <tr v-for="p in store.pensionPeriods" :key="p.id">
        <td>{{ p.emp || '—' }}</td><td>{{ p.inicio }}</td><td>{{ p.fin || 'Activo' }}</td>
        <td class="mf-num">{{ weeksBetween(p.inicio, p.fin) }}</td>
        <td><button class="mf-del" @click="removePeriod(p.id)">Eliminar</button></td>
      </tr>
    </tbody>
  </table>

  <div class="mf-section-title">Cesantías</div>
  <p class="mf-note" style="margin-bottom:8px">Este dinero no se suma a tu patrimonio disponible en el Resumen, porque normalmente no puedes usarlo de forma libre.</p>
  <div class="mf-form">
    <label>Entidad<input v-model="cEntidad" placeholder="Porvenir, Colpensiones, Protección..." /></label>
    <label>Nombre / apodo<input v-model="cNombre" placeholder="Opcional" /></label>
    <label>Valor (COP)<input v-model="cValor" type="number" step="1" /></label>
    <label>Fecha de corte<input v-model="cFecha" type="date" /></label>
    <div class="mf-form-actions"><button class="mf-btn" @click="addCesantia">Agregar</button></div>
  </div>
  <p v-if="!store.cesantias.length" class="mf-empty">No tienes cesantías registradas.</p>
  <template v-else>
    <table class="mf-table">
      <thead><tr><th>Entidad</th><th>Nombre</th><th>Fecha corte</th><th style="text-align:right">Valor</th><th></th></tr></thead>
      <tbody>
        <tr v-for="c in sortedCesantias" :key="c.id">
          <td>{{ c.entidad || '—' }}</td><td>{{ c.nombre || '—' }}</td><td>{{ c.fecha || '—' }}</td>
          <td class="mf-num">{{ fmtCOP(c.valor) }}</td>
          <td><button class="mf-del" @click="removeCesantia(c.id)">Eliminar</button></td>
        </tr>
      </tbody>
    </table>
    <div class="mf-cards"><div class="mf-card"><div class="lbl">Total cesantías</div><div class="val">{{ fmtCOP(totalCesantias) }}</div></div></div>
  </template>

  <div class="mf-section-title">Salud, ARL y caja de compensación</div>
  <div class="mf-form">
    <label>Tipo
      <select v-model="afTipo">
        <option value="eps">EPS</option>
        <option value="arl">ARL</option>
        <option value="caja">Caja de compensación</option>
        <option value="pension_vol">Pensión voluntaria</option>
      </select>
    </label>
    <label>Entidad<input v-model="afEntidad" placeholder="Sura, Compensar, Nueva EPS..." /></label>
    <label>Régimen / plan<input v-model="afRegimen" placeholder="Contributivo, riesgo I..." /></label>
    <label>IBC / aporte mensual (COP)<input v-model="afIbc" type="number" step="1" /></label>
    <div class="mf-form-actions"><button class="mf-btn" @click="addAffiliation">Agregar</button></div>
  </div>
  <p v-if="!store.affiliations.length" class="mf-empty">Aún no has agregado tus afiliaciones de salud.</p>
  <table v-else class="mf-table">
    <thead><tr><th>Tipo</th><th>Entidad</th><th>Régimen / plan</th><th style="text-align:right">IBC / aporte</th><th></th></tr></thead>
    <tbody>
      <tr v-for="a in store.affiliations" :key="a.id">
        <td>{{ AFF_LABELS[a.tipo] || a.tipo }}</td><td>{{ a.entidad || '—' }}</td><td>{{ a.regimen || '—' }}</td>
        <td class="mf-num">{{ fmtCOP(a.ibc) }}</td>
        <td><button class="mf-del" @click="removeAffiliation(a.id)">Eliminar</button></td>
      </tr>
    </tbody>
  </table>

  <div class="mf-section-title">Chequeos médicos preventivos</div>
  <div class="mf-form">
    <label>Tipo
      <select v-model="chTipo">
        <option value="general">Examen médico general</option>
        <option value="visual">Examen visual</option>
        <option value="odontologia">Odontología</option>
        <option value="otro">Otro</option>
      </select>
    </label>
    <label>Última fecha<input v-model="chFecha" type="date" /></label>
    <label>Cada cuántos meses<input v-model="chFrecuencia" type="number" /></label>
    <div class="mf-form-actions"><button class="mf-btn" @click="addCheckup">Agregar</button></div>
  </div>
  <p v-if="!store.checkups.length" class="mf-empty">Aún no has registrado chequeos médicos.</p>
  <table v-else class="mf-table">
    <thead><tr><th>Tipo</th><th>Última vez</th><th>Frecuencia</th><th>Próximo</th><th></th></tr></thead>
    <tbody>
      <tr v-for="c in store.checkups" :key="c.id">
        <td>{{ CHECKUP_LABELS[c.tipo] || c.tipo }}</td><td>{{ c.fecha || '—' }}</td><td>cada {{ c.frecuencia }} meses</td>
        <td>{{ nextCheckupStr(c) }}</td>
        <td><button class="mf-del" @click="removeCheckup(c.id)">Eliminar</button></td>
      </tr>
    </tbody>
  </table>
  </div>
</template>
