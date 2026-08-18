<script setup>
import { ref, computed } from 'vue';
import { useFinanceStore } from '../stores/finance';
import { fmtCOP } from '../lib/format';
import { todayYm } from '../lib/dates';

const store = useFinanceStore();

const fecha = ref('');
const tipo = ref('gasto');
const categoria = ref('');
const descripcion = ref('');
const valor = ref('');

async function addMove() {
  if (!fecha.value || valor.value === '') { alert('Completa al menos la fecha y el valor.'); return; }
  try {
    await store.addMove({ fecha: fecha.value, tipo: tipo.value, categoria: categoria.value.trim(), descripcion: descripcion.value.trim(), valor: Number(valor.value) });
  } catch (e) { alert('No se pudo guardar el movimiento.'); return; }
  fecha.value = ''; categoria.value = ''; descripcion.value = ''; valor.value = '';
}
async function removeMove(id) {
  try {
    await store.removeMove(id);
  } catch (e) { alert('No se pudo eliminar el movimiento.'); }
}

const buCat = ref('');
const buLimite = ref('');
async function addBudget() {
  if (!buCat.value.trim() || buLimite.value === '') { alert('Completa la categoría y el límite.'); return; }
  try {
    await store.setBudget(buCat.value.trim(), Number(buLimite.value));
  } catch (e) { alert('No se pudo guardar el límite.'); return; }
  buCat.value = ''; buLimite.value = '';
}
async function removeBudget(cat) {
  try {
    await store.removeBudget(cat);
  } catch (e) { alert('No se pudo quitar el límite.'); }
}

const gastosMes = computed(() => {
  const ymNow = todayYm();
  const map = {};
  store.moves.filter((m) => m.tipo === 'gasto' && m.fecha && m.fecha.slice(0, 7) === ymNow).forEach((m) => {
    const c = m.categoria || 'Otros';
    map[c] = (map[c] || 0) + Number(m.valor || 0);
  });
  return map;
});
function pctFor(cat) {
  const limite = Number(store.budgets[cat]) || 0;
  const gastado = gastosMes.value[cat] || 0;
  return limite > 0 ? Math.min(100, Math.round((gastado / limite) * 100)) : 0;
}
function isOver(cat) {
  const limite = Number(store.budgets[cat]) || 0;
  const gastado = gastosMes.value[cat] || 0;
  return gastado > limite && limite > 0;
}

const sortedMoves = computed(() => store.moves.slice().sort((x, y) => (y.fecha || '').localeCompare(x.fecha || '')));
</script>

<template>
  <div class="mf-tab-panel">
  <div class="mf-section-title">Agregar movimiento</div>
  <div class="mf-form">
    <label>Fecha<input v-model="fecha" type="date" /></label>
    <label>Tipo
      <select v-model="tipo">
        <option value="gasto">Gasto</option>
        <option value="ingreso">Ingreso</option>
      </select>
    </label>
    <label>Categoría<input v-model="categoria" placeholder="Mercado, transporte, arriendo..." /></label>
    <label>Descripción<input v-model="descripcion" placeholder="Opcional" /></label>
    <label>Valor (COP)<input v-model="valor" type="number" step="1" /></label>
    <div class="mf-form-actions"><button class="mf-btn" @click="addMove">Agregar</button></div>
  </div>

  <div class="mf-section-title">Presupuesto por categoría (mes actual)</div>
  <div class="mf-form">
    <label>Categoría<input v-model="buCat" placeholder="Mercado, transporte..." /></label>
    <label>Límite mensual (COP)<input v-model="buLimite" type="number" step="1" /></label>
    <div class="mf-form-actions"><button class="mf-btn secondary" @click="addBudget">Guardar límite</button></div>
  </div>
  <p v-if="!Object.keys(store.budgets).length" class="mf-empty">Aún no has puesto límites de gasto por categoría.</p>
  <div v-else>
    <div v-for="(limite, c) in store.budgets" :key="c" style="margin-bottom:12px">
      <div class="mf-progress-lbl"><span>{{ c }}</span><span :class="isOver(c) ? 'mf-neg' : ''">{{ fmtCOP(gastosMes[c] || 0) }} de {{ fmtCOP(limite) }}</span></div>
      <div class="mf-progress"><div class="mf-progress-fill" :style="{ width: pctFor(c) + '%', background: isOver(c) ? 'var(--red)' : 'var(--green)' }"></div></div>
      <div style="text-align:right;margin-top:3px"><button class="mf-del" @click="removeBudget(c)">Quitar límite</button></div>
    </div>
  </div>

  <div class="mf-section-title">Historial</div>
  <p v-if="!store.moves.length" class="mf-empty">Aún no has registrado ingresos ni gastos.</p>
  <table v-else class="mf-table">
    <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th style="text-align:right">Valor</th><th></th></tr></thead>
    <tbody>
      <tr v-for="m in sortedMoves" :key="m.id">
        <td>{{ m.fecha || '—' }}</td>
        <td>{{ m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto' }}</td>
        <td>{{ m.categoria || '—' }}</td>
        <td>{{ m.descripcion || '—' }}</td>
        <td class="mf-num" :class="m.tipo === 'ingreso' ? 'mf-pos' : 'mf-neg'">{{ m.tipo === 'ingreso' ? '+' : '-' }}{{ fmtCOP(m.valor) }}</td>
        <td><button class="mf-del" @click="removeMove(m.id)">Eliminar</button></td>
      </tr>
    </tbody>
  </table>
  </div>
</template>
