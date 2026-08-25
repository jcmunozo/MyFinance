<script setup>
import { ref, computed } from 'vue';
import { useFinanceStore } from '../stores/finance';
import { fmtCOP } from '../lib/format';
import InvoiceModal from './InvoiceModal.vue';
import ItemPickerModal from './ItemPickerModal.vue';

const store = useFinanceStore();

const invoiceModalVisible = ref(false);
const productModalVisible = ref(false);
function onProductPicked() {
  // Modo standalone: el producto ya quedó guardado en el catálogo dentro del
  // modal (store.addItem corrió ahí); aquí no hay nada más que hacer.
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
  <div class="mf-form-actions" style="justify-content:flex-start;margin-bottom:20px">
    <button class="mf-btn" @click="invoiceModalVisible = true">+ Agregar factura</button>
    <button class="mf-btn" @click="productModalVisible = true">+ Agregar producto</button>
  </div>

  <div class="mf-section-title">Comparador de precios</div>
  <input v-model="query" class="mf-search" placeholder="Busca un producto para ver dónde sale más barato, ej: arroz" />
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

  <InvoiceModal :visible="invoiceModalVisible" @close="invoiceModalVisible = false" />
  <ItemPickerModal :visible="productModalVisible" start-mode="create" @close="productModalVisible = false" @picked="onProductPicked" />
  </div>
</template>
