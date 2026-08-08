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
const links: { label: string; route: string; icon: Component }[] = [
  { label: "مخزن ریسک", route: "app-risk-repository", icon: IconDatabase },
  { label: "عملیات ریسک", route: "app-risk-operations", icon: IconSettings2 },
  { label: "تسک‌ها", route: "app-risk-task", icon: IconChecklist },
  { label: "گزارش ریسک", route: "app-risk-report", icon: IconFileReport },
  { label: "داشبورد", route: "app-risk-dashboard", icon: IconLayoutDashboard },
  { label: "بایگانی", route: "app-risk-archive", icon: IconArchive },
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
      class="group flex flex-col items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-2.5 transition hover:border-slate-300 hover:bg-slate-50"
      @click="go(link.route)"
    >
      <span
        class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-primary-muted group-hover:text-primary"
      >
        <component :is="link.icon" :size="18" stroke-width="2" />
      </span>
      <span class="text-[11px] font-medium text-slate-600">{{ link.label }}</span>
    </button>
  </div>
</template>
