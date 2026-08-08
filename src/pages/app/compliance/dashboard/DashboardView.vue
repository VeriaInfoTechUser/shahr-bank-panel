<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue"
import type { DashboardData } from "./types"
import {
  answerLabels,
  answerColors,
  answerOrder,
  stateLabels,
  stateColors,
  stateOrder,
  toFa,
} from "./helpers"

import DashboardHeader from "@/components/dashboard/DashboardHeader.vue"
import DashboardCard from "@/components/dashboard/DashboardCard.vue"
import StatCard from "@/components/dashboard/StatCard.vue"
import DonutChart from "@/components/dashboard/DonutChart.vue"
import StateBar from "@/components/dashboard/StateBar.vue"
import ScoreHistogram from "@/components/dashboard/ScoreHistogram.vue"
import FrameworkScores from "./components/FrameworkScores.vue"
import FrameworkHeatmap from "@/components/dashboard/FrameworkHeatmap.vue"
import DomainStacked from "./components/DomainStacked.vue"
import PlanScatter from "./components/PlanScatter.vue"
import PlanTaskStates from "./components/PlanTaskStates.vue"
import AssigneePanel from "./components/AssigneePanel.vue"
import OwnerPanel from "./components/OwnerPanel.vue"
import TaskList from "./components/TaskList.vue"

import {
  IconClipboardCheck,
  IconListCheck,
  IconGauge,
  IconCalendarExclamation,
  IconChartDonut,
  IconGitBranch,
  IconChartHistogram,
  IconChartBar,
  IconGrid3x3,
  IconChartDots,
  IconChartScatter,
  IconStack2,
  IconUser,
  IconUsers,
  IconActivity,
  IconCircleCheck,
  IconFilter,
} from "@tabler/icons-vue"

import { theme } from "@/config/theme"
import { ermRepo } from "@/core/repositories/ermRepo"
import { fetchMemberLightListCached } from "@/core/erm/ruleAuthorTypeOptionsCache"
import { grcRepo } from "@/core/repositories/grcRepo"

