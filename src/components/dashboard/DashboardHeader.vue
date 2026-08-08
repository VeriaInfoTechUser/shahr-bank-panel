<script setup lang="ts">
import type { Component } from "vue"
import { IconRefresh } from "@tabler/icons-vue"

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** آیکون هدر — در مربع primary-muted نمایش داده می‌شود */
    icon?: Component
    loading?: boolean
  }>(),
  {
    subtitle: "حاکمیت، مدیریت ریسک و تطبیق (GRC)",
    icon: undefined,
    loading: false,
  },
)

defineEmits<{
  (e: "refresh"): void
}>()
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <span
        v-if="icon"
        class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-muted text-primary"
      >
        <component :is="icon" :size="26" />
      </span>
      <div>
        <h1 class="text-xl font-extrabold text-slate-900">{{ title }}</h1>
        <p class="text-xs text-slate-500">{{ subtitle }}</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <!-- فیلترهای اختصاصی هر داشبورد (بازه تاریخ / انتخاب برنامه و …) -->
      <div
        v-if="$slots.filters"
        class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5"
      >
        <slot name="filters" />
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
        :disabled="loading"
        @click="$emit('refresh')"
      >
        <IconRefresh :size="18" :class="loading ? 'animate-spin' : ''" />
        <span>{{ loading ? "در حال بارگذاری…" : "بروزرسانی" }}</span>
      </button>
    </div>
  </header>
</template>
