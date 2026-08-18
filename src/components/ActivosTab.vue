<script setup>
import { ref, computed } from 'vue';
import { useFinanceStore } from '../stores/finance';
import { fmtCOP } from '../lib/format';
import { ASSET_TIPO_LABELS } from '../lib/labels';

const store = useFinanceStore();

const tipo = ref('cuenta');
const subtipo = ref('');
const entidad = ref('');
const nombre = ref('');
const moneda = ref('COP');
const valor = ref('');
const tasa = ref('');
const venc = ref('');
const fecha = ref('');

const isCdt = computed(() => tipo.value === 'cdt');
const isPts = computed(() => tipo.value === 'puntos');
const isInv = computed(() => tipo.value === 'inversion');

const sortedAssets = computed(() => store.assets.slice().sort((x, y) => (y.fecha || '').localeCompare(x.fecha || '')));

function valTxt(a) {
  const isPtsRow = a.tipo === 'puntos';
  const mon = a.moneda || 'COP';
  if (isPtsRow) return Number(a.valor || 0).toLocaleString('es-CO') + ' pts';
  if (mon === 'USD') return 'US$ ' + Number(a.valor || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  return fmtCOP(a.valor);
}

async function addAsset() {
  if (!entidad.value.trim() || valor.value === '') { alert('Completa al menos la entidad y el valor.'); return; }
  const asset = {
    tipo: tipo.value,
    subtipo: subtipo.value.trim(),
    entidad: entidad.value.trim(),
    nombre: nombre.value.trim(),
    moneda: tipo.value === 'puntos' ? undefined : moneda.value,
    valor: Number(valor.value),
    tasa: tasa.value || null,
    venc: venc.value || null,
    fecha: fecha.value || null,
  };
  try {
    await store.addAsset(asset);
  } catch (e) { alert('No se pudo guardar el activo.'); return; }
  subtipo.value = ''; entidad.value = ''; nombre.value = ''; valor.value = ''; tasa.value = ''; venc.value = ''; fecha.value = '';
}

async function removeAsset(id) {
  try {
    await store.removeAsset(id);
  } catch (e) { alert('No se pudo eliminar el activo.'); }
}
</script>

<template>
  <div class="mf-tab-panel">
  <div class="mf-section-title">Agregar activo</div>
  <div class="mf-form">
    <label>Tipo
      <select v-model="tipo">
        <option value="cuenta">Cuenta de ahorro</option>
        <option value="cdt">CDT</option>
        <option value="inversion">Inversión</option>
        <option value="puntos">Puntos / millas</option>
      </select>
    </label>
    <label v-if="isInv">Tipo de inversión<input v-model="subtipo" placeholder="Littio, acciones, fondo, cripto..." /></label>
    <label>Entidad<input v-model="entidad" placeholder="Bancolombia, Porvenir, Littio..." /></label>
    <label>Nombre / apodo<input v-model="nombre" placeholder="Ahorro programado" /></label>
    <label v-if="!isPts">Moneda
      <select v-model="moneda">
        <option value="COP">Pesos (COP)</option>
        <option value="USD">Dólares (USD)</option>
      </select>
    </label>
    <label>{{ isPts ? 'Puntos' : 'Valor' }}<input v-model="valor" type="number" step="1" /></label>
    <label v-if="isCdt">Tasa E.A. (%)<input v-model="tasa" type="number" step="0.01" /></label>
    <label v-if="isCdt">Vence<input v-model="venc" type="date" /></label>
    <label>Fecha corte<input v-model="fecha" type="date" /></label>
    <div class="mf-form-actions"><button class="mf-btn" @click="addAsset">Agregar</button></div>
  </div>

  <div class="mf-section-title">Tus activos</div>
  <p v-if="!store.assets.length" class="mf-empty">Aún no has agregado cuentas, CDT, inversiones ni puntos.</p>
  <table v-else class="mf-table">
    <thead><tr><th>Tipo</th><th>Entidad</th><th>Nombre</th><th>Fecha corte</th><th style="text-align:right">Valor</th><th></th></tr></thead>
    <tbody>
      <tr v-for="a in sortedAssets" :key="a.id">
        <td>
          {{ ASSET_TIPO_LABELS[a.tipo] || a.tipo }}
          <div v-if="a.tipo === 'inversion' && a.subtipo" class="mf-note">{{ a.subtipo }}</div>
          <div v-if="a.tipo === 'cdt' && a.tasa" class="mf-note">{{ a.tasa }}% E.A.<template v-if="a.venc"> · vence {{ a.venc }}</template></div>
        </td>
        <td>{{ a.entidad || '—' }}</td>
        <td>{{ a.nombre || '—' }}</td>
        <td>{{ a.fecha || '—' }}</td>
        <td class="mf-num">{{ valTxt(a) }}</td>
        <td><button class="mf-del" @click="removeAsset(a.id)">Eliminar</button></td>
      </tr>
    </tbody>
  </table>
  </div>
</template>
