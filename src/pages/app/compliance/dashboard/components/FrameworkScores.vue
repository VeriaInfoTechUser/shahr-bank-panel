<script setup lang="ts">
import { computed } from "vue"
import BarChart from "@/components/dashboard/BarChart.vue"
import { theme } from "@/config/theme"
import type { FrameworkCompliance } from "../types"

const props = defineProps<{ data: FrameworkCompliance[] }>()

const chart = computed(() => ({
  labels: props.data.map((d) => d.frameworkTitle),
  series: [
    {
      name: "میانگین امتیاز",
      values: props.data.map((d) => Math.round(d.avgScore * 10) / 10),
      color: theme.status.done,
      barWidth: "28%",
      barGap: "10%",
    },
    {
      name: "نرخ تطبیق",
      values: props.data.map((d) => Math.round(d.complianceRate * 10) / 10),
      color: theme.status.low,
      barWidth: "28%",
    },
  ],
}))
</script>

<template>
  <div class="h-64">
    <BarChart
      :labels="chart.labels"
      :series="chart.series"
      :max="100"
      show-legend
      tooltip-suffix="٪"
      axis-suffix="٪"
    />
  </div>
</template>
