<script setup lang="ts">
import { computed, ref, onMounted } from "vue"
import type { DashboardData } from "./types"
import { toFa } from "./helpers"

import DashboardHeader from "./components/DashboardHeader.vue"
import DashboardCard from "./components/DashboardCard.vue"
import StatCard from "./components/StatCard.vue"
import MetricBanner from "./components/MetricBanner.vue"
import LevelDonut from "./components/LevelDonut.vue"
import StateBar from "./components/StateBar.vue"
import TypeSplit from "./components/TypeSplit.vue"
import RiskMatrix from "./components/RiskMatrix.vue"
import ScoreHistogram from "./components/ScoreHistogram.vue"
import CategoryStacked from "./components/CategoryStacked.vue"
import FrameworkHeatmap from "./components/FrameworkHeatmap.vue"
import OwnerPanel from "./components/OwnerPanel.vue"
import PhaseTabs from "./components/PhaseTabs.vue"
import RiskList from "./components/RiskList.vue"
import RiskByDomain from "./components/RiskByDomain.vue"
import FrameworkExtremes from "./components/FrameworkExtremes.vue"
import TopDrivers from "./components/TopDrivers.vue"
import DeadlineList from "./components/DeadlineList.vue"
import QuickLinks from "./components/QuickLinks.vue"

import {
  IconLayersIntersect,
  IconAlertHexagon,
  IconCalendarExclamation,
  IconActivityHeartbeat,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconRadar2,
  IconChartHistogram,
  IconCategory,
  IconBuildingSkyscraper,
  IconUser,
  IconListNumbers,
  IconPalette,
  IconGitBranch,
  IconLayoutGrid,
  IconHistory,
  IconCalendarClock,
  IconBook2,
} from "@tabler/icons-vue"

import { ermRepo } from "@/core/repositories/ermRepo"
import { fetchMemberLightListCached } from "@/core/erm/ruleAuthorTypeOptionsCache"
import { theme } from "@/config/theme"

const props = defineProps<{
  data: DashboardData
  loading?: boolean
}>()

defineEmits<{
  (e: "refresh"): void
  (e: "filter", range: { from: string; to: string }): void
}>()

const memberNames = ref<Map<string, string>>(new Map())

onMounted(async () => {
  try {
    const res = await fetchMemberLightListCached(ermRepo)
    const r = res as { data?: unknown; list?: unknown[] }
    const d = r?.data
    let list: Record<string, unknown>[] = []
    if (Array.isArray(res)) list = res as Record<string, unknown>[]
    else if (Array.isArray(d)) list = d as Record<string, unknown>[]
    else if (d && typeof d === 'object' && 'list' in d && Array.isArray((d as { list: unknown[] }).list))
      list = (d as { list: Record<string, unknown>[] }).list
    else if (Array.isArray(r?.list)) list = r.list as Record<string, unknown>[]

    const map = new Map<string, string>()
    for (const m of list) {
      const id = m.id ?? m.user_id
      if (id == null) continue
      const name =
        [m.name, m.full_name, m.email, m.mobile]
          .find((x) => typeof x === 'string' && String(x).trim()) ?? null
      if (name) map.set(String(id), String(name).trim())
    }
    memberNames.value = map
  } catch {
    // silently ignore — fallback to generic labels
  }
})

const summary = computed(() => props.data.summary)

const criticalCount = computed(
  () => summary.value.byLevel.find((l) => l.level === "critical")?.count ?? 0,
)
const highCount = computed(() => summary.value.byLevel.find((l) => l.level === "high")?.count ?? 0)
const mediumCount = computed(
  () => summary.value.byLevel.find((l) => l.level === "medium")?.count ?? 0,
)
const lowCount = computed(() => summary.value.byLevel.find((l) => l.level === "low")?.count ?? 0)
const overdueCount = computed(() => props.data.overdueRisks.length)
const monitoringCount = computed(
  () => summary.value.byState.find((s) => s.state === "monitoring")?.count ?? 0,
)
const opportunityCount = computed(
  () => summary.value.byType.find((t) => t.riskType === "opportunity")?.count ?? 0,
)
const threatCount = computed(
  () => summary.value.byType.find((t) => t.riskType === "threat")?.count ?? 0,
)

/**
 * نوار شمارنده‌های کلیدی — مشابه بنر متریک در طراحی مرجع.
 * کارت‌های KPI بالا (بحرانی/تأخیر/پایش) را تکرار نمی‌کند؛
 * فقط تفکیک سطح و ماهیت را نشان می‌دهد.
 */
const bannerItems = computed(() => [
  { label: "کل ریسک‌ها", value: summary.value.total, icon: IconLayersIntersect, color: theme.status.done },
  { label: "بالا", value: highCount.value, icon: IconAlertTriangle, color: theme.status.high },
  { label: "متوسط", value: mediumCount.value, icon: IconRadar2, color: theme.status.medium },
  { label: "پایین", value: lowCount.value, icon: IconTrendingDown, color: theme.status.low },
  { label: "تهدیدها", value: threatCount.value, icon: IconAlertHexagon, color: theme.status.threat },
  { label: "فرصت‌ها", value: opportunityCount.value, icon: IconTrendingUp, color: theme.status.opportunity },
])
</script>

