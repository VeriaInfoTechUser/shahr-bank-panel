<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import "../echarts"
import { chartFont, tooltipStyle, splitLineColor } from "../echarts"
import { toFa } from "../helpers"
import type { FrameworkCompliance } from "../types"

const props = defineProps<{ data: FrameworkCompliance[] }>()

const option = computed(() => ({
  grid: { top: 30, right: 16, bottom: 8, left: 8, containLabel: true },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    ...tooltipStyle,
    formatter: (p: { seriesName: string; name: string; value: number }[]) => {
      const head = `${p[0].name}<br/>`
      return head + p.map((s) => `${s.seriesName}: ${toFa(s.value)}٪`).join("<br/>")
    },
  },
  legend: {
    top: 0,
    textStyle: { color: "#334155", fontFamily: chartFont },
    itemWidth: 12,
    itemHeight: 12,
  },
  xAxis: {
    type: "category",
    data: props.data.map((d) => d.frameworkTitle),
    axisLabel: { color: "#334155", fontFamily: chartFont },
    axisLine: { lineStyle: { color: "#cbd5e1" } },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    max: 100,
    axisLabel: { color: "#64748b", fontFamily: chartFont, formatter: "{value}٪" },
    splitLine: { lineStyle: { color: splitLineColor } },
  },
  series: [
    {
      name: "میانگین امتیاز",
      type: "bar",
      barGap: "10%",
      barWidth: "28%",
      itemStyle: { color: "#38bdf8", borderRadius: [6, 6, 0, 0] },
      data: props.data.map((d) => Math.round(d.avgScore * 10) / 10),
    },
    {
      name: "نرخ انطباق",
      type: "bar",
      barWidth: "28%",
      itemStyle: { color: "#34d399", borderRadius: [6, 6, 0, 0] },
      data: props.data.map((d) => Math.round(d.complianceRate * 10) / 10),
    },
  ],
}))
</script>

<template>
  <VChart :option="option" autoresize class="h-72 w-full" />
</template>
