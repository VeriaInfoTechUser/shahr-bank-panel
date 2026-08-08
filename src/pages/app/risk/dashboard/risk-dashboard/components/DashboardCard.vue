<script setup lang="ts">
import type { Component } from "vue"

defineProps<{
  title?: string
  subtitle?: string
  /** آیکون نمایش‌داده‌شده در کنار عنوان کارت */
  icon?: Component
}>()
</script>

<template>
  <section
    class="flex flex-col rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"
  >
    <header
      v-if="title || $slots.header || icon"
      class="mb-2.5 flex items-start justify-between gap-2"
    >
      <div v-if="title || icon" class="flex items-center gap-2.5">
        <span
          v-if="icon"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"
        >
          <component :is="icon" :size="16" stroke-width="2" />
        </span>
        <div>
          <h3 class="text-sm font-semibold text-slate-900">{{ title }}</h3>
          <p v-if="subtitle" class="mt-0.5 text-[11px] text-slate-400">{{ subtitle }}</p>
        </div>
      </div>
      <slot name="header" />
    </header>
    <div class="flex-1 min-h-0">
      <slot />
    </div>
  </section>
</template>
