<script setup lang="ts">
import { computed } from "vue"
import { levelColors, levelLabels, toFa } from "../helpers"
import type { CategoryDistribution, RiskLevel } from "../types"

const props = defineProps<{ data: CategoryDistribution[] }>()

const levels: RiskLevel[] = ["critical", "high", "medium", "low"]

/** راننده‌های اصلی ریسک: دسته‌بندی‌ها بر اساس تعداد ریسک، نزولی */
const drivers = computed(() =>
  [...props.data]
    .sort((a, b) => b.totalRisks - a.totalRisks)
    .slice(0, 6)
    .map((d) => {
      const byLevel = Object.fromEntries(
        d.byLevel.map((b) => [b.level, b.count]),
      ) as Record<RiskLevel, number | undefined>
      return {
        title: d.categoryTitle,
        total: d.totalRisks,
        levels: levels
          .filter((l) => (byLevel[l] ?? 0) > 0)
          .map((l) => ({ level: l, count: byLevel[l] ?? 0 })),
      }
    }),
)

const maxTotal = computed(() => Math.max(1, ...drivers.value.map((d) => d.total)))
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="d in drivers"
      :key="d.title"
      class="rounded-xl border border-slate-200 bg-white px-3 py-2 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="line-clamp-1 text-[13px] font-semibold text-slate-800">{{ d.title }}</span>
        <span class="shrink-0 text-[13px] font-extrabold text-slate-900">{{ toFa(d.total) }}</span>
      </div>

      <div class="mt-1.5 flex items-center gap-2">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full bg-primary"
            :style="{ width: (d.total / maxTotal) * 100 + '%' }"
          />
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <span
            v-for="l in d.levels"
            :key="l.level"
            class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
            :style="{ backgroundColor: levelColors[l.level] + '1f', color: levelColors[l.level] }"
          >
            <span
              class="inline-block h-1.5 w-1.5 rounded-full"
              :style="{ backgroundColor: levelColors[l.level] }"
            />
            {{ levelLabels[l.level] }} {{ toFa(l.count) }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="!drivers.length" class="py-8 text-center text-sm text-slate-400">
      داده‌ای برای نمایش وجود ندارد
    </div>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
