<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { grcRepo } from "@/core/repositories/grcRepo"
import { IconLoader2, IconAlertCircle, IconRefresh } from "@tabler/icons-vue"

import DashboardView from "./DashboardView.vue"
import type { DashboardData } from "./types"

const { t } = useI18n()
const loading = ref(false)
const dashboardData = ref<DashboardData | null>(null)
const error = ref<string | null>(null)
const filterRange = ref<{ from: string; to: string }>({ from: "", to: "" })

async function loadDashboard() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, string> = {}
    if (filterRange.value.from) params.updatedAtStart = filterRange.value.from
    if (filterRange.value.to) params.updatedAtEnd = filterRange.value.to
    const res = await grcRepo.riskDashboard(Object.keys(params).length ? params : undefined)
    if (res?.result) {
      dashboardData.value = (res.data as DashboardData) ?? null
    } else {
      error.value = res?.error?.[0] ?? t("risk.dashboard-load-error")
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t("risk.dashboard-load-error")
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})

function onFilter(range: { from: string; to: string }) {
  filterRange.value = range
  loadDashboard()
}
</script>

<template>
  <!-- بارگذاری اولیه -->
  <div
    v-if="loading && !dashboardData"
    dir="rtl"
    class="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-600"
  >
    <IconLoader2 :size="40" class="animate-spin text-sky-400" />
    <p class="text-sm">در حال بارگذاری داشبورد…</p>
  </div>

  <!-- خطا -->
  <div
    v-else-if="error && !dashboardData"
    dir="rtl"
    class="flex min-h-screen flex-col items-center justify-center gap-4 text-slate-600"
  >
    <IconAlertCircle :size="44" class="text-rose-400" />
    <p class="text-sm">{{ error }}</p>
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      @click="loadDashboard"
    >
      <IconRefresh :size="18" /> تلاش مجدد
    </button>
  </div>

  <!-- داشبورد -->
  <DashboardView
    v-else-if="dashboardData"
    :data="dashboardData"
    :loading="loading"
    @refresh="loadDashboard"
    @filter="onFilter"
  />
</template>
