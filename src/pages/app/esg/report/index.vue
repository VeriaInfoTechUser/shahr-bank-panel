<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { Bar, Radar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title, Tooltip, Legend,
  BarElement, RadialLinearScale, ArcElement,
  PointElement, CategoryScale, LinearScale, Filler
} from 'chart.js'
import html2pdf from 'html2pdf.js'
import dayjs from 'dayjs'
import { Download, Award, TrendingUp, Users, Leaf, Shield, CheckCircle2, AlertCircle } from 'lucide-vue-next'

ChartJS.register(
    Title, Tooltip, Legend, BarElement, RadialLinearScale,
    ArcElement, PointElement, CategoryScale, LinearScale, Filler
)

const reportData = ref(null)
const isLoading = ref(true)
const isGenerating = ref(false)
const reportRef = ref(null)

onMounted(async () => {
  try {
    const res = await esgRepo.dashboard({})
    reportData.value = res?.data || res
  } catch (e) {
    console.error('Dashboard load error:', e)
  } finally {
    isLoading.value = false
  }
})

/* ---------- Helpers ---------- */
const fa = (n) => (n ?? 0).toLocaleString('fa-IR')
const faPercent = (n) => `${fa(n)}٪`
const faDate = (d) => d ? dayjs(d).locale('fa').format('YYYY/MM/DD') : '—'

const governance = computed(() => reportData.value?.governance)
const social = computed(() => reportData.value?.social)
const environmental = computed(() => reportData.value?.environmental)
const frameworks = computed(() => reportData.value?.framework_coverage || [])

/* ---------- Summary ---------- */
const totalKpis = computed(() => reportData.value?.total_kpis || 0)
const answered = computed(() => {
  return (governance.value?.summary?.answered || 0) +
      (social.value?.summary?.answered || 0) +
      (environmental.value?.summary?.answered || 0)
})
const avgScore = computed(() => {
  const g = governance.value?.summary?.avg_score || 0
  const s = social.value?.summary?.avg_score || 0
  const e = environmental.value?.summary?.avg_score || 0
  return ((g + s + e) / 3).toFixed(1)
})
const completion = computed(() => {
  if (!totalKpis.value) return 0
  return ((answered.value / totalKpis.value) * 100).toFixed(1)
})

/* ---------- Charts ---------- */
const esgDoughnutData = computed(() => ({
  labels: ['حاکمیت (G)', 'اجتماعی (S)', 'محیطی (E)'],
  datasets: [{
    data: [
      governance.value?.summary?.avg_score || 0,
      social.value?.summary?.avg_score || 0,
      environmental.value?.summary?.avg_score || 0
    ],
    backgroundColor: ['#6366f1', '#10b981', '#06b6d4'],
    borderWidth: 0
  }]
}))
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', rtl: true, labels: { font: { size: 11 } } }
  }
}

const radarData = computed(() => {
  const radar = reportData.value?.charts?.radar_data || []
  return {
    labels: radar.map(d => d.domain),
    datasets: [{
      label: 'امتیاز دامنه‌های حاکمیتی',
      data: radar.map(d => d.score),
      backgroundColor: 'rgba(99,102,241,0.25)',
      borderColor: '#6366f1',
      borderWidth: 2,
      pointBackgroundColor: '#6366f1'
    }]
  }
})
const radarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } }
  },
  plugins: { legend: { display: false } }
}

const govBarData = computed(() => {
  const bars = reportData.value?.charts?.domain_bar_percent || []
  return {
    labels: bars.map(d => d.domain),
    datasets: [{
      label: 'امتیاز (٪)',
      data: bars.map(d => d.score),
      backgroundColor: '#6366f1'
    }]
  }
})
const socBarData = computed(() => {
  const domains = social.value?.domains || []
  return {
    labels: domains.map(d => d.title),
    datasets: [{
      label: 'امتیاز (٪)',
      data: domains.map(d => d.avg_score),
      backgroundColor: '#10b981'
    }]
  }
})
const envBarData = computed(() => {
  const domains = environmental.value?.domains || []
  return {
    labels: domains.map(d => d.title),
    datasets: [{
      label: 'امتیاز (٪)',
      data: domains.map(d => d.avg_score),
      backgroundColor: '#06b6d4'
    }]
  }
})
const horizontalBarOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: { beginAtZero: true, max: 100 } }
}

