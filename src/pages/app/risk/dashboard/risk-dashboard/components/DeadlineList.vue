<script setup lang="ts">
import { computed } from "vue"
import { IconCalendar } from "@tabler/icons-vue"
import { toFa, toJalali, daysUntil, levelLabels, levelColors } from "../helpers"
import type { RiskItem } from "../types"

const props = defineProps<{
  items: RiskItem[]
  limit?: number
}>()

/** مهلت‌ها: فقط موارد دارای مهلت، مرتب بر اساس نزدیک‌ترین */
const deadlines = computed(() =>
  props.items
    .filter((i) => i.deadline)
    .slice()
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, props.limit ?? 6)
    .map((item) => {
      const days = daysUntil(item.deadline!) ?? 0
      let badge = { text: `${toFa(days)} روز`, cls: "bg-slate-100 text-slate-600" }
      if (days < 0) badge = { text: `${toFa(Math.abs(days))} روز تأخیر`, cls: "bg-rose-100 text-rose-700" }
      else if (days === 0) badge = { text: "امروز", cls: "bg-rose-100 text-rose-700" }
      else if (days <= 2) badge = { text: `${toFa(days)} روز مانده`, cls: "bg-orange-100 text-orange-700" }
      else if (days <= 5) badge = { text: `${toFa(days)} روز مانده`, cls: "bg-amber-100 text-amber-700" }
      return { ...item, badge, days }
    }),
)
</script>

<template>
  <ul class="flex flex-col gap-2">
    <li
      v-for="item in deadlines"
      :key="item.slug"
      class="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div class="flex items-start justify-between gap-3">
        <p class="line-clamp-2 flex-1 text-sm font-medium leading-6 text-slate-800">
          {{ item.title }}
        </p>
        <span
          v-if="item.level"
          class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold"
          :style="{ backgroundColor: levelColors[item.level] + '1f', color: levelColors[item.level] }"
        >
          {{ levelLabels[item.level] }}
        </span>
      </div>

      <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span class="flex items-center gap-1.5 text-xs text-slate-500">
          <IconCalendar :size="13" class="text-slate-400" />
          {{ toJalali(item.deadline) }}
        </span>
        <span
          class="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
          :class="item.badge.cls"
        >
          {{ item.badge.text }}
        </span>
      </div>
    </li>

    <li v-if="!deadlines.length" class="py-8 text-center text-sm text-slate-400">
      موردی برای نمایش وجود ندارد
    </li>
  </ul>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
