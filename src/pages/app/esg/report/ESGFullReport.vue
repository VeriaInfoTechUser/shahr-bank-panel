<template>
  <div id="esg-full-report" class="bg-gray-50 min-h-screen font-sans">
    <!-- Cover / Header -->
    <div class="bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-700 text-white py-20">
      <div class="max-w-6xl mx-auto px-8 text-center">
        <div class="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full mb-6">
          <span class="text-3xl">🌱</span>
          <span class="font-semibold tracking-widest">ESG REPORT</span>
        </div>
        <h1 class="text-6xl font-bold mb-4">گزارش پایداری و مسئولیت اجتماعی</h1>
        <p class="text-2xl opacity-90">{{ data.reporting_period }}</p>
        <p class="mt-4 text-lg">آخرین به‌روزرسانی: {{ data.last_updated }}</p>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-8 py-12">
      <!-- Executive Summary -->
      <div class="bg-white rounded-3xl shadow-2xl p-10 mb-16">
        <h2 class="text-4xl font-bold text-center mb-10 text-gray-800">خلاصه اجرایی</h2>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <StatCard :label="'کل KPIها'" :value="data.total_kpis" color="emerald" />
          <StatCard :label="'امتیاز کلی'" :value="overallScore" color="teal" suffix="%" />
          <StatCard :label="'درصد تکمیل'" :value="overallCompletion" color="cyan" suffix="%" />
          <StatCard :label="'تعداد دامنه‌ها'" :value="totalDomains" color="amber" />
        </div>

        <div class="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <PillarSummary v-for="pillar in pillars" :key="pillar.key" :pillar="pillar" />
        </div>
      </div>

      <!-- Navigation -->
      <div class="sticky top-4 z-50 bg-white/90 backdrop-blur-lg border-b mb-12 rounded-2xl shadow">
        <div class="flex gap-1 p-2" role="tablist">
          <TabButton v-for="tab in tabs" :key="tab.key" :tab="tab" :active="activeTab === tab.key" @click="activeTab = tab.key" />
        </div>
      </div>

      <!-- GOVERNANCE -->
      <div v-if="activeTab === 'governance'" class="space-y-16">
        <SectionHeader :title="data.governance.summary.title || 'حاکمیت شرکتی'" icon="🏛️" />
        <DomainRadarChart :data="data.governance.charts.radar_data" />
        <DomainPerformance :domains="data.governance.domains" />
        <DetailedKPIs :domains="data.governance.domains" />
      </div>

      <!-- SOCIAL -->
      <div v-if="activeTab === 'social'" class="space-y-16">
        <SectionHeader :title="data.social.summary.title || 'مسئولیت اجتماعی'" icon="👥" />
        <DomainRadarChart :data="data.social.charts?.radar_data || []" />
        <DomainPerformance :domains="data.social.domains" />
        <DetailedKPIs :domains="data.social.domains" />
      </div>

      <!-- ENVIRONMENTAL -->
      <div v-if="activeTab === 'environmental'" class="space-y-16">
        <SectionHeader :title="data.environmental.summary.title || 'مسئولیت زیست‌محیطی'" icon="🌍" />
        <DomainRadarChart :data="data.environmental.charts?.radar_data || []" />
        <DomainPerformance :domains="data.environmental.domains" />
        <DetailedKPIs :domains="data.environmental.domains" />
      </div>

      <!-- Overall Performance -->
      <div class="mt-20 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-12 border border-emerald-100">
        <h2 class="text-3xl font-bold text-center mb-8">عملکرد کلی پایداری</h2>
        <div class="text-center">
          <div class="text-7xl font-bold text-emerald-600 mb-4">{{ overallScore }}%</div>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            گزارش حاضر بر اساس {{ data.total_kpis }} معیار کلیدی در سه بعد حاکمیت، اجتماعی و زیست‌محیطی تهیه شده است.
          </p>
        </div>
      </div>
    </div>

    <!-- Export Button -->
    <div class="fixed bottom-8 right-8 z-50">
      <button @click="exportToPDF"
              class="flex items-center gap-3 bg-emerald-700 hover:bg-emerald-800 text-white px-10 py-5 rounded-2xl shadow-2xl font-semibold text-lg transition-all active:scale-95">
        <span>📥</span>
        دانلود گزارش PDF
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import html2pdf from 'html2pdf.js'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([CanvasRenderer, RadarChart, TooltipComponent, LegendComponent, TitleComponent])

const props = defineProps({ reportData: { type: Object, required: true } })

const data = computed(() => props.reportData.data)
const activeTab = ref('governance')

const tabs = [
  { key: 'governance', label: 'حاکمیت', icon: '🏛️' },
  { key: 'social', label: 'اجتماعی', icon: '👥' },
  { key: 'environmental', label: 'زیست‌محیطی', icon: '🌍' }
]

const pillars = computed(() => [
  { key: 'governance', title: 'حاکمیت', summary: data.value.governance.summary, color: 'emerald' },
  { key: 'social', title: 'اجتماعی', summary: data.value.social.summary, color: 'blue' },
  { key: 'environmental', title: 'زیست‌محیطی', summary: data.value.environmental.summary, color: 'teal' }
])

const overallCompletion = computed(() => {
  const g = data.value.governance.summary.completion || 0
  const s = data.value.social.summary.completion || 0
  const e = data.value.environmental.summary.completion || 0
  return Math.round((g + s + e) / 3)
})

const overallScore = computed(() => {
  const g = data.value.governance.summary.avg_score || 0
  const s = data.value.social.summary.avg_score || 0
  const e = data.value.environmental.summary.avg_score || 0
  return Math.round((g + s + e) / 3)
})

const totalDomains = computed(() =>
    data.value.governance.domains.length +
    data.value.social.domains.length +
    data.value.environmental.domains.length
)

// PDF Export
const exportToPDF = () => {
  const element = document.getElementById('esg-full-report')
  const opt = {
    margin: [10, 10, 15, 10],
    filename: `ESG-Report-${data.value.reporting_period.replace(/\s+/g, '')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  }
  html2pdf().set(opt).from(element).save()
}
</script>