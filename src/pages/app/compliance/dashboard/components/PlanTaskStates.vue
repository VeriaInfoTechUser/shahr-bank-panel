<script setup lang="ts">
import { computed } from "vue"
import BarChart from "@/components/dashboard/BarChart.vue"
import { stateColors, stateLabels } from "../helpers"
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

const chart = computed(() => ({
  labels: rows.value.map((d) => d.title),
  series: series.map((s) => ({
    name: stateLabels[s.state],
    values: rows.value.map((d) => (d[s.key] as number) ?? 0),
    color: stateColors[s.state],
    barWidth: "60%",
    stack: true,
    labelInside: true,
    labelHideZero: true,
  })),
}))
</script>

<template>
  <div class="h-64">
    <BarChart :labels="chart.labels" :series="chart.series" horizontal :inverse="false" show-legend truncate-labels="130" />
  </div>
</template>
