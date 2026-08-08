<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import "../echarts"
import { chartFont, tooltipStyle, splitLineColor } from "../echarts"
import { toFa } from "../helpers"
import { theme } from "@/config/theme"
import type { PlanItem } from "../types"

const props = defineProps<{ data: PlanItem[] }>()

/** رنگ نقطه بر اساس میانگین امتیاز — از تم مرکزی */
function color(score: number): string {
  if (score >= 75) return theme.status.low
  if (score >= 50) return theme.status.medium
  if (score >= 25) return theme.status.high
  return theme.status.critical
}

const option = computed(() => ({
  grid: { top: 24, right: 24, bottom: 36, left: 8, containLabel: true },
  tooltip: {
    trigger: "item",
    ...tooltipStyle,
    formatter: (p: { data: { value: number[]; title: string } }) =>
      `${p.data.title}<br/>نرخ تکمیل: ${toFa(p.data.value[0])}٪<br/>میانگین امتیاز: ${toFa(
        p.data.value[1],
      )}<br/>تعداد وظایف: ${toFa(p.data.value[2])}`,
  },
  xAxis: {
    type: "value",
    name: "نرخ تکمیل (٪)",
    nameLocation: "middle",
    nameGap: 26,
    min: 0,
    max: 100,
    nameTextStyle: { color: "#64748b", fontFamily: chartFont },
    axisLabel: { color: "#64748b", fontFamily: chartFont },
    splitLine: { lineStyle: { color: splitLineColor } },
  },
  yAxis: {
    type: "value",
    name: "میانگین امتیاز",
    min: 0,
    max: 100,
    nameTextStyle: { color: "#64748b", fontFamily: chartFont },
    axisLabel: { color: "#64748b", fontFamily: chartFont },
    splitLine: { lineStyle: { color: splitLineColor } },
  },
  series: [
    {
      type: "scatter",
      symbolSize: (val: number[]) => Math.max(14, Math.min(48, val[2] * 4)),
      data: props.data.map((d) => ({
        value: [
          Math.round(d.completionRate * 10) / 10,
          Math.round(d.avgScore * 10) / 10,
          d.totalTasks,
        ],
        title: d.title,
        itemStyle: { color: color(d.avgScore), opacity: 0.8, borderColor: "#ffffff", borderWidth: 1 },
      })),
    },
  ],
}))
</script>

<template>
  <VChart :option="option" autoresize class="h-full min-h-64 w-full" />
</template>
