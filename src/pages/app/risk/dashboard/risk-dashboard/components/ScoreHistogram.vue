<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import "../echarts"
import { chartFont, tooltipStyle, splitLineColor } from "../echarts"
import { toFa, levelColors } from "../helpers"
import type { ScoreRange } from "../types"

const props = defineProps<{ data: ScoreRange[] }>()

/** رنگ هر بازه امتیاز از کم‌خطر تا پرخطر — از تم مرکزی (سطح‌های ریسک) */
const rangeColors = [levelColors.low, levelColors.medium, levelColors.high, levelColors.critical]

const option = computed(() => ({
  grid: { top: 16, right: 16, bottom: 24, left: 8, containLabel: true },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    ...tooltipStyle,
    formatter: (p: { name: string; value: number }[]) =>
      `بازه امتیاز ${p[0].name}<br/>${toFa(p[0].value)} ریسک`,
  },
  xAxis: {
    type: "category",
    data: props.data.map((d) => d.range),
    axisLabel: { color: "#334155", fontFamily: chartFont },
    axisLine: { lineStyle: { color: "#cbd5e1" } },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    axisLabel: { color: "#64748b", fontFamily: chartFont },
    splitLine: { lineStyle: { color: splitLineColor } },
  },
  series: [
    {
      type: "bar",
      barWidth: "50%",
      data: props.data.map((d, i) => ({
        value: d.count,
        itemStyle: { color: rangeColors[i] ?? "#60a5fa", borderRadius: [6, 6, 0, 0] },
      })),
      label: {
        show: true,
        position: "top",
        color: "#334155",
        fontFamily: chartFont,
        formatter: (p: { value: number }) => toFa(p.value),
      },
    },
  ],
}))
</script>

<template>
  <VChart :option="option" autoresize class="h-full min-h-64 w-full" />
</template>
