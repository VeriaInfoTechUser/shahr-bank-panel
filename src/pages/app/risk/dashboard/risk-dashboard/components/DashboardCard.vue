<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <section
    class="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur"
  >
    <header v-if="title || $slots.header" class="mb-3 flex items-start justify-between gap-2">
      <div v-if="title">
        <h3 class="text-sm font-bold text-slate-100">{{ title }}</h3>
        <p v-if="subtitle" class="mt-0.5 text-xs text-slate-400">{{ subtitle }}</p>
      </div>
      <slot name="header" />
    </header>
    <div class="flex-1">
      <slot />
    </div>
  </section>
</template>
