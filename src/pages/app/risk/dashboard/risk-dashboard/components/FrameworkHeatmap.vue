<script setup lang="ts">
import { computed } from "vue"
import { levelColors, levelLabels, toFa } from "../helpers"
import type { FrameworkHeatmapCell, FrameworkOverview, RiskLevel } from "../types"

const props = defineProps<{
  heatmap: FrameworkHeatmapCell[]
  overview: FrameworkOverview[]
}>()

const levels: RiskLevel[] = ["critical", "high", "medium", "low"]

const frameworks = computed(() =>
  props.overview.map((ov) => {
    const cells = levels.map((level) => ({
      level,
      count:
        props.heatmap.find(
          (h) => h.frameworkSlug === ov.frameworkSlug && h.level === level,
        )?.count ?? 0,
    }))
    return { ...ov, cells }
  }),
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="fw in frameworks"
      :key="fw.frameworkSlug"
      class="rounded-xl border border-slate-800 bg-slate-900/40 p-3"
    >
      <div class="mb-2 flex items-center justify-between">
        <h4 class="text-sm font-bold text-slate-100">{{ fw.frameworkTitle }}</h4>
        <span class="text-xs text-slate-400">
          {{ toFa(fw.totalRisks) }} ریسک · میانگین {{ toFa(fw.avgScore) }}
        </span>
      </div>
      <div class="grid grid-cols-4 gap-2">
        <div
          v-for="cell in fw.cells"
          :key="cell.level"
          class="rounded-lg p-2 text-center"
          :style="{
            backgroundColor: levelColors[cell.level] + (cell.count ? '26' : '12'),
            border: `1px solid ${levelColors[cell.level]}44`,
          }"
        >
          <p class="text-lg font-extrabold" :style="{ color: levelColors[cell.level] }">
            {{ toFa(cell.count) }}
          </p>
          <p class="text-[11px] text-slate-400">{{ levelLabels[cell.level] }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
