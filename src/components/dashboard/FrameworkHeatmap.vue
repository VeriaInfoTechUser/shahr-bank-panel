<script setup lang="ts">
import { computed } from "vue"
import { toFa } from "./helpers"

interface HeatmapCell {
  frameworkSlug: string
  frameworkTitle: string
  key: string
  count: number
}

const props = defineProps<{
  data: HeatmapCell[]
  /** ترتیب دسته‌های نمایش‌داده‌شده در هر چارچوب */
  keys: string[]
  /** برچسب فارسی هر دسته */
  labels: Record<string, string>
  /** رنگ هر دسته — از تم مرکزی */
  colors: Record<string, string>
  /** خلاصه متنی هر چارچوب (مثل «X ریسک · میانگین Y») */
  summary: (slug: string, counts: Record<string, number>) => string
}>()

const frameworks = computed(() => {
  const map = new Map<string, { title: string; cells: { key: string; count: number }[] }>()
  for (const cell of props.data) {
    if (!map.has(cell.frameworkSlug)) {
      map.set(cell.frameworkSlug, { title: cell.frameworkTitle, cells: [] })
    }
  }
  return Array.from(map.entries()).map(([slug, fw]) => {
    const cells = props.keys.map((key) => ({
      key,
      count: props.data.find((h) => h.frameworkSlug === slug && h.key === key)?.count ?? 0,
    }))
    const counts: Record<string, number> = {}
    for (const c of cells) counts[c.key] = c.count
    return { slug, title: fw.title, cells, summaryText: props.summary(slug, counts) }
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
        <span class="text-xs text-slate-500">{{ fw.summaryText }}</span>
      </div>
      <div class="grid grid-cols-4 gap-2">
        <div
          v-for="cell in fw.cells"
          :key="cell.key"
          class="rounded-lg p-2 text-center"
          :style="{
            backgroundColor: colors[cell.key] + (cell.count ? '26' : '12'),
            border: `1px solid ${colors[cell.key]}44`,
          }"
        >
          <p class="text-lg font-extrabold" :style="{ color: colors[cell.key] }">
            {{ toFa(cell.count) }}
          </p>
          <p class="text-[11px] text-slate-500">{{ labels[cell.key] }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
