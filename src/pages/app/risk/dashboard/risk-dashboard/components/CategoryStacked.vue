<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import "../echarts"
import { chartFont, tooltipStyle, splitLineColor } from "../echarts"
import { levelColors, levelLabels, toFa } from "../helpers"
import type { CategoryDistribution, RiskLevel } from "../types"

const props = defineProps<{ data: CategoryDistribution[] }>()

const levels: RiskLevel[] = ["critical", "high", "medium", "low"]

const option = computed(() => ({
  grid: { top: 10, right: 16, bottom: 8, left: 8, containLabel: true },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    ...tooltipStyle,
  },
    legend: {
      bottom: 0,
      textStyle: { color: "#334155", fontFamily: chartFont },
    itemWidth: 10,
    itemHeight: 10,
  },
  xAxis: {
    type: "value",
    axisLabel: { color: "#64748b", fontFamily: chartFont },
    splitLine: { lineStyle: { color: splitLineColor } },
  },
  yAxis: {
    type: "category",
    inverse: true,
    data: props.data.map((d) => d.categoryTitle),
      axisLabel: { color: "#334155", fontFamily: chartFont },
      axisLine: { lineStyle: { color: "#cbd5e1" } },
    axisTick: { show: false },
  },
  series: levels.map((level) => ({
    name: levelLabels[level],
    type: "bar",
    stack: "total",
    barWidth: "55%",
    itemStyle: { color: levelColors[level] },
    emphasis: { focus: "series" },
    data: props.data.map(
      (d) => d.byLevel.find((b) => b.level === level)?.count ?? 0,
    ),
    label: {
      show: true,
      color: "#ffffff",
      fontFamily: chartFont,
      fontWeight: "bold",
      formatter: (p: { value: number }) => (p.value ? toFa(p.value) : ""),
    },
  })),
}))
</script>

<template>
  <VChart :option="option" autoresize class="h-full min-h-64 w-full" />
</template>
