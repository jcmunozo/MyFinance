<script setup>
import { ref, computed } from 'vue';
import { useFinanceStore } from '../stores/finance';
import { fmtCOP } from '../lib/format';

const store = useFinanceStore();

const fecha = ref('');
const tienda = ref('');
const marca = ref('');
const pais = ref('Colombia');
const depto = ref('');
const ciudad = ref('');
const pago = ref('Efectivo');

const draftItems = ref([{ nombre: '', valor: '', peso: '' }]);
function addItemRow() { draftItems.value.push({ nombre: '', valor: '', peso: '' }); }
function removeItemRow(i) {
  draftItems.value.splice(i, 1);
  if (!draftItems.value.length) draftItems.value = [{ nombre: '', valor: '', peso: '' }];
}

async function saveInvoice() {
  const items = draftItems.value
    .filter((it) => it.nombre.trim() && it.valor !== '')
    .map((it) => ({ nombre: it.nombre.trim(), valor: Number(it.valor), peso: it.peso.trim() }));
  if (!fecha.value || !tienda.value.trim() || !items.length) {
    alert('Completa la fecha, la tienda y al menos un ítem con nombre y valor.');
    return;
  }
  const total = items.reduce((s, it) => s + it.valor, 0);
  try {
    await store.addInvoice({
      fecha: fecha.value, tienda: tienda.value.trim(), marca: marca.value.trim(), pais: pais.value.trim(),
      depto: depto.value.trim(), ciudad: ciudad.value.trim(), pago: pago.value, items, total,
    });
  } catch (e) { alert('No se pudo guardar la factura.'); return; }
  fecha.value = ''; tienda.value = ''; marca.value = ''; depto.value = ''; ciudad.value = '';
  draftItems.value = [{ nombre: '', valor: '', peso: '' }];
}

const query = ref('');
const priceMatches = computed(() => {
  const allItems = [];
  store.invoices.forEach((inv) => {
    (inv.items || []).forEach((it) => {
      allItems.push({ ...it, tienda: inv.tienda, marca: inv.marca, ciudad: inv.ciudad, depto: inv.depto, fecha: inv.fecha });
    });
  });
  const q = query.value.trim().toLowerCase();
  const matches = q ? allItems.filter((it) => it.nombre.toLowerCase().includes(q)) : allItems;
  return matches.slice().sort((a, b) => Number(a.valor) - Number(b.valor)).slice(0, 20);
});
const minPrice = computed(() => (priceMatches.value.length ? Number(priceMatches.value[0].valor) : null));

const openInvoice = ref(null);
function toggleInvoice(id) { openInvoice.value = openInvoice.value === id ? null : id; }
async function removeInvoice(id) {
  try {
    await store.removeInvoice(id);
  } catch (e) { alert('No se pudo eliminar la factura.'); }
}
const sortedInvoices = computed(() => store.invoices.slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')));
</script>

<template>
  <div class="mf-tab-panel">
  <div class="mf-section-title">Registrar factura</div>
  <div class="mf-form" style="grid-template-columns:repeat(auto-fit,minmax(158px,1fr));">
    <label>Fecha<input v-model="fecha" type="date" /></label>
    <label>Tienda<input v-model="tienda" placeholder="Éxito Calle 80" /></label>
    <label>Marca / cadena<input v-model="marca" placeholder="Éxito, D1, Jumbo..." /></label>
    <label>País<input v-model="pais" placeholder="Colombia" /></label>
    <label>Departamento<input v-model="depto" placeholder="Cundinamarca" /></label>
    <label>Ciudad<input v-model="ciudad" placeholder="Bogotá" /></label>
    <label>Forma de pago
      <select v-model="pago">
        <option>Efectivo</option>
        <option>Tarjeta débito</option>
        <option>Tarjeta crédito</option>
        <option>Nequi / Daviplata</option>
        <option>Transferencia</option>
      </select>
    </label>
  </div>

  <div class="mf-note" style="margin-bottom:6px">Ítems de la factura</div>
  <div class="mf-items-list">
    <div v-for="(it, i) in draftItems" :key="i" class="mf-item-row">
      <input v-model="it.nombre" placeholder="Nombre del producto" />
      <input v-model="it.valor" type="number" step="1" placeholder="Valor" />
      <input v-model="it.peso" placeholder="Peso / cant." />
      <button class="mf-del" @click="removeItemRow(i)">Quitar</button>
    </div>
  </div>
  <div class="mf-form-actions" style="margin-bottom:14px">
    <button class="mf-btn secondary" @click="addItemRow">Agregar ítem</button>
    <button class="mf-btn" @click="saveInvoice">Guardar factura</button>
  </div>

  <div class="mf-section-title">Comparador de precios</div>
  <input v-model="query" class="mf-search" placeholder="Busca un producto para ver dónde sale más barato, ej: arroz" />
  <p v-if="!priceMatches.length" class="mf-empty">{{ query.trim() ? 'No hay coincidencias en tus facturas guardadas.' : 'Escribe un producto para comparar precios entre tus facturas.' }}</p>
  <table v-else class="mf-table">
    <thead><tr><th>Producto</th><th>Tienda</th><th>Marca</th><th>Ciudad / depto</th><th>Fecha</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>
      <tr v-for="(m, i) in priceMatches" :key="i">
        <td>{{ m.nombre }}<span v-if="m.peso" class="mf-note"> ({{ m.peso }})</span></td>
        <td>{{ m.tienda || '—' }}</td>
        <td>{{ m.marca || '—' }}</td>
        <td>{{ [m.ciudad, m.depto].filter(Boolean).join(', ') || '—' }}</td>
        <td>{{ m.fecha || '—' }}</td>
        <td class="mf-num">{{ fmtCOP(m.valor) }} <span v-if="Number(m.valor) === minPrice" class="mf-badge cheap">más barato</span></td>
      </tr>
    </tbody>
  </table>

  <div class="mf-section-title">Facturas guardadas</div>
  <p v-if="!store.invoices.length" class="mf-empty">Aún no has guardado facturas.</p>
  <div v-else>
    <div v-for="inv in sortedInvoices" :key="inv.id" class="mf-invoice-card">
      <div class="mf-invoice-head" @click="toggleInvoice(inv.id)">
        <span>{{ inv.fecha || '—' }} · {{ inv.tienda }}<template v-if="inv.marca"> ({{ inv.marca }})</template></span>
        <span class="mf-num">{{ fmtCOP(inv.total) }}</span>
      </div>
      <div class="mf-invoice-body" :class="{ open: openInvoice === inv.id }">
        <p class="mf-note">{{ [inv.ciudad, inv.depto, inv.pais].filter(Boolean).join(', ') }} · Pago: {{ inv.pago || '—' }}</p>
        <table class="mf-table">
          <thead><tr><th>Ítem</th><th>Peso / cant.</th><th style="text-align:right">Valor</th></tr></thead>
          <tbody>
            <tr v-for="(it, i) in inv.items" :key="i"><td>{{ it.nombre }}</td><td>{{ it.peso || '—' }}</td><td class="mf-num">{{ fmtCOP(it.valor) }}</td></tr>
          </tbody>
        </table>
        <div class="mf-form-actions" style="margin-top:8px"><button class="mf-del" @click.stop="removeInvoice(inv.id)">Eliminar factura</button></div>
      </div>
    </div>
  </div>
  </div>
</template>