<template>
  <div dir="rtl" class="min-h-screen text-slate-800">
    <div class="mx-auto max-w-[1500px] px-4 py-6 lg:px-8">
      <DashboardHeader :loading="loading" @refresh="$emit('refresh')" @filter="$emit('filter', $event)" />

      <!-- ============ KPI row ============ -->
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="کل ریسک‌ها"
          :value="summary.total"
          :icon="IconLayersIntersect"
          :accent="theme.status.done"
          :hint="`${toFa(highCount + criticalCount)} مورد پرخطر`"
        />
        <StatCard
          label="ریسک‌های بحرانی"
          :value="criticalCount"
          :icon="IconAlertHexagon"
          :accent="theme.status.critical"
          hint="نیازمند اقدام فوری"
        />
        <StatCard
          label="دارای تأخیر"
          :value="overdueCount"
          :icon="IconCalendarExclamation"
          :accent="theme.status.high"
          hint="مهلت سپری‌شده"
        />
        <StatCard
          label="در حال پایش"
          :value="monitoringCount"
          :icon="IconActivityHeartbeat"
          :accent="theme.status.monitoring"
          hint="تحت کنترل"
        />
      </div>

      <!-- ============ Metric counter banner ============ -->
      <div class="mt-4">
        <MetricBanner :items="bannerItems" />
      </div>

      <!-- ============ Heat map + score distribution ============ -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard
          title="ماتریس ریسک (احتمال × اثر)"
          subtitle="تراکم ریسک‌ها بر اساس شدت"
          :icon="IconRadar2"
        >
          <RiskMatrix :data="data.riskMatrix" />
        </DashboardCard>

        <DashboardCard
          title="توزیع امتیاز ریسک"
          subtitle="بازه‌بندی امتیاز"
          :icon="IconChartHistogram"
        >
          <ScoreHistogram :data="data.scoreDistribution" />
        </DashboardCard>
      </div>

      <!-- ============ دسته‌بندی‌ها: برترین دسته‌ها + توزیع دسته‌ای ============ -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard
          title="دسته‌های اصلی ریسک"
          subtitle="دسته‌بندی‌های پرتکرار ریسک"
          :icon="IconListNumbers"
        >
          <TopDrivers :data="data.categoryDistribution" />
        </DashboardCard>

        <DashboardCard
          title="توزیع بر اساس دسته‌بندی"
          subtitle="تفکیک سطح ریسک در هر دسته"
          :icon="IconCategory"
        >
          <CategoryStacked :data="data.categoryDistribution" />
        </DashboardCard>
      </div>

      <!-- ============ Status donuts row ============ -->
      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="توزیع بر اساس سطح ریسک" subtitle="پراکندگی شدت ریسک‌ها" :icon="IconPalette">
          <LevelDonut :data="summary.byLevel" />
        </DashboardCard>
        <DashboardCard title="وضعیت چرخه عمر" subtitle="تعداد ریسک در هر مرحله" :icon="IconGitBranch">
          <StateBar :data="summary.byState" />
        </DashboardCard>
        <DashboardCard title="ماهیت ریسک" subtitle="تفکیک تهدید و فرصت" :icon="IconAlertTriangle">
          <TypeSplit :data="summary.byType" />
        </DashboardCard>
        <DashboardCard title="توزیع مالکیت ریسک" subtitle="بار کاری کارشناسان" :icon="IconUser">
          <OwnerPanel :data="data.ownerDistribution" :member-names="memberNames" />
        </DashboardCard>
      </div>

      <!-- ============ Phase tabs + recent activity ============ -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard
          title="ریسک‌های برتر بر اساس فاز"
          subtitle="تحلیل / پاسخ / پایش"
          :icon="IconBuildingSkyscraper"
        >
          <PhaseTabs
            :analysis="data.topAnalysis"
            :response="data.topResponse"
            :monitoring="data.topMonitoring"
            :member-names="memberNames"
          />
        </DashboardCard>
        <DashboardCard
          title="فعالیت‌های اخیر"
          subtitle="آخرین تغییرات ریسک‌ها"
          :icon="IconHistory"
        >
          <div class="max-h-96 overflow-y-auto pl-1">
            <RiskList :items="data.recentActivity" show-framework :member-names="memberNames" />
          </div>
        </DashboardCard>
      </div>

      <!-- ============ Framework heatmap + extremes + domain ============ -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardCard
          title="نقشه حرارتی چارچوب‌ها"
          subtitle="پراکندگی سطح ریسک در هر چارچوب"
          :icon="IconLayoutGrid"
        >
          <FrameworkHeatmap :heatmap="data.frameworkHeatmap" :overview="data.frameworkOverview" />
        </DashboardCard>
        <DashboardCard
          title="ریسک‌های حدی هر چارچوب"
          subtitle="بیشترین و کمترین امتیاز"
          :icon="IconGitBranch"
        >
          <FrameworkExtremes :high="data.frameworkHighRisk" :low="data.frameworkLowRisk" />
        </DashboardCard>
        <DashboardCard
          title="توزیع ریسک بر اساس دامنه کنترلی"
          subtitle="دامنه‌های پرتکرار در چارچوب‌ها"
          :icon="IconCategory"
        >
          <RiskByDomain :data="data.riskByDomain" />
        </DashboardCard>
      </div>

      <!-- ============ Deadlines + quick links ============ -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard
          title="ریسک‌های دارای تأخیر"
          :subtitle="`${toFa(overdueCount)} مورد — مهلت سپری‌شده`"
          :icon="IconCalendarClock"
        >
          <div class="max-h-96 overflow-y-auto pl-1">
            <DeadlineList :items="data.overdueRisks" />
          </div>
        </DashboardCard>
        <DashboardCard
          title="دسترسی سریع"
          subtitle="مسیرهای پرکاربرد"
          :icon="IconBook2"
        >
          <QuickLinks />
        </DashboardCard>
      </div>

      <footer class="mt-8 pb-4 text-center text-xs text-slate-400">
        داشبورد مدیریت ریسک، حاکمیت و تطبیق (GRC)
      </footer>
    </div>
  </div>
</template>
