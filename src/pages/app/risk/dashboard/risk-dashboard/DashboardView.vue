<script setup lang="ts">
import { computed, ref, onMounted } from "vue"
import type { DashboardData } from "./types"
import { toFa } from "./helpers"

import DashboardHeader from "./components/DashboardHeader.vue"
import DashboardCard from "./components/DashboardCard.vue"
import StatCard from "./components/StatCard.vue"
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

import {
  IconLayersIntersect,
  IconAlertHexagon,
  IconCalendarExclamation,
  IconActivityHeartbeat,
} from "@tabler/icons-vue"

import { ermRepo } from "@/core/repositories/ermRepo"
import { fetchMemberLightListCached } from "@/core/erm/ruleAuthorTypeOptionsCache"

const props = defineProps<{
  data: DashboardData
  loading?: boolean
}>()

defineEmits<{
  (e: "refresh"): void
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
const overdueCount = computed(() => props.data.overdueRisks.length)
const monitoringCount = computed(
  () => summary.value.byState.find((s) => s.state === "monitoring")?.count ?? 0,
)
</script>

<template>
  <div dir="rtl" class="min-h-screen bg-slate-50 text-slate-800">
    <div class="mx-auto max-w-[1500px] px-4 py-6 lg:px-8">
      <DashboardHeader :loading="loading" @refresh="$emit('refresh')" />

      <!-- KPI row -->
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="کل ریسک‌ها"
          :value="summary.total"
          :icon="IconLayersIntersect"
          accent="#38bdf8"
          :hint="`${toFa(highCount + criticalCount)} مورد پرخطر`"
        />
        <StatCard
          label="ریسک‌های بحرانی"
          :value="criticalCount"
          :icon="IconAlertHexagon"
          accent="#f43f5e"
          hint="نیازمند اقدام فوری"
        />
        <StatCard
          label="دارای تأخیر"
          :value="overdueCount"
          :icon="IconCalendarExclamation"
          accent="#fb923c"
          hint="مهلت سپری‌شده"
        />
        <StatCard
          label="در حال پایش"
          :value="monitoringCount"
          :icon="IconActivityHeartbeat"
          accent="#2dd4bf"
          hint="تحت کنترل"
        />
      </div>

      <!-- distributions -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardCard title="توزیع بر اساس سطح ریسک" subtitle="پراکندگی شدت ریسک‌ها">
          <LevelDonut :data="summary.byLevel" />
        </DashboardCard>
        <DashboardCard title="وضعیت چرخه عمر" subtitle="تعداد ریسک در هر مرحله">
          <StateBar :data="summary.byState" />
        </DashboardCard>
        <DashboardCard title="ماهیت ریسک" subtitle="تفکیک تهدید و فرصت">
          <TypeSplit :data="summary.byType" />
        </DashboardCard>
      </div>

      <!-- matrix + score -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <DashboardCard
          class="lg:col-span-3"
          title="ماتریس ریسک (احتمال × اثر)"
          subtitle="تراکم ریسک‌ها بر اساس شدت"
        >
          <RiskMatrix :data="data.riskMatrix" />
        </DashboardCard>
        <DashboardCard class="lg:col-span-2" title="توزیع امتیاز ریسک" subtitle="بازه‌بندی امتیاز">
          <ScoreHistogram :data="data.scoreDistribution" />
        </DashboardCard>
      </div>

      <!-- category + phase tabs -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <DashboardCard
          class="lg:col-span-3"
          title="توزیع بر اساس دسته‌بندی"
          subtitle="تفکیک سطح ریسک در هر دسته"
        >
          <CategoryStacked :data="data.categoryDistribution" />
        </DashboardCard>
        <DashboardCard class="lg:col-span-2" title="ریسک‌های برتر بر اساس فاز">
          <PhaseTabs
            :analysis="data.topAnalysis"
            :response="data.topResponse"
            :monitoring="data.topMonitoring"
            :member-names="memberNames"
          />
        </DashboardCard>
      </div>

      <!-- framework heatmap + owners -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <DashboardCard
          class="lg:col-span-3"
          title="نقشه حرارتی چارچوب‌ها"
          subtitle="پراکندگی سطح ریسک در هر چارچوب"
        >
          <FrameworkHeatmap :heatmap="data.frameworkHeatmap" :overview="data.frameworkOverview" />
        </DashboardCard>
        <DashboardCard class="lg:col-span-2" title="توزیع مالکیت ریسک" subtitle="بار کاری کارشناسان">
          <OwnerPanel :data="data.ownerDistribution" :member-names="memberNames" />
        </DashboardCard>
      </div>

      <!-- domain + framework extremes -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <DashboardCard
          class="lg:col-span-3"
          title="توزیع ریسک بر اساس دامنه کنترلی"
          subtitle="دامنه‌های پرتکرار در چارچوب‌ها"
        >
          <RiskByDomain :data="data.riskByDomain" />
        </DashboardCard>
        <DashboardCard class="lg:col-span-2" title="ریسک‌های حدی هر چارچوب">
          <FrameworkExtremes :high="data.frameworkHighRisk" :low="data.frameworkLowRisk" />
        </DashboardCard>
      </div>

      <!-- overdue + recent -->
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title="ریسک‌های دارای تأخیر" :subtitle="`${toFa(overdueCount)} مورد`">
          <div class="max-h-96 overflow-y-auto pl-1">
            <RiskList :items="data.overdueRisks" show-deadline :member-names="memberNames" />
          </div>
        </DashboardCard>
        <DashboardCard title="فعالیت‌های اخیر" subtitle="آخرین تغییرات ریسک‌ها">
          <div class="max-h-96 overflow-y-auto pl-1">
            <RiskList :items="data.recentActivity" show-framework :member-names="memberNames" />
          </div>
        </DashboardCard>
      </div>

      <footer     class="mt-8 pb-4 text-center text-xs text-slate-400">
        داشبورد مدیریت ریسک، حاکمیت و تطبیق (GRC)
      </footer>
    </div>
  </div>
</template>
