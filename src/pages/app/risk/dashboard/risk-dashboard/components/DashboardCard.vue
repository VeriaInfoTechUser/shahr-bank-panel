<script setup lang="ts">
import type { Component } from "vue"

defineProps<{
  title?: string
  subtitle?: string
  /** آیکون نمایش‌داده‌شده در کنار عنوان کارت */
  icon?: Component
  /** رنگ تم آیکون و نوار کناری (hex) */
  accent?: string
}>()
</script>

<template>
  <section
    class="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
  >
    <header
      v-if="title || $slots.header || icon"
      class="mb-3 flex items-start justify-between gap-2"
    >
      <div v-if="title || icon" class="flex items-center gap-2.5">
        <span
          v-if="icon"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          :style="{ backgroundColor: (accent ?? '#0ea5e9') + '1a', color: accent ?? '#0ea5e9' }"
        >
          <component :is="icon" :size="18" stroke-width="2" />
        </span>
        <div>
          <h3 class="text-sm font-bold text-slate-800">{{ title }}</h3>
          <p v-if="subtitle" class="mt-0.5 text-xs text-slate-500">{{ subtitle }}</p>
        </div>
      </div>
      <slot name="header" />
    </header>
    <div class="flex-1">
      <slot />
    </div>
  </section>
</template>
