<script setup lang="ts">
import {
  levelColors,
  levelLabels,
  toFa,
  toJalali,
  daysUntil,
  ownerLabel,
} from "../helpers"
import type { RiskItem } from "../types"

defineProps<{
  items: RiskItem[]
  showDeadline?: boolean
  showFramework?: boolean
  memberNames?: Map<string, string>
}>()
</script>

<template>
  <ul class="flex flex-col gap-2">
    <li
      v-for="item in items"
      :key="item.slug"
      class="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div class="flex items-start justify-between gap-3">
        <p class="line-clamp-2 flex-1 text-sm font-medium leading-6 text-slate-800">
          {{ item.title }}
        </p>
        <span
          v-if="item.level"
          class="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold"
          :style="{
            backgroundColor: levelColors[item.level] + '22',
            color: levelColors[item.level],
          }"
        >
          {{ levelLabels[item.level] }}
        </span>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span v-if="item.score !== null" class="font-semibold text-slate-600">
          امتیاز: {{ toFa(item.score) }}
        </span>
        <span v-if="item.categoryTitle">دسته: {{ item.categoryTitle }}</span>
        <span>{{ ownerLabel(item.ownerId, memberNames) }}</span>
        <span v-if="showFramework && item.frameworkTitle" class="text-primary">
          {{ item.frameworkTitle }}
        </span>
        <span
          v-if="showDeadline && item.deadline"
          :class="
            (daysUntil(item.deadline) ?? 0) < 0 ? 'font-semibold text-rose-400'           : 'text-slate-500'
          "
        >
          مهلت: {{ toJalali(item.deadline) }}
          <template v-if="(daysUntil(item.deadline) ?? 0) < 0">
            ({{ toFa(Math.abs(daysUntil(item.deadline) ?? 0)) }} روز تأخیر)
          </template>
        </span>
      </div>
    </li>

    <li v-if="!items.length" class="py-8 text-center text-sm text-slate-400">
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
