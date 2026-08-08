<script setup lang="ts">
import { computed } from "vue"
import { toFa, toPct, personLabel } from "../helpers"
import { theme } from "@/config/theme"
import type { OwnerDistribution } from "../types"

const props = defineProps<{ data: OwnerDistribution[]; memberNames?: Map<string, string> }>()

const sorted = computed(() => [...props.data].sort((a, b) => b.avgCompletionRate - a.avgCompletionRate))

function barColor(rate: number): string {
  if (rate >= 50) return theme.status.low
  if (rate >= 30) return theme.status.medium
  return theme.status.high
}
</script>

<template>
  <ul class="flex flex-col gap-3">
    <li v-for="o in sorted" :key="o.ownerId" class="space-y-1.5">
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium text-slate-700">{{ personLabel(o.ownerId, memberNames) }}</span>
        <span class="text-slate-500">
          {{ toFa(o.totalPlans) }} برنامه · {{ toFa(o.totalTasks) }} وظیفه
        </span>
      </div>
      <div class="flex items-center gap-2">
        <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            class="h-full rounded-full"
            :style="{ width: o.avgCompletionRate + '%', backgroundColor: barColor(o.avgCompletionRate) }"
          />
        </div>
        <span class="w-14 shrink-0 text-left text-xs font-semibold text-slate-600">
          {{ toPct(o.avgCompletionRate) }}
        </span>
      </div>
    </li>
  </ul>
</template>
