<script setup>
import { TABS } from '../lib/labels';
import Icon from './Icon.vue';

defineProps({ modelValue: String });
defineEmits(['update:modelValue']);
</script>

<template>
  <nav class="mf-nav" aria-label="Secciones de la app">
    <button
      v-for="t in TABS"
      :key="t.id"
      type="button"
      class="mf-nav-item"
      :class="{ active: modelValue === t.id }"
      :aria-current="modelValue === t.id ? 'page' : undefined"
      @click="$emit('update:modelValue', t.id)"
    >
      <Icon :name="t.icon" :size="19" class="mf-nav-icon" />
      <span class="mf-nav-label">{{ t.label }}</span>
    </button>
  </nav>
</template>
