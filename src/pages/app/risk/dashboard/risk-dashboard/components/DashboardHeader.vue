<script setup lang="ts">
import { IconShieldHalfFilled, IconRefresh } from "@tabler/icons-vue"

defineProps<{
  loading?: boolean
}>()

defineEmits<{
  (e: "refresh"): void
}>()
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <span
        class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400"
      >
        <IconShieldHalfFilled :size="26" />
      </span>
      <div>
        <h1 class="text-xl font-extrabold text-slate-50">داشبورد مدیریت ریسک</h1>
        <p class="text-xs text-slate-400">حاکمیت، مدیریت ریسک و انطباق (GRC)</p>
      </div>
    </div>

    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-60"
      :disabled="loading"
      @click="$emit('refresh')"
    >
      <IconRefresh :size="18" :class="loading ? 'animate-spin' : ''" />
      <span>{{ loading ? "در حال بارگذاری…" : "بروزرسانی" }}</span>
    </button>
  </header>
</template>