const props = defineProps<{
  data: DashboardData
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

const memberNames = ref<Map<string, string>>(new Map())

onMounted(async () => {
  try {
    const res = await fetchMemberLightListCached(ermRepo)
    const r = res as { data?: unknown; list?: unknown[] }
    const d = r?.data
    let list: Record<string, unknown>[] = []
    if (Array.isArray(res)) list = res as Record<string, unknown>[]
    else if (Array.isArray(d)) list = d as Record<string, unknown>[]
    else if (d && typeof d === "object" && "list" in d && Array.isArray((d as { list: unknown[] }).list))
      list = (d as { list: Record<string, unknown>[] }).list
    else if (Array.isArray(r?.list)) list = r.list as Record<string, unknown>[]

    const map = new Map<string, string>()
    for (const m of list) {
      const id = m.id ?? m.user_id
      if (id == null) continue
      const name =
        [m.name, m.full_name, m.email, m.mobile].find((x) => typeof x === "string" && String(x).trim()) ?? null
      if (name) map.set(String(id), String(name).trim())
    }
    memberNames.value = map
  } catch {
    // silently ignore — fallback to generic labels
  }
})

const summary = computed(() => props.data.summary)
const overdueCount = computed(() => props.data.overdueTasks.length)

/** رنگ هر بازه امتیاز تطبیق: ۰ خاکستری (شروع‌نشده) تا ۱۰۰ سبز — از تم مرکزی */
const scoreRangeColors: Record<string, string> = {
  "0": theme.status.draft,
  "1-25": theme.status.critical,
  "26-50": theme.status.high,
  "51-75": theme.status.medium,
  "76-100": theme.status.low,
}
const histogramColorFor = (range: string) => scoreRangeColors[range] ?? "#60a5fa"

const heatmapData = computed(() =>
  props.data.frameworkHeatmap.map((h) => ({
    frameworkSlug: h.frameworkSlug,
    frameworkTitle: h.frameworkTitle,
    key: h.answer,
    count: h.count,
  })),
)
const frameworkSummary = (_slug: string, counts: Record<string, number>): string =>
  `${toFa(Object.values(counts).reduce((s, c) => s + c, 0))} وظیفه`
</script>

<template>
  <div dir="rtl" class="min-h-screen text-slate-800">
    <div class="mx-auto max-w-[1500px] px-4 py-6 lg:px-8">
      <DashboardHeader
        title="داشبورد تطبیق"
        subtitle="حاکمیت، مدیریت ریسک و تطبیق (GRC)"
        :icon="IconCircleCheck"
        :loading="loading"
        @refresh="$emit('refresh')"
      >
        <template #filters>
          <IconFilter :size="16" class="text-slate-400" />
          <label class="text-xs text-slate-500">برنامه:</label>
          <select
            v-model="selectedPlan"
            class="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
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
        </template>
      </DashboardHeader>

      <!-- KPI row -->
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="کل برنامه‌ها"
          :value="summary.totalPlans"
          :icon="IconClipboardCheck"
          :accent="theme.status.done"
          :hint="`${toFa(summary.totalTasks)} وظیفه`"
        />
        <StatCard
          label="کل وظایف"
          :value="summary.totalTasks"
          :icon="IconListCheck"
          :accent="theme.status.monitoring"
          hint="در همه برنامه‌ها"
        />
        <StatCard
          label="امتیاز کلی تطبیق"
          :value="Math.round(summary.overallScore * 10) / 10"
          :icon="IconGauge"
          :accent="theme.status.low"
          suffix="٪"
          :hint="`نرخ تکمیل ${toFa(Math.round(summary.completionRate))}٪`"
        />
        <StatCard
          label="وظایف دارای تأخیر"
          :value="overdueCount"
          :icon="IconCalendarExclamation"
          :accent="theme.status.high"
          hint="مهلت سپری‌شده"
        />
      </div>

      <!-- distributions -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardCard title="وضعیت تطبیق وظایف" subtitle="تفکیک پاسخ‌های ارزیابی" :icon="IconChartDonut">
          <DonutChart
            :data="summary.tasksByAnswer.map((d) => ({ key: d.answer, count: d.count }))"
            :labels="answerLabels"
            :colors="answerColors"
            :order="answerOrder"
            item-word="وظیفه"
            center-label="کل وظایف"
          />
        </DashboardCard>
        <DashboardCard title="وضعیت چرخه کاری" subtitle="تعداد وظیفه در هر وضعیت" :icon="IconGitBranch">
          <StateBar
            :data="summary.tasksByState"
            :labels="stateLabels"
            :colors="stateColors"
            :order="stateOrder"
            item-word="وظیفه"
          />
        </DashboardCard>
        <DashboardCard title="توزیع امتیاز تطبیق" subtitle="بازه‌بندی امتیاز وظایف" :icon="IconChartHistogram">
          <ScoreHistogram :data="data.scoreDistribution" :color-for="histogramColorFor" item-word="وظیفه" />
        </DashboardCard>
      </div>

      <!-- frameworks -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <DashboardCard
          class="lg:col-span-3"
          title="مقایسه چارچوب‌ها"
          subtitle="میانگین امتیاز در برابر نرخ تطبیق"
          :icon="IconChartBar"
        >
          <FrameworkScores :data="data.frameworkCompliance" />
        </DashboardCard>
        <DashboardCard class="lg:col-span-2" title="نقشه حرارتی چارچوب‌ها" subtitle="پراکندگی پاسخ‌ها در هر چارچوب" :icon="IconGrid3x3">
          <FrameworkHeatmap
            :data="heatmapData"
            :keys="answerOrder"
            :labels="answerLabels"
            :colors="answerColors"
            :summary="frameworkSummary"
          />
        </DashboardCard>
      </div>

      <!-- domains + plan scatter -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <DashboardCard
          class="lg:col-span-3"
          title="تطبیق بر اساس دامنه کنترلی"
          subtitle="ترکیب پاسخ‌ها در هر دامنه"
          :icon="IconChartDots"
        >
          <DomainStacked :data="data.domainCompliance" />
        </DashboardCard>
        <DashboardCard
          class="lg:col-span-2"
          title="موقعیت برنامه‌ها"
          subtitle="نرخ تکمیل × میانگین امتیاز (اندازه: تعداد وظایف)"
          :icon="IconChartScatter"
        >
          <PlanScatter :data="data.topPlans" />
        </DashboardCard>
      </div>

      <!-- plan task states + owners -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <DashboardCard
          class="lg:col-span-3"
          title="ترکیب وضعیت وظایف برنامه‌ها"
          subtitle="تفکیک وضعیت کاری وظایف هر برنامه"
          :icon="IconStack2"
        >
          <PlanTaskStates :data="data.topPlans" />
        </DashboardCard>
        <DashboardCard class="lg:col-span-2" title="عملکرد مالکان برنامه" subtitle="میانگین نرخ تکمیل" :icon="IconUser">
          <OwnerPanel :data="data.ownerDistribution" :member-names="memberNames" />
        </DashboardCard>
      </div>

      <!-- assignees -->
      <div class="mt-4 grid grid-cols-1 gap-4">
        <DashboardCard title="بار کاری مسئولان وظایف" subtitle="تعداد وظایف و میانگین امتیاز هر مسئول" :icon="IconUsers">
          <AssigneePanel :data="data.assigneeDistribution" :member-names="memberNames" />
        </DashboardCard>
      </div>

      <!-- overdue + recent -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title="وظایف دارای تأخیر" :subtitle="`${toFa(overdueCount)} مورد`" :icon="IconCalendarExclamation">
          <div class="max-h-96 overflow-y-auto pl-1">
            <TaskList :items="data.overdueTasks" show-deadline show-framework :member-names="memberNames" />
          </div>
        </DashboardCard>
        <DashboardCard title="فعالیت‌های اخیر" subtitle="آخرین تغییرات وظایف" :icon="IconActivity">
          <div class="max-h-96 overflow-y-auto pl-1">
            <TaskList :items="data.recentActivity" show-framework :member-names="memberNames" />
          </div>
        </DashboardCard>
      </div>

      <footer class="mt-8 pb-4 text-center text-xs text-slate-400">
        داشبورد مدیریت تطبیق، حاکمیت و ریسک (GRC)
      </footer>
    </div>
  </div>
</template>
