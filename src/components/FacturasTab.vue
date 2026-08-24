<script setup>
import { ref, computed } from 'vue';
import { useFinanceStore } from '../stores/finance';
import { fmtCOP } from '../lib/format';
import ItemPickerModal from './ItemPickerModal.vue';

const store = useFinanceStore();

const fecha = ref('');
const tienda = ref('');
const marca = ref('');
const pais = ref('Colombia');
const depto = ref('');
const ciudad = ref('');
const pago = ref('Efectivo');
const debtId = ref('');

const tarjetas = computed(() => store.debts.filter((d) => d.tipo === 'tarjeta'));

// Líneas de la factura en construcción: cada una referencia un producto del
// catálogo (item_id) más la cantidad comprada. El precio/nombre/marca se
// muestran desde el item elegido, pero no se guardan sueltos — al enviar la
// factura solo viaja {item_id, cantidad}.
const draftItems = ref([]);
const total = computed(() => draftItems.value.reduce((s, d) => s + Number(d.valor || 0) * Number(d.cantidad || 1), 0));

const pickerVisible = ref(false);
const pickerContext = ref('invoice'); // 'invoice' | 'standalone'
const pickerStartMode = ref('search');

function openPickerForInvoice() {
  pickerContext.value = 'invoice';
  pickerStartMode.value = 'search';
  pickerVisible.value = true;
}
function openPickerStandalone() {
  pickerContext.value = 'standalone';
  pickerStartMode.value = 'create';
  pickerVisible.value = true;
}
function onPicked({ item, cantidad }) {
  if (pickerContext.value === 'invoice') {
    draftItems.value.push({
      item_id: item.id, cantidad, nombre: item.nombre, marca: item.marca, peso: item.peso, valor: item.valor,
    });
  }
  // en modo standalone el producto ya quedó guardado en el catálogo (store.addItem
  // corrió dentro del modal); no hay nada más que hacer aquí.
}
function removeDraftItem(i) { draftItems.value.splice(i, 1); }

async function saveInvoice() {
  if (!fecha.value || !tienda.value.trim() || !draftItems.value.length) {
    alert('Completa la fecha, la tienda y agrega al menos un producto.');
    return;
  }
  if (pago.value === 'Tarjeta crédito' && !debtId.value) {
    alert('Elige con cuál tarjeta pagaste (o cambia la forma de pago).');
    return;
  }
  try {
    await store.addInvoice({
      fecha: fecha.value, tienda: tienda.value.trim(), marca: marca.value.trim(), pais: pais.value.trim(),
      depto: depto.value.trim(), ciudad: ciudad.value.trim(), pago: pago.value,
      debt_id: pago.value === 'Tarjeta crédito' ? debtId.value : null,
      total: total.value,
      items: draftItems.value.map((d) => ({ item_id: d.item_id, cantidad: d.cantidad })),
    });
  } catch (e) { alert('No se pudo guardar la factura.'); return; }
  fecha.value = ''; tienda.value = ''; marca.value = ''; depto.value = ''; ciudad.value = '';
  pago.value = 'Efectivo'; debtId.value = '';
  draftItems.value = [];
}

const query = ref('');
const priceMatches = computed(() => {
  const q = query.value.trim().toLowerCase();
  const matches = q ? store.items.filter((it) => it.nombre.toLowerCase().includes(q)) : store.items;
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
function debtLabel(id) {
  const d = store.debts.find((x) => x.id === id);
  return d ? d.entidad : null;
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
    <label v-if="pago === 'Tarjeta crédito'">¿Cuál tarjeta?
      <select v-model="debtId">
        <option value="" disabled>Elige una tarjeta</option>
        <option v-for="d in tarjetas" :key="d.id" :value="d.id">{{ d.entidad }}</option>
      </select>
    </label>
  </div>
  <p v-if="pago === 'Tarjeta crédito' && !tarjetas.length" class="mf-note">No tienes tarjetas registradas en la pestaña Deudas — regístrala ahí primero para poder ligar esta factura.</p>

  <div class="mf-note" style="margin-bottom:6px">Productos de la factura</div>
  <div v-if="!draftItems.length" class="mf-empty">Aún no has agregado productos.</div>
  <div v-else class="mf-items-list">
    <div v-for="(d, i) in draftItems" :key="i" class="mf-item-row" style="grid-template-columns:2fr 1fr 1fr auto;">
      <div>{{ d.nombre }}<span v-if="d.marca" class="mf-note"> · {{ d.marca }}</span></div>
      <div class="mf-num">{{ fmtCOP(d.valor) }} c/u</div>
      <div class="mf-num">× {{ d.cantidad }} = {{ fmtCOP(d.valor * d.cantidad) }}</div>
      <button class="mf-del" @click="removeDraftItem(i)">Quitar</button>
    </div>
  </div>
  <div class="mf-form-actions" style="margin-bottom:6px">
    <button class="mf-btn secondary" @click="openPickerForInvoice">+ Agregar producto</button>
  </div>
  <p v-if="draftItems.length" class="mf-note" style="text-align:right;margin-bottom:10px">Total: <strong>{{ fmtCOP(total) }}</strong></p>
  <div class="mf-form-actions" style="margin-bottom:14px">
    <button class="mf-btn" @click="saveInvoice">Guardar factura</button>
  </div>

  <div class="mf-section-title">Comparador de precios</div>
  <input v-model="query" class="mf-search" placeholder="Busca un producto para ver dónde sale más barato, ej: arroz" />
  <div class="mf-form-actions" style="margin:8px 0">
    <button class="mf-btn secondary" @click="openPickerStandalone">+ Anotar precio de referencia (sin factura)</button>
  </div>
  <p v-if="!priceMatches.length" class="mf-empty">{{ query.trim() ? 'No hay coincidencias en tu catálogo.' : 'Escribe un producto para comparar precios entre tus compras y referencias.' }}</p>
  <table v-else class="mf-table">
    <thead><tr><th>Producto</th><th>Marca</th><th>Tienda</th><th>Fecha</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>
      <tr v-for="it in priceMatches" :key="it.id">
        <td>{{ it.nombre }}<span v-if="it.peso" class="mf-note"> ({{ it.peso }})</span></td>
        <td>{{ it.marca || '—' }}</td>
        <td>{{ it.tienda || '—' }}</td>
        <td>{{ it.fecha || '—' }}</td>
        <td class="mf-num">{{ fmtCOP(it.valor) }} <span v-if="Number(it.valor) === minPrice" class="mf-badge cheap">más barato</span></td>
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
        <p class="mf-note">
          {{ [inv.ciudad, inv.depto, inv.pais].filter(Boolean).join(', ') }} · Pago: {{ inv.pago || '—' }}<template v-if="inv.debt_id"> ({{ debtLabel(inv.debt_id) }})</template>
        </p>
        <table class="mf-table">
          <thead><tr><th>Producto</th><th>Cant.</th><th style="text-align:right">Valor</th></tr></thead>
          <tbody>
            <tr v-for="(it, i) in inv.items" :key="i">
              <td>{{ it.nombre }}<span v-if="it.marca" class="mf-note"> · {{ it.marca }}</span></td>
              <td>{{ it.cantidad }}</td>
              <td class="mf-num">{{ fmtCOP(it.valor * it.cantidad) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="mf-form-actions" style="margin-top:8px"><button class="mf-del" @click.stop="removeInvoice(inv.id)">Eliminar factura</button></div>
      </div>
    </div>
  </div>

  <ItemPickerModal :visible="pickerVisible" :start-mode="pickerStartMode" @close="pickerVisible = false" @picked="onPicked" />
  </div>
</template>
