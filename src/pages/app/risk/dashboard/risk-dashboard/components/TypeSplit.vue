<script setup lang="ts">
import { computed } from "vue"
import { typeLabels, toFa } from "../helpers"
import type { CountByType } from "../types"
import { IconAlertTriangle, IconTrendingUp } from "@tabler/icons-vue"

const props = defineProps<{ data: CountByType[] }>()

const total = computed(() => props.data.reduce((s, d) => s + d.count, 0))

const meta = {
  threat: { color: "#f43f5e", icon: IconAlertTriangle },
  opportunity: { color: "#34d399", icon: IconTrendingUp },
} as const

const rows = computed(() =>
  props.data.map((d) => ({
    ...d,
    label: typeLabels[d.riskType],
    color: meta[d.riskType].color,
    icon: meta[d.riskType].icon,
    pct: total.value ? Math.round((d.count / total.value) * 100) : 0,
  })),
)
</script>

<template>
  <div class="flex h-full min-h-56 flex-col justify-center gap-4">
    <div v-for="row in rows" :key="row.riskType" class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg"
            :style="{ backgroundColor: row.color + '22', color: row.color }"
          >
            <component :is="row.icon" :size="18" />
          </span>
          {{ row.label }}
        </span>
        <span class="text-sm font-bold text-slate-800">
          {{ toFa(row.count) }}
          <span class="text-xs font-normal text-slate-500">({{ toFa(row.pct) }}٪)</span>
        </span>
      </div>
      <div class="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          class="h-full rounded-full transition-all"
          :style="{ width: row.pct + '%', backgroundColor: row.color }"
        />
      </div>
    </div>
  </div>
</template>
