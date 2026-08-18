<script setup>
// Set de iconos propio, en línea (sin dependencias externas ni emojis).
// Trazo consistente (1.75px), 24x24, currentColor — se tiñen solos vía CSS `color`.
defineProps({
  name: { type: String, required: true },
  size: { type: [String, Number], default: 20 },
});
</script>

<template>
  <svg
    :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"
  >
    <template v-if="name === 'home'">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </template>
    <template v-else-if="name === 'wallet'">
      <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
      <path d="M3 10.5h18" />
      <circle cx="16.5" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'swap'">
      <path d="M4 8h13" /><path d="M13.5 4.5 17 8l-3.5 3.5" />
      <path d="M20 16H7" /><path d="M10.5 19.5 7 16l3.5-3.5" />
    </template>
    <template v-else-if="name === 'receipt'">
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </template>
    <template v-else-if="name === 'card'">
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 9.5h18" />
      <path d="M7 14.5h4" />
    </template>
    <template v-else-if="name === 'shield'">
      <path d="M12 3.2 19 6v6c0 4.6-3 7.6-7 8.8-4-1.2-7-4.2-7-8.8V6l7-2.8Z" />
      <path d="M9 12.2l2 2 4-4.2" />
    </template>
    <template v-else-if="name === 'target'">
      <circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.3" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'alert-triangle'">
      <path d="M12 4.2 21.5 20H2.5L12 4.2Z" />
      <path d="M12 10v4.3" /><circle cx="12" cy="17.1" r="0.9" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'alert-circle'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5" /><circle cx="12" cy="16" r="0.9" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'sparkle'">
      <path d="M12 3v5M12 16v5M3 12h5M16 12h5" />
      <path d="M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </template>
  </svg>
</template>
