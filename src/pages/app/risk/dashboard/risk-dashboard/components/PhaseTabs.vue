<script setup lang="ts">
import { ref, computed } from "vue"
import RiskList from "./RiskList.vue"
import type { RiskItem } from "../types"

const props = defineProps<{
  analysis: RiskItem[]
  response: RiskItem[]
  monitoring: RiskItem[]
}>()

const tabs = [
  { key: "analysis", label: "تحلیل" },
  { key: "response", label: "پاسخ" },
  { key: "monitoring", label: "پایش" },
] as const

const active = ref<(typeof tabs)[number]["key"]>("analysis")

const current = computed(() => props[active.value])
</script>

<template>
  <div class="flex flex-col">
    <div class="mb-3 flex gap-1 rounded-xl bg-slate-100 p-1">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition"
        :class="
          active === tab.key
            ? 'bg-sky-500 text-white shadow'
            : 'text-slate-500 hover:text-slate-800'
        "
        @click="active = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="max-h-80 overflow-y-auto pl-1">
      <RiskList :items="current" />
    </div>
  </div>
</template>
