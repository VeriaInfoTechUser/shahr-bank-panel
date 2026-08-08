<script setup lang="ts">
import { computed } from "vue"
import BarChart from "@/components/dashboard/BarChart.vue"
import { levelColors, levelLabels } from "../helpers"
import type { CategoryDistribution, RiskLevel } from "../types"

const props = defineProps<{ data: CategoryDistribution[] }>()

const levels: RiskLevel[] = ["critical", "high", "medium", "low"]

const chart = computed(() => ({
  labels: props.data.map((d) => d.categoryTitle),
  series: levels.map((level) => ({
    name: levelLabels[level],
    values: props.data.map((d) => d.byLevel.find((b) => b.level === level)?.count ?? 0),
    color: levelColors[level],
    barWidth: "55%",
    stack: true,
    labelInside: true,
    labelHideZero: true,
  })),
}))
</script>

<template>
  <div class="h-64">
    <BarChart :labels="chart.labels" :series="chart.series" horizontal show-legend />
  </div>
</template>
