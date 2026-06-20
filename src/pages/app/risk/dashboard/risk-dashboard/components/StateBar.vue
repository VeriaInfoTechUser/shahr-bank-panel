<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import "../echarts"
import { chartFont, tooltipStyle, splitLineColor } from "../echarts"
import { stateColors, stateLabels, toFa } from "../helpers"
import type { CountByState } from "../types"

const props = defineProps<{ data: CountByState[] }>()

const option = computed(() => {
  const rows = props.data
  return {
    grid: { top: 10, right: 16, bottom: 8, left: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...tooltipStyle,
      formatter: (p: { name: string; value: number }[]) =>
        `${p[0].name}<br/>${toFa(p[0].value)} مورد`,
    },
    xAxis: {
      type: "value",
      axisLabel: { color: "#94a3b8", fontFamily: chartFont },
      splitLine: { lineStyle: { color: splitLineColor } },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: rows.map((d) => stateLabels[d.state]),
      axisLabel: { color: "#cbd5e1", fontFamily: chartFont },
      axisLine: { lineStyle: { color: "#334155" } },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        barWidth: "55%",
        data: rows.map((d) => ({
          value: d.count,
          itemStyle: { color: stateColors[d.state], borderRadius: [0, 6, 6, 0] },
        })),
        label: {
          show: true,
          position: "right",
          color: "#cbd5e1",
          fontFamily: chartFont,
          formatter: (p: { value: number }) => toFa(p.value),
        },
      },
    ],
  }
})
</script>

<template>
  <VChart :option="option" autoresize class="h-64 w-full" />
</template>
