<script setup>
import { ref, computed } from 'vue';
import { useFinanceStore } from '../stores/finance';
import { fmtCOP } from '../lib/format';
import { collectAlerts } from '../lib/alerts';
import ScoreRing from './ScoreRing.vue';
import AlertList from './AlertList.vue';

const store = useFinanceStore();

const isCopAsset = (a) => ['cuenta', 'cdt', 'inversion'].includes(a.tipo) && (a.moneda || 'COP') === 'COP';
const isUsdAsset = (a) => ['cuenta', 'cdt', 'inversion'].includes(a.tipo) && a.moneda === 'USD';

const totalPlata = computed(() => store.assets.filter(isCopAsset).reduce((s, a) => s + Number(a.valor || 0), 0));
const totalUsd = computed(() => store.assets.filter(isUsdAsset).reduce((s, a) => s + Number(a.valor || 0), 0));
const porTipo = computed(() => {
  const map = {};
  store.assets.filter(isCopAsset).forEach((a) => { map[a.tipo] = (map[a.tipo] || 0) + Number(a.valor || 0); });
  return map;
});
const puntos = computed(() => store.assets.filter((a) => a.tipo === 'puntos'));
const trmNum = computed(() => Number(store.trm) || 0);

const movesMonth = computed(() => {
  const ym = new Date().toISOString().slice(0, 7);
  return store.moves.filter((m) => m.fecha && m.fecha.slice(0, 7) === ym);
});
const ingresos = computed(() => movesMonth.value.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.valor || 0), 0));
const gastos = computed(() => movesMonth.value.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + Number(m.valor || 0), 0));
const neto = computed(() => ingresos.value - gastos.value);

const catList = computed(() => {
  const totals = {};
  movesMonth.value.filter((m) => m.tipo === 'gasto').forEach((m) => {
    const c = m.categoria || 'Otros';
    totals[c] = (totals[c] || 0) + Number(m.valor || 0);
  });
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
});
const maxCat = computed(() => (catList.value.length ? catList.value[0][1] : 0));

const TIPO_LABELS = { cuenta: 'Cuentas de ahorro', cdt: 'CDT', inversion: 'Inversiones (COP)' };
const totalDeuda = computed(() => store.debts.reduce((s, d) => s + Number(d.saldo || 0), 0));
const patrimonioNeto = computed(() => totalPlata.value - totalDeuda.value);

const alerts = computed(() => collectAlerts(store));

const trmInput = ref(store.trm || '');
async function saveTrm() {
  try {
    await store.saveTrm(trmInput.value);
  } catch (e) {
    alert('No se pudo guardar la TRM.');
  }
}

const scoreVal = ref(store.creditScore.score || '');
const scoreMax = ref(store.creditScore.max || 950);
const scoreFecha = ref(store.creditScore.fecha || '');
async function saveScore() {
  try {
    await store.saveCreditScore({ score: scoreVal.value, max: scoreMax.value || 950, fecha: scoreFecha.value });
  } catch (e) {
    alert('No se pudo guardar el puntaje.');
  }
}
</script>

<template>
  <div class="mf-tab-panel">
  <AlertList :alerts="alerts" />

  <div class="mf-section-title">Puntaje crediticio</div>
  <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-bottom:8px">
    <ScoreRing :score="store.creditScore.score" :max="store.creditScore.max" />
    <div class="mf-form" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));flex:1;min-width:260px;margin-bottom:0">
      <label>Puntaje<input v-model="scoreVal" type="number" placeholder="Ej: 720" /></label>
      <label>Máximo<input v-model="scoreMax" type="number" /></label>
      <label>Fecha de consulta<input v-model="scoreFecha" type="date" /></label>
      <div class="mf-form-actions"><button class="mf-btn secondary" @click="saveScore">Guardar</button></div>
    </div>
  </div>
  <p class="mf-note">Este puntaje lo ingresas tú mismo después de consultarlo en Datacrédito, Cifin o tu banco — la app no puede consultarlo por ti.</p>

  <div class="mf-section-title">Patrimonio total</div>
  <div class="mf-cards">
    <div class="mf-card"><div class="lbl">Total en pesos</div><div class="val">{{ fmtCOP(totalPlata) }}</div></div>
    <div v-for="(v, k) in porTipo" :key="k" class="mf-card"><div class="lbl">{{ TIPO_LABELS[k] || k }}</div><div class="val">{{ fmtCOP(v) }}</div></div>
    <template v-if="totalDeuda > 0">
      <div class="mf-card"><div class="lbl">Deuda total</div><div class="val mf-neg">{{ fmtCOP(totalDeuda) }}</div></div>
      <div class="mf-card"><div class="lbl">Patrimonio neto</div><div class="val" :class="patrimonioNeto >= 0 ? 'mf-pos' : 'mf-neg'">{{ fmtCOP(patrimonioNeto) }}</div></div>
    </template>
  </div>

  <template v-if="totalUsd > 0">
    <div class="mf-section-title">En dólares</div>
    <div class="mf-form" style="grid-template-columns:repeat(auto-fit,minmax(168px,1fr));">
      <label>TRM manual (COP por USD)<input v-model="trmInput" type="number" step="0.01" placeholder="Ej: 4100" /></label>
      <div class="mf-form-actions"><button class="mf-btn secondary" @click="saveTrm">Guardar TRM</button></div>
    </div>
    <div class="mf-cards">
      <div class="mf-card"><div class="lbl">Total en USD</div><div class="val">US$ {{ totalUsd.toLocaleString('en-US', { maximumFractionDigits: 2 }) }}</div></div>
      <div v-if="trmNum > 0" class="mf-card"><div class="lbl">Equivalente en COP (TRM {{ trmNum }})</div><div class="val">{{ fmtCOP(totalUsd * trmNum) }}</div></div>
    </div>
    <p class="mf-note">La TRM la ingresas tú manualmente — la app no tiene acceso a internet para traer la tasa del día automáticamente.</p>
  </template>

  <template v-if="puntos.length">
    <div class="mf-section-title">Puntos y millas</div>
    <div class="mf-cards">
      <div v-for="p in puntos" :key="p.id" class="mf-card"><div class="lbl">{{ p.entidad || p.nombre }}</div><div class="val">{{ Number(p.valor || 0).toLocaleString('es-CO') }} pts</div></div>
    </div>
  </template>

  <div class="mf-section-title">Este mes</div>
  <div class="mf-cards">
    <div class="mf-card"><div class="lbl">Ingresos</div><div class="val mf-pos">{{ fmtCOP(ingresos) }}</div></div>
    <div class="mf-card"><div class="lbl">Gastos</div><div class="val mf-neg">{{ fmtCOP(gastos) }}</div></div>
    <div class="mf-card"><div class="lbl">Balance neto</div><div class="val" :class="neto >= 0 ? 'mf-pos' : 'mf-neg'">{{ fmtCOP(neto) }}</div></div>
  </div>

  <div class="mf-section-title">Gastos por categoría (mes actual)</div>
  <p v-if="!catList.length" class="mf-empty">Todavía no hay gastos registrados este mes.</p>
  <div v-else>
    <div v-for="[c, v] in catList" :key="c" class="mf-bar-row">
      <div class="mf-bar-label">{{ c }}</div>
      <div class="mf-bar-track"><div class="mf-bar-fill" :style="{ width: (maxCat ? (v / maxCat * 100) : 0) + '%' }"></div></div>
      <div class="mf-bar-val">{{ fmtCOP(v) }}</div>
    </div>
  </div>
  </div>
</template>
