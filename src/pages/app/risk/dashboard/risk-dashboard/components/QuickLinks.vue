<script setup lang="ts">
import { useRouter } from "vue-router"
import {
  IconDatabase,
  IconSettings2,
  IconChecklist,
  IconFileReport,
  IconLayoutDashboard,
  IconArchive,
} from "@tabler/icons-vue"
import type { Component } from "vue"

const router = useRouter()

/** لینک‌های سریع به بخش‌های ریسک — فقط مسیریابی واقعی، بدون داده جعلی */
const links: { label: string; route: string; icon: Component; color: string }[] = [
  { label: "مخزن ریسک", route: "app-risk-repository", icon: IconDatabase, color: "#0ea5e9" },
  { label: "عملیات ریسک", route: "app-risk-operations", icon: IconSettings2, color: "#8b5cf6" },
  { label: "تسک‌ها", route: "app-risk-task", icon: IconChecklist, color: "#f59e0b" },
  { label: "گزارش ریسک", route: "app-risk-report", icon: IconFileReport, color: "#f43f5e" },
  { label: "داشبورد", route: "app-risk-dashboard", icon: IconLayoutDashboard, color: "#10b981" },
  { label: "بایگانی", route: "app-risk-archive", icon: IconArchive, color: "#64748b" },
]

function go(name: string) {
  router.push({ name })
}
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <button
      v-for="link in links"
      :key="link.route"
      type="button"
      class="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:bg-slate-50"
      @click="go(link.route)"
    >
      <span
        class="flex h-9 w-9 items-center justify-center rounded-lg"
        :style="{ backgroundColor: link.color + '1c', color: link.color }"
      >
        <component :is="link.icon" :size="18" stroke-width="2" />
      </span>
      <span class="text-[11px] font-medium text-slate-600">{{ link.label }}</span>
    </button>
  </div>
</template>
