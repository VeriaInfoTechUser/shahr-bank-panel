<script setup lang="ts">
import { computed } from "vue"
import { levelColors, toFa } from "../helpers"
import type { DomainRisk, RiskLevel } from "../types"

const props = defineProps<{ data: DomainRisk[] }>()

const levels: RiskLevel[] = ["critical", "high", "medium", "low"]

const sorted = computed(() => [...props.data].sort((a, b) => b.totalRisks - a.totalRisks))

function count(domain: DomainRisk, level: RiskLevel): number {
  return domain.byLevel.find((b) => b.level === level)?.count ?? 0
}
</script>

<template>
  <ul class="flex max-h-80 flex-col gap-2 overflow-y-auto pl-1">
    <li
      v-for="domain in sorted"
      :key="domain.domainSlug"
      class="rounded-xl border border-slate-200 bg-white p-3"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="line-clamp-1 text-sm font-medium text-slate-800">{{ domain.domainTitle }}</span>
        <span class="shrink-0 text-xs font-bold text-slate-600">{{ toFa(domain.totalRisks) }}</span>
      </div>
      <div class="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          v-for="level in levels"
          :key="level"
          class="h-full"
          :style="{
            width: (count(domain, level) / domain.totalRisks) * 100 + '%',
            backgroundColor: levelColors[level],
          }"
        />
      </div>
    </li>
  </ul>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
