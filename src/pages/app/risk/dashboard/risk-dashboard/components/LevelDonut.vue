<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import "../echarts"
import { chartFont, tooltipStyle } from "../echarts"
import { levelColors, levelLabels, toFa } from "../helpers"
import type { CountByLevel } from "../types"

const props = defineProps<{ data: CountByLevel[] }>()

const total = computed(() => props.data.reduce((s, d) => s + d.count, 0))

const option = computed(() => ({
  tooltip: {
    trigger: "item",
    ...tooltipStyle,
    formatter: (p: { name: string; value: number; percent: number }) =>
      `${p.name}<br/>${toFa(p.value)} مورد (${toFa(p.percent)}٪)`,
  },
  legend: {
    bottom: 0,
    textStyle: { color: "#cbd5e1", fontFamily: chartFont },
    itemWidth: 10,
    itemHeight: 10,
  },
  series: [
    {
      type: "pie",
      radius: ["52%", "75%"],
      center: ["50%", "44%"],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: "#0f172a", borderWidth: 2, borderRadius: 6 },
      label: { show: false },
      data: props.data.map((d) => ({
        value: d.count,
        name: levelLabels[d.level],
        itemStyle: { color: levelColors[d.level] },
      })),
    },
  ],
}))
</script>

<template>
  <div class="relative">
    <VChart :option="option" autoresize class="h-64 w-full" />
    <div
      class="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 text-center"
    >
      <p class="text-2xl font-extrabold text-slate-50">{{ toFa(total) }}</p>
      <p class="text-xs text-slate-400">سطح‌بندی‌شده</p>
    </div>
  </div>
</template>
