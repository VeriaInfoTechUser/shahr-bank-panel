<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import "../echarts"
import { chartFont, tooltipStyle, splitLineColor } from "../echarts"
import { answerColors, answerLabels, answerOrder, toFa } from "../helpers"
import type { DomainCompliance } from "../types"

const props = defineProps<{ data: DomainCompliance[] }>()

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
    data: rows.value.map((d) => d.domainTitle),
    axisLabel: { color: "#334155", fontFamily: chartFont, width: 120, overflow: "truncate" },
    axisLine: { lineStyle: { color: "#cbd5e1" } },
    axisTick: { show: false },
  },
  series: answerOrder.map((answer) => ({
    name: answerLabels[answer],
    type: "bar",
    stack: "total",
    barWidth: "60%",
    itemStyle: { color: answerColors[answer] },
    emphasis: { focus: "series" },
    data: rows.value.map((d) => d.byAnswer.find((b) => b.answer === answer)?.count ?? 0),
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
  <VChart :option="option" autoresize class="h-[26rem] w-full" />
</template>
