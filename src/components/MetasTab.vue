<script setup>
import { ref } from 'vue';
import { useFinanceStore } from '../stores/finance';
import { fmtCOP } from '../lib/format';
import { INS_LABELS } from '../lib/labels';

const store = useFinanceStore();

const gNombre = ref('');
const gMeta = ref('');
const gActual = ref('');
async function addGoal() {
  if (!gNombre.value.trim() || gMeta.value === '') { alert('Completa al menos el nombre y la meta.'); return; }
  try {
    await store.addGoal({ nombre: gNombre.value.trim(), meta: Number(gMeta.value), actual: Number(gActual.value || 0) });
  } catch (e) { alert('No se pudo guardar la meta.'); return; }
  gNombre.value = ''; gMeta.value = ''; gActual.value = '';
}
async function removeGoal(id) {
  try {
    await store.removeGoal(id);
  } catch (e) { alert('No se pudo eliminar la meta.'); }
}
function pctGoal(g) { return g.meta > 0 ? Math.min(100, Math.round((g.actual / g.meta) * 100)) : 0; }

const insTipo = ref('vida');
const insEntidad = ref('');
const insPrima = ref('');
const insPeriodo = ref('mensual');
const insVigencia = ref('');
async function addInsurance() {
  if (!insEntidad.value.trim()) { alert('Ingresa al menos la entidad.'); return; }
  try {
    await store.addInsurance({ tipo: insTipo.value, entidad: insEntidad.value.trim(), prima: Number(insPrima.value || 0), periodo: insPeriodo.value, vigencia: insVigencia.value || null });
  } catch (e) { alert('No se pudo guardar el seguro.'); return; }
  insEntidad.value = ''; insPrima.value = ''; insVigencia.value = '';
}
async function removeInsurance(id) {
  try {
    await store.removeInsurance(id);
  } catch (e) { alert('No se pudo eliminar el seguro.'); }
}
</script>

<template>
  <div class="mf-tab-panel">
  <div class="mf-section-title">Fondo de emergencia y metas de ahorro</div>
  <div class="mf-form">
    <label>Nombre de la meta<input v-model="gNombre" placeholder="Fondo de emergencia, viaje..." /></label>
    <label>Meta (COP)<input v-model="gMeta" type="number" step="1" /></label>
    <label>Ahorrado hasta ahora (COP)<input v-model="gActual" type="number" step="1" /></label>
    <div class="mf-form-actions"><button class="mf-btn" @click="addGoal">Agregar</button></div>
  </div>
  <p v-if="!store.goals.length" class="mf-empty">Aún no has creado metas de ahorro.</p>
  <div v-else>
    <div v-for="g in store.goals" :key="g.id" style="margin-bottom:14px">
      <div class="mf-progress-lbl"><span>{{ g.nombre }}</span><span>{{ fmtCOP(g.actual) }} de {{ fmtCOP(g.meta) }} ({{ pctGoal(g) }}%)</span></div>
      <div class="mf-progress"><div class="mf-progress-fill" :style="{ width: pctGoal(g) + '%' }"></div></div>
      <div style="text-align:right;margin-top:3px"><button class="mf-del" @click="removeGoal(g.id)">Eliminar</button></div>
    </div>
  </div>

  <div class="mf-section-title">Seguros</div>
  <div class="mf-form">
    <label>Tipo
      <select v-model="insTipo">
        <option value="vida">Vida</option>
        <option value="exequial">Exequial</option>
        <option value="hogar">Hogar</option>
        <option value="auto">Auto</option>
        <option value="salud_prepagada">Salud prepagada / complementaria</option>
        <option value="otro">Otro</option>
      </select>
    </label>
    <label>Entidad<input v-model="insEntidad" placeholder="Sura, Colsanitas, Seguros Bolívar..." /></label>
    <label>Prima<input v-model="insPrima" type="number" step="1" /></label>
    <label>Periodicidad
      <select v-model="insPeriodo">
        <option value="mensual">Mensual</option>
        <option value="anual">Anual</option>
      </select>
    </label>
    <label>Vigencia hasta<input v-model="insVigencia" type="date" /></label>
    <div class="mf-form-actions"><button class="mf-btn" @click="addInsurance">Agregar</button></div>
  </div>
  <p v-if="!store.insurances.length" class="mf-empty">Aún no has registrado seguros.</p>
  <table v-else class="mf-table">
    <thead><tr><th>Tipo</th><th>Entidad</th><th style="text-align:right">Prima</th><th>Vigencia</th><th></th></tr></thead>
    <tbody>
      <tr v-for="i in store.insurances" :key="i.id">
        <td>{{ INS_LABELS[i.tipo] || i.tipo }}</td><td>{{ i.entidad || '—' }}</td>
        <td class="mf-num">{{ fmtCOP(i.prima) }} / {{ i.periodo }}</td><td>{{ i.vigencia || '—' }}</td>
        <td><button class="mf-del" @click="removeInsurance(i.id)">Eliminar</button></td>
      </tr>
    </tbody>
  </table>
  </div>
</template>
