<script setup lang="ts">
import { levelColors, levelLabels, toFa } from "../helpers"
import type { FrameworkExtremeRisk } from "../types"
import { IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-vue"

defineProps<{
  high: FrameworkExtremeRisk[]
  low: FrameworkExtremeRisk[]
}>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <p class="mb-2 flex items-center gap-1.5 text-xs font-bold text-rose-600">
        <IconArrowUpRight :size="16" /> بیشترین امتیاز در هر چارچوب
      </p>
      <ul class="flex flex-col gap-2">
        <li
          v-for="r in high"
          :key="r.riskSlug"
          class="rounded-xl border border-slate-200 bg-white p-3"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-sky-600">{{ r.frameworkTitle }}</span>
            <span
              class="rounded-md px-2 py-0.5 text-xs font-bold"
              :style="{ backgroundColor: levelColors[r.level] + '22', color: levelColors[r.level] }"
            >
              {{ levelLabels[r.level] }} · {{ toFa(r.score) }}
            </span>
          </div>
          <p class="mt-1 line-clamp-2 text-sm leading-6 text-slate-700">{{ r.riskTitle }}</p>
        </li>
      </ul>
    </div>

    <div>
      <p class="mb-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
        <IconArrowDownRight :size="16" /> کمترین امتیاز در هر چارچوب
      </p>
      <ul class="flex flex-col gap-2">
        <li
          v-for="r in low"
          :key="r.riskSlug"
          class="rounded-xl border border-slate-200 bg-white p-3"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-sky-600">{{ r.frameworkTitle }}</span>
            <span
              class="rounded-md px-2 py-0.5 text-xs font-bold"
              :style="{ backgroundColor: levelColors[r.level] + '22', color: levelColors[r.level] }"
            >
              {{ levelLabels[r.level] }} · {{ toFa(r.score) }}
            </span>
          </div>
          <p class="mt-1 line-clamp-2 text-sm leading-6 text-slate-700">{{ r.riskTitle }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
