<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <section
    class="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
  >
    <header v-if="title || $slots.header" class="mb-3 flex items-start justify-between gap-2">
      <div v-if="title">
        <h3 class="text-sm font-bold text-slate-800">{{ title }}</h3>
        <p v-if="subtitle" class="mt-0.5 text-xs text-slate-500">{{ subtitle }}</p>
      </div>
      <slot name="header" />
    </header>
    <div class="flex-1">
      <slot />
    </div>
  </section>
</template>
