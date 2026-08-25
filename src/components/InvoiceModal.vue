<script setup>
import { ref, computed, watch } from 'vue';
import { useFinanceStore } from '../stores/finance';
import { fmtCOP } from '../lib/format';
import ItemPickerModal from './ItemPickerModal.vue';

const props = defineProps({ visible: { type: Boolean, default: false } });
const emit = defineEmits(['close']);

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

// Líneas de la factura: cada una referencia un producto del catálogo
// (item_id) + cantidad. Al guardar solo viaja {item_id, cantidad}; nombre,
// marca y precio se muestran aquí solo para armar la factura visualmente.
const draftItems = ref([]);
const total = computed(() => draftItems.value.reduce((s, d) => s + Number(d.valor || 0) * Number(d.cantidad || 1), 0));

function resetForm() {
  fecha.value = ''; tienda.value = ''; marca.value = ''; pais.value = 'Colombia'; depto.value = ''; ciudad.value = '';
  pago.value = 'Efectivo'; debtId.value = ''; draftItems.value = [];
}
watch(() => props.visible, (v) => { if (v) resetForm(); });

const pickerVisible = ref(false);
function onPicked({ item, cantidad }) {
  draftItems.value.push({ item_id: item.id, cantidad, nombre: item.nombre, marca: item.marca, peso: item.peso, valor: item.valor });
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
  emit('close');
}
</script>

<template>
  <div v-if="visible" class="mf-modal-backdrop" @click.self="$emit('close')">
    <div class="mf-modal wide">
      <div class="mf-modal-head">
        <span>Agregar factura</span>
        <button class="mf-modal-close" @click="$emit('close')">✕</button>
      </div>

      <div class="mf-form" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));">
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
      <p v-if="pago === 'Tarjeta crédito' && !tarjetas.length" class="mf-note">No tienes tarjetas registradas en la pestaña Pagos y deudas — regístrala ahí primero para poder ligar esta factura.</p>

      <div class="mf-note" style="margin-bottom:6px">Productos de la factura</div>
      <div v-if="!draftItems.length" class="mf-empty">Aún no has agregado productos.</div>
      <div v-else class="mf-items-list">
        <div v-for="(d, i) in draftItems" :key="i" class="mf-item-row">
          <div>{{ d.nombre }}<span v-if="d.marca" class="mf-note"> · {{ d.marca }}</span></div>
          <div class="mf-num">{{ fmtCOP(d.valor) }} c/u</div>
          <div class="mf-num">× {{ d.cantidad }} = {{ fmtCOP(d.valor * d.cantidad) }}</div>
          <button class="mf-del" @click="removeDraftItem(i)">Quitar</button>
        </div>
      </div>
      <div class="mf-form-actions" style="margin-bottom:6px">
        <button class="mf-btn secondary" @click="pickerVisible = true">+ Agregar producto</button>
      </div>
      <p v-if="draftItems.length" class="mf-note" style="text-align:right;margin-bottom:10px">Total: <strong>{{ fmtCOP(total) }}</strong></p>

      <div class="mf-form-actions">
        <button class="mf-btn secondary" @click="$emit('close')">Cancelar</button>
        <button class="mf-btn" @click="saveInvoice">Guardar factura</button>
      </div>
    </div>

    <ItemPickerModal :visible="pickerVisible" start-mode="search" @close="pickerVisible = false" @picked="onPicked" />
  </div>
</template>
