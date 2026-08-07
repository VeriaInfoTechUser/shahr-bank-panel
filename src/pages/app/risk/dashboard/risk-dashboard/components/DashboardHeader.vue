<script setup lang="ts">
import { ref } from "vue"
import { IconShieldHalfFilled, IconRefresh, IconFilter } from "@tabler/icons-vue"

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: "refresh"): void
  (e: "filter", range: { from: string; to: string }): void
}>()

const fromDate = ref("")
const toDate = ref("")

function applyFilter() {
  emit("filter", { from: fromDate.value, to: toDate.value })
}

function clearFilter() {
  fromDate.value = ""
  toDate.value = ""
  emit("filter", { from: "", to: "" })
}
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <span
        class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-muted text-primary"
      >
        <IconShieldHalfFilled :size="26" />
      </span>
      <div>
        <h1 class="text-xl font-extrabold text-slate-900">داشبورد مدیریت ریسک</h1>
        <p class="text-xs text-slate-500">حاکمیت، مدیریت ریسک و تطبیق (GRC)</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
        <IconFilter :size="16" class="text-slate-400" />
        <label class="text-xs text-slate-500">از:</label>
        <input
          v-model="fromDate"
          type="date"
          class="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
        <label class="text-xs text-slate-500">تا:</label>
        <input
          v-model="toDate"
          type="date"
          class="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
        <button
          type="button"
          class="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-white transition hover:bg-primary-hover"
          @click="applyFilter"
        >
          اعمال فیلتر
        </button>
        <button
          v-if="fromDate || toDate"
          type="button"
          class="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-200"
          @click="clearFilter"
        >
          حذف فیلتر
        </button>
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
