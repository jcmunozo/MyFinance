<script setup>
import { computed } from 'vue';

const props = defineProps({
  score: { type: [String, Number], default: '' },
  max: { type: [String, Number], default: 950 },
});

const r = 50;
const c = 2 * Math.PI * r;

const pct = computed(() => {
  const s = Number(props.score) || 0;
  const m = Number(props.max) || 950;
  return Math.max(0, Math.min(100, Math.round((s / m) * 100)));
});
const offset = computed(() => c * (1 - pct.value / 100));
const color = computed(() => {
  if (pct.value >= 70) return 'var(--teal)';
  if (pct.value >= 40) return 'var(--gold)';
  return 'var(--red)';
});
</script>

<template>
  <svg width="128" height="128" viewBox="0 0 128 128">
    <circle cx="64" cy="64" :r="r" fill="none" stroke="var(--paper-2)" stroke-width="13" />
    <circle
      cx="64" cy="64" :r="r" fill="none" :stroke="color" stroke-width="13" stroke-linecap="round"
      :stroke-dasharray="c.toFixed(1)" :stroke-dashoffset="offset.toFixed(1)" transform="rotate(-90 64 64)"
    />
    <text x="64" y="60" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="26" font-weight="500" fill="var(--ink)">{{ score || '—' }}</text>
    <text x="64" y="78" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="var(--ink-soft)">de {{ max }}</text>
  </svg>
</template>
