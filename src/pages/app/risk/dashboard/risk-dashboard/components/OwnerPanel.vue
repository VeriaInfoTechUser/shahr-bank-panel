<script setup lang="ts">
import { computed } from "vue"
import { toFa, ownerLabel } from "../helpers"
import type { OwnerDistribution } from "../types"

const props = defineProps<{ data: OwnerDistribution[]; memberNames?: Map<string, string> }>()

const maxRisks = computed(() => Math.max(1, ...props.data.map((d) => d.totalRisks)))

const sorted = computed(() => [...props.data].sort((a, b) => b.totalRisks - a.totalRisks))
</script>

<template>
  <ul class="flex flex-col gap-3">
    <li v-for="owner in sorted" :key="owner.ownerId" class="space-y-1.5">
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium text-slate-700">{{ ownerLabel(owner.ownerId, props.memberNames) }}</span>
        <span class="text-slate-500">
          {{ toFa(owner.totalRisks) }} ریسک ·
          <span class="text-rose-400">{{ toFa(owner.highRiskCount) }} پرخطر</span>
        </span>
      </div>
      <div class="flex items-center gap-2">
        <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            class="h-full rounded-full bg-primary"
            :style="{ width: (owner.totalRisks / maxRisks) * 100 + '%' }"
          />
        </div>
        <span class="w-12 shrink-0 text-left text-xs text-slate-500">
          م: {{ toFa(owner.avgScore) }}
        </span>
      </div>
    </li>
  </ul>
</template>
