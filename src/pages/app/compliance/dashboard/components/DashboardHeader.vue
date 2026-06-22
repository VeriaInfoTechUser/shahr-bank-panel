<script setup lang="ts">
import { IconCircleCheck, IconRefresh } from "@tabler/icons-vue"

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
      <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
        <IconCircleCheck :size="26" />
      </span>
      <div>
        <h1 class="text-xl font-extrabold text-slate-900">داشبورد تطبیق</h1>
        <p class="text-xs text-slate-500">حاکمیت، مدیریت ریسک و تطبیق (GRC)</p>
      </div>
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
  </header>
</template>
