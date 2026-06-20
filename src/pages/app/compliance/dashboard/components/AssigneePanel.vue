<script setup lang="ts">
import { computed } from "vue"
import { toFa, personLabel } from "../helpers"
import type { AssigneeDistribution } from "../types"

const props = defineProps<{ data: AssigneeDistribution[]; memberNames?: Map<string, string> }>()

const maxTasks = computed(() => Math.max(1, ...props.data.map((d) => d.totalTasks)))

const sorted = computed(() => [...props.data].sort((a, b) => b.totalTasks - a.totalTasks))
</script>

<template>
  <ul class="flex flex-col gap-3">
    <li v-for="a in sorted" :key="a.assigneeId" class="space-y-1.5">
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium text-slate-700">{{ personLabel(a.assigneeId, memberNames) }}</span>
        <span class="text-slate-500">
          {{ toFa(a.totalTasks) }} وظیفه ·
          <span class="text-emerald-500">{{ toFa(a.compliantCount) }} منطبق</span>
          <span v-if="a.nonCompliantCount" class="text-rose-400"> · {{ toFa(a.nonCompliantCount) }} نامنطبق</span>
        </span>
      </div>
      <div class="flex items-center gap-2">
        <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            class="h-full rounded-full bg-sky-500"
            :style="{ width: (a.totalTasks / maxTasks) * 100 + '%' }"
          />
        </div>
        <span class="w-14 shrink-0 text-left text-xs text-slate-500">م: {{ toFa(a.avgScore) }}</span>
      </div>
    </li>
  </ul>
</template>
