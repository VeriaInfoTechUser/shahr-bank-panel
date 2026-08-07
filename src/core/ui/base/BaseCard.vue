<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
  }>(),
  {}
);
</script>

<template>
  <div
    class="rounded-card border border-border/80 bg-surface dark:bg-surface shadow-sm overflow-hidden"
  >
    <div
      v-if="title || $slots.header"
      class="px-5 py-3 border-b border-border/70 dark:border-darkmode-700/70"
    >
      <h2 v-if="title" class="text-sm font-semibold text-text-primary">
        {{ title }}
      </h2>
      <slot name="header" />
    </div>
    <div class="px-5 py-4 text-sm">
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="px-5 py-3 border-t border-border/70 dark:border-darkmode-700/70 bg-surface-hover dark:bg-surface-subtle/40 text-sm"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
