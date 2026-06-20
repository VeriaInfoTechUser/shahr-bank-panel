<script setup lang="ts">
import type { Component } from "vue"
import { toFa } from "../helpers"

defineProps<{
  label: string
  value: number
  icon: Component
  accent: string
  hint?: string
  suffix?: string
}>()
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <span
      class="absolute inset-y-0 right-0 w-1"
      :style="{ backgroundColor: accent }"
      aria-hidden="true"
    />
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate text-xs font-medium text-slate-500">{{ label }}</p>
        <p class="mt-1 text-2xl font-extrabold text-slate-900">
          {{ toFa(value) }}<span v-if="suffix" class="mr-0.5 text-base font-bold">{{ suffix }}</span>
        </p>
        <p v-if="hint" class="mt-1 truncate text-xs text-slate-400">{{ hint }}</p>
      </div>
      <span
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        :style="{ backgroundColor: accent + '22', color: accent }"
      >
        <component :is="icon" :size="22" stroke-width="2" />
      </span>
    </div>
  </div>
</template>
