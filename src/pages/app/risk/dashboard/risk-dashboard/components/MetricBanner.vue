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
    class="grid grid-cols-2 divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm sm:grid-cols-3 xl:grid-cols-6 xl:divide-x rtl:divide-x-reverse"
  >
    <div
      v-for="item in items"
      :key="item.label"
      class="flex items-center gap-3 px-3.5 py-3"
    >
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        :style="{ backgroundColor: item.color + '1a', color: item.color }"
      >
        <component :is="item.icon" :size="18" stroke-width="2" />
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
