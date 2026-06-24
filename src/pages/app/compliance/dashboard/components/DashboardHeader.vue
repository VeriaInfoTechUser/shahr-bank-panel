<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { IconCircleCheck, IconRefresh, IconFilter } from "@tabler/icons-vue"
import { grcRepo } from "@/core/repositories/grcRepo"

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: "refresh"): void
  (e: "filter", planSlug: string): void
}>()

interface PlanOption {
  slug: string
  title: string
}

const plans = ref<PlanOption[]>([])
const selectedPlan = ref("")

onMounted(async () => {
  try {
    const res = await grcRepo.planList({ limit: 200 })
    const list = (res?.data?.list ?? res?.data ?? []) as Record<string, unknown>[]
    plans.value = list.map((p) => ({
      slug: String(p.slug ?? ""),
      title: String(p.title ?? ""),
    }))
  } catch {
    // silently ignore
  }
})

watch(selectedPlan, (val) => {
  emit("filter", val)
})
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
        <IconCircleCheck :size="26" />
      </span>
      <div>
        <h1 class="text-xl font-extrabold text-slate-900">داشبورد تطبیق</h1>
        <p class="text-xs text-slate-500">حاکمیت، مدیریت ریسک و تطبیق (GRC)</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
        <IconFilter :size="16" class="text-slate-400" />
        <label class="text-xs text-slate-500">برنامه:</label>
        <select
          v-model="selectedPlan"
          class="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
        >
          <option value="">همه برنامه‌ها</option>
          <option v-for="plan in plans" :key="plan.slug" :value="plan.slug">
            {{ plan.title }}
          </option>
        </select>
        <button
          v-if="selectedPlan"
          type="button"
          class="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-200"
          @click="selectedPlan = ''"
        >
          حذف فیلتر
        </button>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
        :disabled="loading"
        @click="$emit('refresh')"
      >
        <IconRefresh :size="18" :class="loading ? 'animate-spin' : ''" />
        <span>{{ loading ? "در حال بارگذاری…" : "بروزرسانی" }}</span>
      </button>
    </div>
  </header>
</template>
