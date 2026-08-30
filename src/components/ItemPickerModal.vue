<script setup>
import { ref, computed, watch } from 'vue';
import { useFinanceStore } from '../stores/finance';
import { fmtCOP, unitPrice } from '../lib/format';

const props = defineProps({
  visible: { type: Boolean, default: false },
  startMode: { type: String, default: 'search' }, // 'search' | 'create'
});
const emit = defineEmits(['close', 'picked']);

const store = useFinanceStore();

const query = ref('');
const mode = ref('search');
const cantidades = ref({});
const draft = ref({ nombre: '', marca: '', categoria: '', pesoValor: '', pesoUnidad: 'gr', valor: '', unidades: 1, tienda: '', fecha: '' });

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

watch(() => props.visible, (v) => {
  if (!v) return;
  query.value = '';
  mode.value = props.startMode;
  cantidades.value = {};
  draft.value = { nombre: '', marca: '', categoria: '', pesoValor: '', pesoUnidad: 'gr', valor: '', unidades: 1, tienda: '', fecha: todayIso() };
});

// Coincidencias del catálogo, la observación más reciente primero — así se ve
// de una vez si el precio de hoy ya coincide con el último registrado.
const matches = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return store.items
    .filter((it) => it.nombre.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
});


function cantidadFor(id) { return cantidades.value[id] || 1; }
function setCantidad(id, v) { cantidades.value[id] = Math.max(1, Number(v) || 1); }

function pick(item) {
  emit('picked', { item, cantidad: cantidadFor(item.id) });
}

function startCreate() {
  draft.value.nombre = query.value.trim();
  mode.value = 'create';
}

async function submitCreate() {
  if (!draft.value.nombre.trim() || draft.value.valor === '' || !draft.value.fecha) {
    alert('Completa al menos nombre, precio y fecha.');
    return;
  }
  const saved = await store.addItem({
    nombre: draft.value.nombre.trim(),
    marca: draft.value.marca.trim() || null,
    categoria: draft.value.categoria.trim() || null,
    peso: draft.value.pesoValor.trim() ? `${draft.value.pesoValor.trim()} ${draft.value.pesoUnidad}` : null,
    valor: Number(draft.value.valor),
    unidades: Math.max(1, Number(draft.value.unidades) || 1),
    tienda: draft.value.tienda.trim() || null,
    fecha: draft.value.fecha,
  });
  draft.value = { nombre: '', marca: '', categoria: '', peso: '', valor: '', unidades: 1, tienda: '', fecha: todayIso() };
  mode.value = 'search';
  emit('picked', { item: saved, cantidad: 1 });
}
</script>

<template>
  <div v-if="visible" class="mf-modal-backdrop" @click.self="$emit('close')">
    <div class="mf-modal">
      <div class="mf-modal-head">
        <span>Agregar producto</span>
        <button class="mf-modal-close" @click="$emit('close')">✕</button>
      </div>

      <template v-if="mode === 'search'">
        <input v-model="query" class="mf-search" placeholder="Busca un producto, ej: arroz diana" autofocus />
        <p v-if="!query.trim()" class="mf-empty">Escribe el nombre de un producto para buscarlo en tu catálogo.</p>
        <p v-else-if="!matches.length" class="mf-empty">No hay coincidencias en tu catálogo todavía.</p>
        <div v-else class="mf-item-matches">
          <div v-for="it in matches" :key="it.id" class="mf-item-match">
            <div class="mf-item-match-info">
              <div>{{ it.nombre }}<span v-if="it.marca"> · {{ it.marca }}</span><span v-if="it.peso" class="mf-note"> ({{ it.peso }})</span></div>
              <div class="mf-note">
                {{ fmtCOP(it.valor) }}<template v-if="Number(it.unidades) > 1"> por paquete de {{ it.unidades }} ({{ fmtCOP(unitPrice(it)) }} c/u)</template>
                · {{ it.fecha || '—' }}<template v-if="it.tienda"> · {{ it.tienda }}</template>
              </div>
            </div>
            <input class="mf-item-match-qty" type="number" min="1" :value="cantidadFor(it.id)" @input="setCantidad(it.id, $event.target.value)" title="Cantidad" />
            <button class="mf-btn secondary" @click="pick(it)">Agregar</button>
          </div>
        </div>
        <div class="mf-form-actions">
          <button class="mf-btn" @click="startCreate">+ Crear producto nuevo{{ query.trim() ? ` "${query.trim()}"` : '' }}</button>
        </div>
      </template>

      <template v-else>
        <div class="mf-form" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));">
          <label>Nombre<input v-model="draft.nombre" placeholder="Arroz Diana" /></label>
          <label>Marca<input v-model="draft.marca" placeholder="Diana" /></label>
          <label>Categoría<input v-model="draft.categoria" placeholder="Abarrotes" /></label>
          <label>Peso / cant.
            <div class="mf-peso-group">
              <input v-model="draft.pesoValor" type="number" step="any" placeholder="500" />
              <select v-model="draft.pesoUnidad">
                <option value="gr">gr</option>
                <option value="cm3">cm3</option>
                <option value="l">l</option>
              </select>
            </div>
          </label>
          <label>Precio del paquete<input v-model="draft.valor" type="number" step="1" placeholder="5200" /></label>
          <label>Unidades en el paquete<input v-model="draft.unidades" type="number" min="1" step="1" placeholder="1" /></label>
          <label>Tienda<input v-model="draft.tienda" placeholder="Éxito Calle 80" /></label>
          <label>Fecha<input v-model="draft.fecha" type="date" /></label>
        </div>
        <p v-if="Number(draft.valor) && Number(draft.unidades) > 1" class="mf-note">Eso da {{ fmtCOP(Number(draft.valor) / Number(draft.unidades)) }} por unidad.</p>
        <p class="mf-note">Esto crea un producto nuevo en el catálogo — nunca edita uno existente, así el precio anterior queda como referencia histórica.</p>
        <div class="mf-form-actions">
          <button class="mf-btn secondary" @click="mode = 'search'">Volver a buscar</button>
          <button class="mf-btn" @click="submitCreate">Crear{{ startMode === 'search' ? ' y agregar a la factura' : '' }}</button>
        </div>
      </template>
    </div>
  </div>
</template>