/* ---------- Framework chart ---------- */
const frameworkChartData = computed(() => ({
  labels: frameworks.value.map(f => f.name),
  datasets: [{
    label: 'تعداد KPI پوشش داده شده',
    data: frameworks.value.map(f => f.count),
    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']
  }]
}))

/* ---------- PDF ---------- */
const downloadPDF = async () => {
  if (!reportRef.value) return
  isGenerating.value = true
  await nextTick()
  const opt = {
    margin: [10, 10, 10, 10],
    filename: `ESG-Report-${reportData.value?.reporting_period || '2024'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      scrollY: 0,
      windowWidth: reportRef.value.scrollWidth
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  }
  try {
    await html2pdf().set(opt).from(reportRef.value).save()
  } catch (e) {
    console.error(e)
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div dir="rtl" class="min-h-screen bg-slate-100 font-sans">
    <!-- Floating PDF Download Button -->
    <button
        @click="downloadPDF"
        :disabled="isGenerating || isLoading"
        class="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white px-5 py-3 rounded-xl shadow-xl transition"
    >
      <Download v-if="!isGenerating" class="w-5 h-5" />
      <span class="font-bold">{{ isGenerating ? 'در حال تولید...' : 'دانلود PDF' }}</span>
    </button>

    <div v-if="isLoading" class="flex items-center justify-center h-96">
      <div class="text-slate-500 text-lg">در حال بارگذاری گزارش...</div>
    </div>

    <!-- Main Report Document (A4 layout) -->
    <div
        v-else
        ref="reportRef"
        class="report-document bg-white mx-auto my-4 shadow-2xl"
        style="max-width: 210mm; padding: 20mm 18mm; color: #1e293b; font-family: Tahoma, sans-serif;"
    >
      <!-- ===================== COVER PAGE ===================== -->
      <section class="cover-page text-center mb-8 pb-8 border-b-4 border-indigo-600">
        <div class="mb-6">
          <div class="inline-flex items-center justify-center w-24 h-24 bg-indigo-100 rounded-full mb-4">
            <Leaf class="w-12 h-12 text-indigo-600" />
          </div>
        </div>
        <h1 class="text-4xl font-black text-indigo-900 mb-3">گزارش پایداری و ESG</h1>
        <h2 class="text-xl text-slate-600 mb-6">{{ reportData?.reporting_period || 'گزارش سالانه' }}</h2>
        <div class="grid grid-cols-3 gap-4 mt-10 max-w-2xl mx-auto">
          <div class="bg-indigo-50 p-4 rounded-lg">
            <div class="text-3xl font-black text-indigo-700">{{ fa(totalKpis) }}</div>
            <div class="text-xs text-slate-600 mt-1">کل شاخص‌های ارزیابی</div>
          </div>
          <div class="bg-emerald-50 p-4 rounded-lg">
            <div class="text-3xl font-black text-emerald-700">{{ faPercent(completion) }}</div>
            <div class="text-xs text-slate-600 mt-1">نرخ تکمیل</div>
          </div>
          <div class="bg-cyan-50 p-4 rounded-lg">
            <div class="text-3xl font-black text-cyan-700">{{ fa(avgScore) }}</div>
            <div class="text-xs text-slate-600 mt-1">میانگین امتیاز ESG</div>
          </div>
        </div>
        <div class="mt-10 text-sm text-slate-500">
          آخرین بروزرسانی: {{ faDate(reportData?.last_updated) }}
        </div>
      </section>

      <!-- ===================== EXECUTIVE SUMMARY ===================== -->
      <section class="mb-10">
        <h2 class="text-2xl font-bold text-indigo-900 border-r-4 border-indigo-600 pr-3 mb-4">خلاصه اجرایی</h2>

        <div class="grid grid-cols-3 gap-4 mb-6">
          <!-- Governance Card -->
          <div class="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50/40">
            <div class="flex items-center gap-2 mb-3">
              <Shield class="w-6 h-6 text-indigo-600" />
              <span class="font-bold text-indigo-900">حاکمیت (G)</span>
            </div>
            <div class="text-3xl font-black text-indigo-700">{{ fa(governance?.summary?.avg_score) }}</div>
            <div class="text-xs text-slate-600 mt-1">امتیاز از ۱۰۰</div>
            <div class="mt-3 text-xs text-slate-500">
              {{ fa(governance?.summary?.answered) }} از {{ fa(governance?.summary?.total_kpis) }} شاخص پاسخ داده شده
            </div>
          </div>
          <!-- Social Card -->
          <div class="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50/40">
            <div class="flex items-center gap-2 mb-3">
              <Users class="w-6 h-6 text-emerald-600" />
              <span class="font-bold text-emerald-900">اجتماعی (S)</span>
            </div>
            <div class="text-3xl font-black text-emerald-700">{{ fa(social?.summary?.avg_score) }}</div>
            <div class="text-xs text-slate-600 mt-1">امتیاز از ۱۰۰</div>
            <div class="mt-3 text-xs text-slate-500">
              {{ fa(social?.summary?.answered) }} از {{ fa(social?.summary?.total_kpis) }} شاخص پاسخ داده شده
            </div>
          </div>
          <!-- Environmental Card -->
          <div class="border-2 border-cyan-200 rounded-lg p-4 bg-cyan-50/40">
            <div class="flex items-center gap-2 mb-3">
              <Leaf class="w-6 h-6 text-cyan-600" />
              <span class="font-bold text-cyan-900">محیطی (E)</span>
            </div>
            <div class="text-3xl font-black text-cyan-700">{{ fa(environmental?.summary?.avg_score) }}</div>
            <div class="text-xs text-slate-600 mt-1">امتیاز از ۱۰۰</div>
            <div class="mt-3 text-xs text-slate-500">
              {{ fa(environmental?.summary?.answered) }} از {{ fa(environmental?.summary?.total_kpis) }} شاخص پاسخ داده شده
            </div>
          </div>
        </div>

        <!-- ESG Doughnut Chart -->
        <div class="grid grid-cols-2 gap-6">
          <div class="bg-slate-50 rounded-lg p-4" style="height: 260px;">
            <h3 class="font-bold text-slate-700 mb-2 text-sm">ترکیب امتیازات سه رکن ESG</h3>
            <Doughnut :data="esgDoughnutData" :options="doughnutOptions" />
          </div>
          <div class="bg-slate-50 rounded-lg p-4" style="height: 260px;">
            <h3 class="font-bold text-slate-700 mb-2 text-sm">پوشش چارچوب‌های بین‌المللی</h3>
            <Bar :data="frameworkChartData" :options="horizontalBarOptions" />
          </div>
        </div>
      </section>

      <!-- ===================== GOVERNANCE ===================== -->
      <section class="mb-10" style="page-break-before: always;">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xl">G</div>
          <h2 class="text-2xl font-bold text-indigo-900">بخش حاکمیت شرکتی (Governance)</h2>
        </div>

        <p class="text-sm text-slate-600 mb-4 leading-6">
          این بخش شامل ارزیابی {{ fa(governance?.summary?.total_kpis) }} شاخص کلیدی در {{ fa(governance?.domains?.length) }} دامنه حاکمیتی است.
          میانگین امتیاز کسب‌شده <strong>{{ fa(governance?.summary?.avg_score) }}</strong> از ۱۰۰ می‌باشد و
          نرخ تکمیل <strong>{{ fa(governance?.summary?.completion) }}٪</strong> را ثبت کرده است.
        </p>

        <!-- Radar -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-indigo-50/40 rounded-lg p-4" style="height: 320px;">
            <h3 class="font-bold text-indigo-900 mb-2 text-sm">نمودار راداری دامنه‌های حاکمیتی</h3>
            <Radar :data="radarData" :options="radarOptions" />
          </div>
          <div class="bg-indigo-50/40 rounded-lg p-4" style="height: 320px;">
            <h3 class="font-bold text-indigo-900 mb-2 text-sm">امتیاز دامنه‌ها (نمودار میله‌ای)</h3>
            <Bar :data="govBarData" :options="horizontalBarOptions" />
          </div>
        </div>

        <!-- Governance Domains Table -->
        <table class="w-full text-xs border-collapse border border-slate-300">
          <thead class="bg-indigo-600 text-white">
          <tr>
            <th class="border border-indigo-700 p-2 text-right">کد</th>
            <th class="border border-indigo-700 p-2 text-right">دامنه</th>
            <th class="border border-indigo-700 p-2 text-center">KPI</th>
            <th class="border border-indigo-700 p-2 text-center">پاسخ</th>
            <th class="border border-indigo-700 p-2 text-center">میانگین امتیاز</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="d in governance?.domains" :key="d.code" class="even:bg-slate-50">
            <td class="border border-slate-300 p-2 font-mono">{{ d.code }}</td>
            <td class="border border-slate-300 p-2">{{ d.title }}</td>
            <td class="border border-slate-300 p-2 text-center">{{ fa(d.kpi_count) }}</td>
            <td class="border border-slate-300 p-2 text-center">{{ fa(d.answered) }}</td>
            <td class="border border-slate-300 p-2 text-center font-bold">
                <span :class="{
                  'text-emerald-600': d.avg_score >= 80,
                  'text-amber-600': d.avg_score >= 60 && d.avg_score < 80,
                  'text-red-600': d.avg_score < 60
                }">{{ fa(d.avg_score) }}</span>
            </td>
          </tr>
          </tbody>
        </table>

        <!-- Detailed KPIs per Governance Domain -->
        <div v-for="domain in governance?.domains" :key="domain.code" class="mt-6">
          <h3 class="font-bold text-indigo-800 text-sm mb-2 border-b-2 border-indigo-200 pb-1">
            {{ domain.title }} — <span class="font-mono text-xs text-slate-500">{{ domain.code }}</span>
          </h3>
          <table class="w-full text-xs border-collapse border border-slate-300">
            <thead class="bg-slate-100">
            <tr>
              <th class="border border-slate-300 p-2 text-right">کد KPI</th>
              <th class="border border-slate-300 p-2 text-right">عنوان شاخص</th>
              <th class="border border-slate-300 p-2 text-center">مقدار</th>
              <th class="border border-slate-300 p-2 text-center">واحد</th>
              <th class="border border-slate-300 p-2 text-center">وضعیت</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="k in domain.kpis" :key="k.code" class="even:bg-slate-50">
              <td class="border border-slate-300 p-2 font-mono">{{ k.code }}</td>
              <td class="border border-slate-300 p-2">{{ k.title }}</td>
              <td class="border border-slate-300 p-2 text-center font-bold">
                {{ k.value != null ? fa(k.value) : '—' }}
              </td>
              <td class="border border-slate-300 p-2 text-center text-slate-500">{{ k.unit }}</td>
              <td class="border border-slate-300 p-2 text-center">
                  <span v-if="k.status === 'answered'" class="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 class="w-3 h-3" /> پاسخ داده شده
                  </span>
                <span v-else class="inline-flex items-center gap-1 text-red-600">
                    <AlertCircle class="w-3 h-3" /> بدون پاسخ
                  </span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===================== SOCIAL ===================== -->
      <section class="mb-10" style="page-break-before: always;">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xl">S</div>
          <h2 class="text-2xl font-bold text-emerald-900">بخش اجتماعی (Social)</h2>
        </div>

        <p class="text-sm text-slate-600 mb-4 leading-6">
          این بخش شامل ارزیابی {{ fa(social?.summary?.total_kpis) }} شاخص در {{ fa(social?.domains?.length) }} دامنه اجتماعی است.
          میانگین امتیاز <strong>{{ fa(social?.summary?.avg_score) }}</strong> و نرخ تکمیل <strong>{{ fa(social?.summary?.completion) }}٪</strong> می‌باشد.
        </p>

        <div class="bg-emerald-50/40 rounded-lg p-4 mb-6" style="height: 320px;">
          <h3 class="font-bold text-emerald-900 mb-2 text-sm">امتیاز دامنه‌های اجتماعی</h3>
          <Bar :data="socBarData" :options="horizontalBarOptions" />
        </div>

        <table class="w-full text-xs border-collapse border border-slate-300 mb-4">
          <thead class="bg-emerald-600 text-white">
          <tr>
            <th class="border border-emerald-700 p-2 text-right">کد</th>
            <th class="border border-emerald-700 p-2 text-right">دامنه</th>
            <th class="border border-emerald-700 p-2 text-center">KPI</th>
            <th class="border border-emerald-700 p-2 text-center">پاسخ</th>
            <th class="border border-emerald-700 p-2 text-center">امتیاز</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="d in social?.domains" :key="d.code" class="even:bg-slate-50">
            <td class="border border-slate-300 p-2 font-mono">{{ d.code }}</td>
            <td class="border border-slate-300 p-2">{{ d.title }}</td>
            <td class="border border-slate-300 p-2 text-center">{{ fa(d.kpi_count) }}</td>
            <td class="border border-slate-300 p-2 text-center">{{ fa(d.answered) }}</td>
            <td class="border border-slate-300 p-2 text-center font-bold">
                <span :class="{
                  'text-emerald-600': d.avg_score >= 80,
                  'text-amber-600': d.avg_score >= 60 && d.avg_score < 80,
                  'text-red-600': d.avg_score < 60
                }">{{ fa(d.avg_score) }}</span>
            </td>
          </tr>
          </tbody>
        </table>

        <div v-for="domain in social?.domains" :key="domain.code" class="mt-6">
          <h3 class="font-bold text-emerald-800 text-sm mb-2 border-b-2 border-emerald-200 pb-1">
            {{ domain.title }} — <span class="font-mono text-xs text-slate-500">{{ domain.code }}</span>
          </h3>
          <table class="w-full text-xs border-collapse border border-slate-300">
            <thead class="bg-slate-100">
            <tr>
              <th class="border border-slate-300 p-2 text-right">کد KPI</th>
              <th class="border border-slate-300 p-2 text-right">عنوان شاخص</th>
              <th class="border border-slate-300 p-2 text-center">مقدار</th>
              <th class="border border-slate-300 p-2 text-center">واحد</th>
              <th class="border border-slate-300 p-2 text-center">وضعیت</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="k in domain.kpis" :key="k.code" class="even:bg-slate-50">
              <td class="border border-slate-300 p-2 font-mono">{{ k.code }}</td>
              <td class="border border-slate-300 p-2">{{ k.title }}</td>
              <td class="border border-slate-300 p-2 text-center font-bold">
                {{ k.value != null ? fa(k.value) : '—' }}
              </td>
              <td class="border border-slate-300 p-2 text-center text-slate-500">{{ k.unit }}</td>
              <td class="border border-slate-300 p-2 text-center">
                  <span v-if="k.status === 'answered'" class="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 class="w-3 h-3" /> پاسخ
                  </span>
                <span v-else class="inline-flex items-center gap-1 text-red-600">
                    <AlertCircle class="w-3 h-3" /> بدون پاسخ
                  </span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===================== ENVIRONMENTAL ===================== -->
      <section class="mb-10" style="page-break-before: always;">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center text-white font-black text-xl">E</div>
          <h2 class="text-2xl font-bold text-cyan-900">بخش محیطی (Environmental)</h2>
        </div>

        <p class="text-sm text-slate-600 mb-4 leading-6">
          این بخش {{ fa(environmental?.summary?.total_kpis) }} شاخص در {{ fa(environmental?.domains?.length) }} دامنه زیست‌محیطی را پوشش می‌دهد.
          میانگین امتیاز <strong>{{ fa(environmental?.summary?.avg_score) }}</strong> و نرخ تکمیل <strong>{{ fa(environmental?.summary?.completion) }}٪</strong> است.
        </p>

        <div class="bg-cyan-50/40 rounded-lg p-4 mb-6" style="height: 320px;">
          <h3 class="font-bold text-cyan-900 mb-2 text-sm">امتیاز دامنه‌های محیطی</h3>
          <Bar :data="envBarData" :options="horizontalBarOptions" />
        </div>

        <table class="w-full text-xs border-collapse border border-slate-300 mb-4">
          <thead class="bg-cyan-600 text-white">
          <tr>
            <th class="border border-cyan-700 p-2 text-right">کد</th>
            <th class="border border-cyan-700 p-2 text-right">دامنه</th>
            <th class="border border-cyan-700 p-2 text-center">KPI</th>
            <th class="border border-cyan-700 p-2 text-center">پاسخ</th>
            <th class="border border-cyan-700 p-2 text-center">امتیاز</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="d in environmental?.domains" :key="d.code" class="even:bg-slate-50">
            <td class="border border-slate-300 p-2 font-mono">{{ d.code }}</td>
            <td class="border border-slate-300 p-2">{{ d.title }}</td>
            <td class="border border-slate-300 p-2 text-center">{{ fa(d.kpi_count) }}</td>
            <td class="border border-slate-300 p-2 text-center">{{ fa(d.answered) }}</td>
            <td class="border border-slate-300 p-2 text-center font-bold">
                <span :class="{
                  'text-emerald-600': d.avg_score >= 80,
                  'text-amber-600': d.avg_score >= 60 && d.avg_score < 80,
                  'text-red-600': d.avg_score < 60
                }">{{ fa(d.avg_score) }}</span>
            </td>
          </tr>
          </tbody>
        </table>

        <div v-for="domain in environmental?.domains" :key="domain.code" class="mt-6">
          <h3 class="font-bold text-cyan-800 text-sm mb-2 border-b-2 border-cyan-200 pb-1">
            {{ domain.title }} — <span class="font-mono text-xs text-slate-500">{{ domain.code }}</span>
          </h3>
          <table class="w-full text-xs border-collapse border border-slate-300">
            <thead class="bg-slate-100">
            <tr>
              <th class="border border-slate-300 p-2 text-right">کد KPI</th>
              <th class="border border-slate-300 p-2 text-right">عنوان شاخص</th>
              <th class="border border-slate-300 p-2 text-center">مقدار</th>
              <th class="border border-slate-300 p-2 text-center">واحد</th>
              <th class="border border-slate-300 p-2 text-center">وضعیت</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="k in domain.kpis" :key="k.code" class="even:bg-slate-50">
              <td class="border border-slate-300 p-2 font-mono">{{ k.code }}</td>
              <td class="border border-slate-300 p-2">{{ k.title }}</td>
              <td class="border border-slate-300 p-2 text-center font-bold">
                {{ k.value != null ? fa(k.value) : '—' }}
              </td>
              <td class="border border-slate-300 p-2 text-center text-slate-500">{{ k.unit }}</td>
              <td class="border border-slate-300 p-2 text-center">
                  <span v-if="k.status === 'answered'" class="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 class="w-3 h-3" /> پاسخ
                  </span>
                <span v-else class="inline-flex items-center gap-1 text-red-600">
                    <AlertCircle class="w-3 h-3" /> بدون پاسخ
                  </span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===================== HIGHLIGHTS ===================== -->
      <section class="mb-10" style="page-break-before: always;">
        <h2 class="text-2xl font-bold text-slate-800 border-r-4 border-slate-600 pr-3 mb-4">نکات برجسته گزارش</h2>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <TrendingUp class="w-5 h-5 text-emerald-600" />
              <span class="font-bold text-emerald-800">قوی‌ترین دامنه‌ها</span>
            </div>
            <ul class="text-xs space-y-1 text-slate-700">
              <li v-for="d in [...(governance?.domains || []), ...(social?.domains || []), ...(environmental?.domains || [])]
                .sort((a,b) => b.avg_score - a.avg_score).slice(0,5)" :key="d.code">
                • {{ d.title }} — <strong>{{ fa(d.avg_score) }}</strong>
              </li>
            </ul>
          </div>
          <div class="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <AlertCircle class="w-5 h-5 text-red-600" />
              <span class="font-bold text-red-800">نیازمند بهبود</span>
            </div>
            <ul class="text-xs space-y-1 text-slate-700">
              <li v-for="d in [...(governance?.domains || []), ...(social?.domains || []), ...(environmental?.domains || [])]
                .sort((a,b) => a.avg_score - b.avg_score).slice(0,5)" :key="d.code">
                • {{ d.title }} — <strong>{{ fa(d.avg_score) }}</strong>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ===================== FOOTER ===================== -->
      <footer class="border-t-2 border-slate-300 pt-4 text-xs text-slate-500 text-center">
        <p>این گزارش بر اساس {{ fa(totalKpis) }} شاخص کلیدی عملکرد در سه رکن محیطی، اجتماعی و حاکمیتی تولید شده است.</p>
        <p class="mt-1">دوره گزارش: {{ reportData?.reporting_period }} | تاریخ تولید: {{ faDate(new Date()) }}</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Print-friendly & PDF optimization */
@media print {
  .report-document {
    box-shadow: none !important;
    margin: 0 !important;
  }
}

.report-document {
  line-height: 1.6;
  font-size: 13px;
}

table {
  page-break-inside: auto;
}

tr {
  page-break-inside: avoid;
}

/* Persian numeral support */
.report-document {
  font-feature-settings: "ss01";
}
</style>