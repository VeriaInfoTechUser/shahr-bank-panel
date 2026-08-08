<script setup lang="ts">
import { computed } from "vue"
import BarChart from "@/components/dashboard/BarChart.vue"
import { answerColors, answerLabels, answerOrder } from "../helpers"
import type { DomainCompliance } from "../types"

const props = defineProps<{ data: DomainCompliance[] }>()

const rows = computed(() => [...props.data].sort((a, b) => a.totalTasks - b.totalTasks))

const chart = computed(() => ({
  labels: rows.value.map((d) => d.domainTitle),
  series: answerOrder.map((answer) => ({
    name: answerLabels[answer],
    values: rows.value.map((d) => d.byAnswer.find((b) => b.answer === answer)?.count ?? 0),
    color: answerColors[answer],
    barWidth: "60%",
    stack: true,
    labelInside: true,
    labelHideZero: true,
  })),
}))
</script>

<template>
  <div class="h-[26rem]">
    <BarChart :labels="chart.labels" :series="chart.series" horizontal :inverse="false" show-legend truncate-labels="130" />
  </div>
</template>
