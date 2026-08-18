<script setup>
import Icon from './Icon.vue';

defineProps({ alerts: { type: Array, default: () => [] } });
</script>

<template>
  <template v-if="alerts.length">
    <div class="mf-section-title">Alertas</div>
    <div class="mf-alerts">
      <div v-for="(al, i) in alerts" :key="i" class="mf-alert" :class="{ urgent: al.urgent }">
        <span class="mf-alert-icon"><Icon :name="al.urgent ? 'alert-triangle' : 'alert-circle'" :size="16" /></span>
        <span>{{ al.text }}</span>
      </div>
    </div>
  </template>
</template>
