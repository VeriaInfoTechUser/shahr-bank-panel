<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import "../echarts"
import { chartFont, tooltipStyle, splitLineColor } from "../echarts"
import { stateColors, stateLabels, toFa } from "../helpers"
import type { PlanItem, TaskState } from "../types"

const props = defineProps<{ data: PlanItem[] }>()

const series: { key: keyof PlanItem; state: TaskState }[] = [
  { key: "todoTasks", state: "todo" },
  { key: "inProgressTasks", state: "in_progress" },
  { key: "doneTasks", state: "done" },
  { key: "approvedTasks", state: "approved" },
  { key: "rejectedTasks", state: "rejected" },
]

const rows = computed(() => [...props.data].sort((a, b) => a.totalTasks - b.totalTasks))

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
    data: rows.value.map((d) => d.title),
    axisLabel: { color: "#334155", fontFamily: chartFont, width: 130, overflow: "truncate" },
    axisLine: { lineStyle: { color: "#cbd5e1" } },
    axisTick: { show: false },
  },
  series: series.map((s) => ({
    name: stateLabels[s.state],
    type: "bar",
    stack: "total",
    barWidth: "60%",
    itemStyle: { color: stateColors[s.state] },
    emphasis: { focus: "series" },
    data: rows.value.map((d) => (d[s.key] as number) ?? 0),
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
