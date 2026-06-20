<script setup lang="ts">
import { computed } from "vue"
import { answerColors, answerLabels, answerOrder, toFa } from "../helpers"
import type { FrameworkHeatmapCell } from "../types"

const props = defineProps<{ heatmap: FrameworkHeatmapCell[] }>()

const frameworks = computed(() => {
  const map = new Map<string, { title: string; cells: { answer: typeof answerOrder[number]; count: number }[] }>()
  for (const cell of props.heatmap) {
    if (!map.has(cell.frameworkSlug)) {
      map.set(cell.frameworkSlug, { title: cell.frameworkTitle, cells: [] })
    }
  }
  return Array.from(map.entries()).map(([slug, fw]) => {
    const cells = answerOrder.map((answer) => ({
      answer,
      count: props.heatmap.find((h) => h.frameworkSlug === slug && h.answer === answer)?.count ?? 0,
    }))
    const total = cells.reduce((s, c) => s + c.count, 0)
    return { slug, title: fw.title, cells, total }
  })
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="fw in frameworks"
      :key="fw.slug"
      class="rounded-xl border border-slate-200 bg-white p-3"
    >
      <div class="mb-2 flex items-center justify-between">
        <h4 class="text-sm font-bold text-slate-800">{{ fw.title }}</h4>
        <span class="text-xs text-slate-500">{{ toFa(fw.total) }} وظیفه</span>
      </div>
      <div class="grid grid-cols-4 gap-2">
        <div
          v-for="cell in fw.cells"
          :key="cell.answer"
          class="rounded-lg p-2 text-center"
          :style="{
            backgroundColor: answerColors[cell.answer] + (cell.count ? '26' : '12'),
            border: `1px solid ${answerColors[cell.answer]}44`,
          }"
        >
          <p class="text-lg font-extrabold" :style="{ color: answerColors[cell.answer] }">
            {{ toFa(cell.count) }}
          </p>
          <p class="text-[11px] text-slate-500">{{ answerLabels[cell.answer] }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
