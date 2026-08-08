<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import "../echarts"
import { chartFont, tooltipStyle } from "../echarts"
import { answerColors, answerLabels, answerOrder, toFa } from "../helpers"
import type { CountByAnswer } from "../types"

const props = defineProps<{ data: CountByAnswer[] }>()

const total = computed(() => props.data.reduce((s, d) => s + d.count, 0))

const sorted = computed(() =>
  [...props.data].sort((a, b) => answerOrder.indexOf(a.answer) - answerOrder.indexOf(b.answer)),
)

const option = computed(() => ({
  tooltip: {
    trigger: "item",
    ...tooltipStyle,
    formatter: (p: { name: string; value: number; percent: number }) =>
      `${p.name}<br/>${toFa(p.value)} وظیفه (${toFa(p.percent)}٪)`,
  },
  legend: {
    bottom: 0,
    textStyle: { color: "#334155", fontFamily: chartFont },
    itemWidth: 10,
    itemHeight: 10,
  },
  series: [
    {
      type: "pie",
      radius: ["52%", "75%"],
      center: ["50%", "44%"],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: "#ffffff", borderWidth: 2, borderRadius: 6 },
      label: { show: false },
      data: sorted.value.map((d) => ({
        value: d.count,
        name: answerLabels[d.answer],
        itemStyle: { color: answerColors[d.answer] },
      })),
    },
  ],
}))
</script>

<template>
  <div class="relative">
    <VChart :option="option" autoresize class="h-full min-h-56 w-full" />
    <div class="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 text-center">
      <p class="text-2xl font-extrabold text-slate-900">{{ toFa(total) }}</p>
      <p class="text-xs text-slate-500">کل وظایف</p>
    </div>
  </div>
</template>
