<script setup lang="ts">
import {
  answerColors,
  answerLabels,
  stateColors,
  stateLabels,
  toFa,
  toJalali,
  daysUntil,
  personLabel,
} from "../helpers"
import type { TaskItem } from "../types"

defineProps<{
  items: TaskItem[]
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
          class="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold"
          :style="{
            backgroundColor: stateColors[item.state] + '22',
            color: stateColors[item.state],
          }"
        >
          {{ stateLabels[item.state] }}
        </span>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span
          v-if="item.answer"
          class="rounded px-1.5 py-0.5 font-semibold"
          :style="{
            backgroundColor: answerColors[item.answer] + '1f',
            color: answerColors[item.answer],
          }"
        >
          {{ answerLabels[item.answer] }}
        </span>
        <span v-if="item.answerScore !== null" class="font-semibold text-slate-600">
          امتیاز: {{ toFa(item.answerScore) }}
        </span>
        <span v-if="item.domainTitle">دامنه: {{ item.domainTitle }}</span>
        <span>{{ personLabel(item.assigneeId, memberNames) }}</span>
        <span v-if="showFramework && item.frameworkTitle" class="text-sky-500">
          {{ item.frameworkTitle }}
        </span>
        <span
          v-if="showDeadline && item.deadline"
          :class="(daysUntil(item.deadline) ?? 0) < 0 ? 'font-semibold text-rose-400' : 'text-slate-500'"
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
