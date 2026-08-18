<script setup>
import { onMounted, ref, computed } from 'vue';
import { useFinanceStore } from './stores/finance';
import { TABS } from './lib/labels';
import Icon from './components/Icon.vue';
import TabsNav from './components/TabsNav.vue';
import ResumenTab from './components/ResumenTab.vue';
import ActivosTab from './components/ActivosTab.vue';
import MovimientosTab from './components/MovimientosTab.vue';
import FacturasTab from './components/FacturasTab.vue';
import PagosTab from './components/PagosTab.vue';
import PensionTab from './components/PensionTab.vue';
import MetasTab from './components/MetasTab.vue';

const store = useFinanceStore();
const activeTab = ref('resumen');

onMounted(() => { store.loadAll(); });

const TAB_COMPONENTS = {
  resumen: ResumenTab,
  activos: ActivosTab,
  movimientos: MovimientosTab,
  facturas: FacturasTab,
  pagos: PagosTab,
  pension: PensionTab,
  metas: MetasTab,
};

const currentTab = computed(() => TABS.find((t) => t.id === activeTab.value));
</script>

<template>
  <div class="mf-page">
    <div class="mf-root">
      <aside class="mf-tabs">
        <div class="mf-brand">
          <span class="mf-brand-mark"><Icon name="sparkle" :size="18" /></span>
          <div class="mf-brand-text">
            <span class="mf-brand-name">MyFinance</span>
            <span class="mf-brand-tag">Libro de cuentas</span>
          </div>
        </div>
        <TabsNav v-model="activeTab" />
      </aside>

      <div class="mf-main">
        <header v-if="currentTab" class="mf-topbar">
          <span class="mf-topbar-icon"><Icon :name="currentTab.icon" :size="21" /></span>
          <div>
            <h1>{{ currentTab.label }}</h1>
            <p>{{ currentTab.subtitle }}</p>
          </div>
        </header>

        <div class="mf-panel">
          <p v-if="!store.loaded" class="mf-empty">Cargando...</p>
          <div v-else-if="store.loadError" class="mf-alert urgent">
            <span class="mf-alert-icon"><Icon name="alert-triangle" :size="16" /></span>
            <span>No se pudo conectar con el servidor. Verifica que el backend y la base de datos estén corriendo (docker compose up) y recarga la página.</span>
          </div>
          <Transition name="mf-fade" mode="out-in">
            <component :is="TAB_COMPONENTS[activeTab]" v-if="store.loaded && !store.loadError" :key="activeTab" />
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>
