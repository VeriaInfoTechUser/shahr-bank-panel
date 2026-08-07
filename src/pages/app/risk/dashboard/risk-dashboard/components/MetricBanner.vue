<script setup lang="ts">
import type { Component } from "vue"
import { toFa } from "../helpers"

interface BannerItem {
  label: string
  value: number
  icon: Component
  /** رنگ آیکون و نقطه */
  color: string
  /** زیرنویس کوتاه اختیاری */
  hint?: string
}

defineProps<{
  items: BannerItem[]
}>()
</script>

<template>
  <div
    class="grid grid-cols-2 divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-3 xl:grid-cols-6 xl:divide-x rtl:divide-x-reverse"
  >
    <div
      v-for="item in items"
      :key="item.label"
      class="flex items-center gap-3 px-4 py-3.5"
    >
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        :style="{ backgroundColor: item.color + '1c', color: item.color }"
      >
        <component :is="item.icon" :size="20" stroke-width="2" />
      </span>
      <div class="min-w-0">
        <p class="text-xl font-extrabold leading-none text-slate-900">{{ toFa(item.value) }}</p>
        <p class="mt-1 truncate text-[11px] text-slate-500">{{ item.label }}</p>
        <p v-if="item.hint" class="truncate text-[10px]" :style="{ color: item.color }">
          {{ item.hint }}
        </p>
      </div>
    </div>
  </div>
</template>
