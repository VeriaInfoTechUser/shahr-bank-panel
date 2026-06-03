<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

// ── Props ────────────────────────────────────────────────────────────────────
const props = defineProps({
  reportData: {
    type: Object,
    default: null,
  },
})

// ── Local state ───────────────────────────────────────────────────────────────
const activeTab = ref('overview')
const isExporting = ref(false)
const chartRefs = ref({})

// ── Computed helpers ──────────────────────────────────────────────────────────
const data = computed(() => props.reportData?.data ?? null)

const gov = computed(() => data.value?.governance ?? null)
const soc = computed(() => data.value?.social ?? null)
const env = computed(() => data.value?.environmental ?? null)

const overallScore = computed(() => {
  if (!data.value) return 0
  const scores = [gov.value?.summary?.avg_score, soc.value?.summary?.avg_score, env.value?.summary?.avg_score].filter(Boolean)
  return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0
})

const scoreLabel = computed(() => {
  const s = parseFloat(overallScore.value)
  if (s >= 85) return { text: 'عالی', color: '#10b981' }
  if (s >= 70) return { text: 'خوب', color: '#3b82f6' }
  if (s >= 55) return { text: 'متوسط', color: '#f59e0b' }
  return { text: 'نیاز به بهبود', color: '#ef4444' }
})

// ── Unit formatter ────────────────────────────────────────────────────────────
function fmtVal(value, unit) {
  if (value === null || value === undefined) return '—'
  const v = parseFloat(value)
  const map = {
    percent: `${v}٪`,
    tco2e: `${v.toLocaleString('fa-IR')} tCO₂e`,
    kWh: `${v.toLocaleString('fa-IR')} kWh`,
    kwh_per_employee: `${v.toLocaleString('fa-IR')} kWh/نفر`,
    m3: `${v.toLocaleString('fa-IR')} m³`,
    liter: `${v.toLocaleString('fa-IR')} لیتر`,
    ton: `${v.toLocaleString('fa-IR')} تن`,
    kg: `${v.toLocaleString('fa-IR')} کیلوگرم`,
    hectare: `${v.toLocaleString('fa-IR')} هکتار`,
    person: `${v.toLocaleString('fa-IR')} نفر`,
    employee: `${v.toLocaleString('fa-IR')} نفر`,
    hour: `${v.toLocaleString('fa-IR')} ساعت`,
    currency: `${v.toLocaleString('fa-IR')} ریال`,
    count: v.toLocaleString('fa-IR'),
    tco2e_per_unit: `${v} tCO₂e/واحد`,
    ton_per_unit: `${v} تن/واحد`,
  }
  return map[unit] ?? `${v.toLocaleString('fa-IR')} ${unit}`
}

function scoreColor(score) {
  if (score >= 85) return '#10b981'
  if (score >= 70) return '#3b82f6'
  if (score >= 55) return '#f59e0b'
  return '#ef4444'
}

// ── Chart builders ────────────────────────────────────────────────────────────
function buildDoughnut(canvasId, value, color) {
  const el = document.getElementById(canvasId)
  if (!el) return
  const existing = Chart.getChart(el)
  if (existing) existing.destroy()
  new Chart(el, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [value, 100 - value],
        backgroundColor: [color, '#e5e7eb'],
        borderWidth: 0,
        hoverOffset: 0,
      }],
    },
    options: {
      cutout: '75%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { duration: 800 },
    },
  })
}

function buildBarChart(canvasId, labels, values, color) {
  const el = document.getElementById(canvasId)
  if (!el) return
  const existing = Chart.getChart(el)
  if (existing) existing.destroy()
  new Chart(el, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: color + 'cc',
        borderColor: color,
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#f3f4f6' }, ticks: { font: { family: 'Vazirmatn' } } },
        y: { grid: { display: false }, ticks: { font: { family: 'Vazirmatn' }, maxRotation: 0 } },
      },
    },
  })
}

function buildGHGChart() {
  const el = document.getElementById('ghg-chart')
  if (!el) return
  const existing = Chart.getChart(el)
  if (existing) existing.destroy()
  new Chart(el, {
    type: 'doughnut',
    data: {
      labels: ['Scope 1', 'Scope 2', 'Scope 3'],
      datasets: [{
        data: [1200, 2500, 8000],
        backgroundColor: ['#059669', '#10b981', '#6ee7b7'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8,
      }],
    },
    options: {
      cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn' }, padding: 16 } },
      },
    },
  })
}

function buildRadarChart() {
  const el = document.getElementById('radar-chart')
  if (!el) return
  const existing = Chart.getChart(el)
  if (existing) existing.destroy()

  const govDomains = (gov.value?.domains ?? []).slice(0, 6)
  const labels = govDomains.map(d => d.title.substring(0, 12) + (d.title.length > 12 ? '…' : ''))
  const values = govDomains.map(d => d.avg_score)

  new Chart(el, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'حاکمیت',
        data: values,
        backgroundColor: 'rgba(99,102,241,0.15)',
        borderColor: '#6366f1',
        pointBackgroundColor: '#6366f1',
        borderWidth: 2,
        pointRadius: 4,
      }],
    },
    options: {
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { stepSize: 25, font: { family: 'Vazirmatn', size: 10 } },
          pointLabels: { font: { family: 'Vazirmatn', size: 10 } },
          grid: { color: '#e5e7eb' },
        },
      },
      plugins: { legend: { display: false } },
    },
  })
}

function buildEnergyChart() {
  const el = document.getElementById('energy-chart')
  if (!el) return
  const existing = Chart.getChart(el)
  if (existing) existing.destroy()
  new Chart(el, {
    type: 'bar',
    data: {
      labels: ['برق (MWh)', 'گاز طبیعی (هزار m³)', 'سوخت مایع (هزار L)'],
      datasets: [{
        label: 'مصرف',
        data: [1850, 620, 145],
        backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b'],
        borderRadius: 8,
        borderWidth: 0,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#f3f4f6' }, ticks: { font: { family: 'Vazirmatn' } } },
        x: { grid: { display: false }, ticks: { font: { family: 'Vazirmatn' } } },
      },
    },
  })
}

function buildSocialChart() {
  const el = document.getElementById('social-chart')
  if (!el) return
  const existing = Chart.getChart(el)
  if (existing) existing.destroy()
  new Chart(el, {
    type: 'bar',
    data: {
      labels: ['زیر ۳۰ سال', '۳۰ تا ۵۰ سال', 'بالای ۵۰ سال'],
      datasets: [{
        label: 'توزیع سنی (%)',
        data: [27, 52, 21],
        backgroundColor: ['#06b6d4', '#6366f1', '#8b5cf6'],
        borderRadius: 8,
        borderWidth: 0,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { max: 60, grid: { color: '#f3f4f6' }, ticks: { font: { family: 'Vazirmatn' } } },
        x: { grid: { display: false }, ticks: { font: { family: 'Vazirmatn' } } },
      },
    },
  })
}

// ── Tab watcher: rebuild charts on tab switch ─────────────────────────────────
async function switchTab(tab) {
  activeTab.value = tab
  await nextTick()
  await nextTick()
  renderChartsForTab(tab)
}

function renderChartsForTab(tab) {
  if (tab === 'overview') {
    buildDoughnut('gov-doughnut', gov.value?.summary?.avg_score ?? 0, '#6366f1')
    buildDoughnut('soc-doughnut', soc.value?.summary?.avg_score ?? 0, '#06b6d4')
    buildDoughnut('env-doughnut', env.value?.summary?.avg_score ?? 0, '#10b981')
  } else if (tab === 'governance') {
    buildRadarChart()
    const domains = gov.value?.domains ?? []
    buildBarChart('gov-bar', domains.map(d => d.title.substring(0, 14)), domains.map(d => d.avg_score), '#6366f1')
  } else if (tab === 'social') {
    buildSocialChart()
    const socDomains = soc.value?.domains ?? []
    buildBarChart('soc-bar', socDomains.map(d => d.title.substring(0, 14)), socDomains.map(d => d.avg_score), '#06b6d4')
  } else if (tab === 'environmental') {
    buildGHGChart()
    buildEnergyChart()
    const envDomains = env.value?.domains ?? []
    buildBarChart('env-bar', envDomains.map(d => d.title.substring(0, 14)), envDomains.map(d => d.avg_score), '#10b981')
  }
}

onMounted(async () => {
  await nextTick()
  renderChartsForTab('overview')
})

// ── PDF Export ────────────────────────────────────────────────────────────────
async function exportPDF() {
  isExporting.value = true
  try {
    const html2pdf = (await import('html2pdf.js')).default
    const el = document.getElementById('esg-report-root')
    const opt = {
      margin: [10, 10],
      filename: `گزارش-ESG-${data.value?.reporting_period ?? '2024'}.pdf`,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }
    await html2pdf().set(opt).from(el).save()
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div
      id="esg-report-root"
      dir="rtl"
      class="esg-report-wrap"
      style="font-family: 'Vazirmatn', 'Tahoma', sans-serif; background: #f8fafc; min-height: 100vh; color: #1e293b;"
  >
    <!-- ═══ HEADER ═══════════════════════════════════════════════════════════ -->
    <div
        class="esg-header"
        style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e3a5f 100%); padding: 36px 40px 28px; position: relative; overflow: hidden;"
    >
      <!-- decorative circles -->
      <div style="position:absolute; top:-60px; left:-60px; width:220px; height:220px; border-radius:50%; background:rgba(255,255,255,0.04);" />
      <div style="position:absolute; bottom:-40px; right:10%; width:160px; height:160px; border-radius:50%; background:rgba(255,255,255,0.03);" />

      <div style="display:flex; align-items:center; justify-content:space-between; position:relative; z-index:1;">
        <div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
            <div style="width:44px; height:44px; border-radius:10px; background:linear-gradient(135deg,#818cf8,#06b6d4); display:flex; align-items:center; justify-content:center;">
              <span style="color:#fff; font-weight:800; font-size:18px;">ESG</span>
            </div>
            <div>
              <div style="color:#a5b4fc; font-size:12px; letter-spacing:2px; text-transform:uppercase; margin-bottom:2px;">گزارش پایداری سازمانی</div>
              <h1 style="color:#fff; font-size:26px; font-weight:800; margin:0;">گزارش جامع ESG</h1>
            </div>
          </div>
          <div style="display:flex; gap:20px; margin-top:16px;">
            <div style="background:rgba(255,255,255,0.1); border-radius:8px; padding:8px 16px;">
              <span style="color:#a5b4fc; font-size:11px;">دوره گزارش</span>
              <div style="color:#fff; font-weight:700; font-size:14px;">{{ data?.reporting_period ?? '—' }}</div>
            </div>
            <div style="background:rgba(255,255,255,0.1); border-radius:8px; padding:8px 16px;">
              <span style="color:#a5b4fc; font-size:11px;">آخرین به‌روزرسانی</span>
              <div style="color:#fff; font-weight:700; font-size:14px;">{{ data?.last_updated ?? '—' }}</div>
            </div>
            <div style="background:rgba(255,255,255,0.1); border-radius:8px; padding:8px 16px;">
              <span style="color:#a5b4fc; font-size:11px;">تعداد KPI</span>
              <div style="color:#fff; font-weight:700; font-size:14px;">{{ data?.total_kpis ?? '—' }}</div>
            </div>
          </div>
        </div>

        <!-- overall score ring -->
        <div style="text-align:center;">
          <div style="position:relative; width:110px; height:110px; margin: 0 auto 8px;">
            <svg viewBox="0 0 100 100" style="width:100%; height:100%; transform:rotate(-90deg);">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="10"/>
              <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="url(#scoreGrad)" stroke-width="10" stroke-linecap="round"
                  :stroke-dasharray="`${(parseFloat(overallScore)/100)*251.3} 251.3`"
                  style="transition: stroke-dasharray 1s ease;"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#818cf8"/>
                  <stop offset="100%" stop-color="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
            <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
              <span style="color:#fff; font-size:24px; font-weight:900; line-height:1;">{{ overallScore }}</span>
              <span style="color:#a5b4fc; font-size:11px;">از ۱۰۰</span>
            </div>
          </div>
          <div :style="`background:${scoreLabel.color}30; color:${scoreLabel.color}; border-radius:20px; padding:4px 14px; font-size:13px; font-weight:700; display:inline-block;`">
            {{ scoreLabel.text }}
          </div>
          <div style="color:#94a3b8; font-size:11px; margin-top:6px;">امتیاز کلی ESG</div>
        </div>
      </div>

      <!-- export btn -->
      <div style="margin-top:24px; position:relative; z-index:1;">
        <button
            @click="exportPDF"
            :disabled="isExporting"
            style="background:linear-gradient(135deg,#818cf8,#6366f1); color:#fff; border:none; border-radius:10px; padding:10px 24px; font-family:inherit; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 4px 20px rgba(99,102,241,0.4); transition:all .2s;"
        >
          <span v-if="isExporting">در حال تولید PDF…</span>
          <span v-else>⬇ دریافت PDF گزارش</span>
        </button>
      </div>
    </div>

    <!-- ═══ TABS ══════════════════════════════════════════════════════════════ -->
    <div style="background:#fff; border-bottom:2px solid #e5e7eb; padding:0 40px; display:flex; gap:0; no-print:true;">
      <button
          v-for="tab in [
          { id:'overview',       label:'نمای کلی',         icon:'🏠' },
          { id:'governance',     label:'حاکمیت',           icon:'⚖️' },
          { id:'social',         label:'اجتماعی',          icon:'👥' },
          { id:'environmental',  label:'محیط‌زیست',        icon:'🌱' },
          { id:'kpitable',       label:'جدول KPI‌ها',      icon:'📊' },
        ]"
          :key="tab.id"
          @click="switchTab(tab.id)"
          :style="`
          background:none; border:none; padding:14px 22px; font-family:inherit; font-size:14px; font-weight:${activeTab===tab.id?700:500};
          color:${activeTab===tab.id?'#6366f1':'#64748b'}; border-bottom:3px solid ${activeTab===tab.id?'#6366f1':'transparent'};
          cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:6px; margin-bottom:-2px;
        `"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- ═══ CONTENT ══════════════════════════════════════════════════════════ -->
    <div style="padding: 32px 40px; max-width:1200px; margin:0 auto;">

      <!-- ──────────────────── OVERVIEW ──────────────────── -->
      <div v-if="activeTab === 'overview'">

        <!-- 3 pillar cards -->
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:28px;">
          <div
              v-for="pillar in [
              { key:'governance',    label:'حاکمیت',        color:'#6366f1', icon:'⚖️', data: gov },
              { key:'social',        label:'اجتماعی',       color:'#06b6d4', icon:'👥', data: soc },
              { key:'environmental', label:'محیط‌زیست',     color:'#10b981', icon:'🌱', data: env },
            ]"
              :key="pillar.key"
              style="background:#fff; border-radius:16px; padding:24px; box-shadow:0 1px 10px rgba(0,0,0,0.07); position:relative; overflow:hidden;"
          >
            <div :style="`position:absolute; top:0; right:0; width:4px; height:100%; background:${pillar.color};`" />
            <div style="display:flex; align-items:flex-start; justify-content:space-between;">
              <div>
                <div style="font-size:24px; margin-bottom:6px;">{{ pillar.icon }}</div>
                <div style="color:#64748b; font-size:13px; margin-bottom:4px;">{{ pillar.label }}</div>
                <div :style="`font-size:32px; font-weight:900; color:${pillar.color};`">
                  {{ pillar.data?.summary?.avg_score ?? '—' }}
                  <span style="font-size:16px; font-weight:500; color:#94a3b8;">/ ۱۰۰</span>
                </div>
                <div style="margin-top:8px; font-size:12px; color:#94a3b8;">
                  تکمیل: <strong style="color:#1e293b;">{{ pillar.data?.summary?.completion ?? '—' }}٪</strong>
                  &nbsp;|&nbsp;
                  KPI: <strong style="color:#1e293b;">{{ pillar.data?.summary?.total_kpis ?? '—' }}</strong>
                </div>
              </div>
              <div style="position:relative; width:80px; height:80px;">
                <canvas :id="`${pillar.key === 'governance' ? 'gov' : pillar.key === 'social' ? 'soc' : 'env'}-doughnut`" width="80" height="80" />
                <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
                  <span :style="`font-weight:800; font-size:14px; color:${pillar.color};`">
                    {{ pillar.data?.summary?.avg_score ?? 0 }}٪
                  </span>
                </div>
              </div>
            </div>

            <!-- mini domain scores -->
            <div style="margin-top:16px; display:flex; flex-direction:column; gap:6px;">
              <div
                  v-for="d in (pillar.data?.domains ?? []).slice(0,4)"
                  :key="d.code"
                  style="display:flex; align-items:center; gap:8px;"
              >
                <div style="font-size:11px; color:#64748b; width:100px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ d.title }}</div>
                <div style="flex:1; height:6px; background:#f1f5f9; border-radius:3px;">
                  <div :style="`height:6px; border-radius:3px; background:${pillar.color}; width:${d.avg_score}%; transition:width .8s;`" />
                </div>
                <div style="font-size:11px; font-weight:700; width:30px; text-align:left;">{{ d.avg_score }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary stats row -->
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px;">
          <div
              v-for="stat in [
              { label:'کارکنان', value:'۲۸۴ نفر', icon:'👨‍💼', color:'#6366f1' },
              { label:'انتشار کربن', value:'۱۱٬۷۰۰ tCO₂e', icon:'🏭', color:'#10b981' },
              { label:'مصرف برق', value:'۱٬۸۵۰ MWh', icon:'⚡', color:'#f59e0b' },
              { label:'سرمایه‌گذاری اجتماعی', value:'۱٫۲۵ میلیارد ریال', icon:'💚', color:'#06b6d4' },
            ]"
              :key="stat.label"
              style="background:#fff; border-radius:12px; padding:18px; box-shadow:0 1px 8px rgba(0,0,0,0.06); display:flex; align-items:center; gap:14px;"
          >
            <div :style="`width:44px; height:44px; border-radius:10px; background:${stat.color}15; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0;`">
              {{ stat.icon }}
            </div>
            <div>
              <div style="color:#94a3b8; font-size:11px;">{{ stat.label }}</div>
              <div style="font-weight:800; font-size:16px; color:#1e293b;">{{ stat.value }}</div>
            </div>
          </div>
        </div>

        <!-- ESG highlights / key findings -->
        <div style="background:#fff; border-radius:16px; padding:24px; box-shadow:0 1px 10px rgba(0,0,0,0.07);">
          <h3 style="margin:0 0 18px; font-size:16px; font-weight:800; color:#1e293b; display:flex; align-items:center; gap:8px;">
            <span style="background:#6366f115; border-radius:8px; padding:4px 10px; color:#6366f1;">✦</span>
            نکات کلیدی گزارش
          </h3>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div
                v-for="item in [
                { text:'نرخ تکمیل آموزش اخلاق سازمانی', value:'۹۲٪', type:'positive' },
                { text:'انتشار کربن Scope 1 + 2', value:'۳٬۷۰۰ tCO₂e', type:'neutral' },
                { text:'اعضای زن هیئت‌مدیره', value:'۳۳٪', type:'neutral' },
                { text:'کاهش مصرف انرژی نسبت به سال قبل', value:'۷.۴٪', type:'positive' },
                { text:'مجموع KPI‌های پاسخ‌داده‌شده', value:'۱۹۱ از ۱۹۲', type:'positive' },
                { text:'تأمین‌کنندگان با ارزیابی ESG', value:'۷۸٪', type:'neutral' },
              ]"
                :key="item.text"
                :style="`background:${item.type==='positive'?'#f0fdf4':'#f8fafc'}; border-right:3px solid ${item.type==='positive'?'#10b981':'#94a3b8'}; border-radius:8px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;`"
            >
              <span style="font-size:13px; color:#475569;">{{ item.text }}</span>
              <span :style="`font-weight:800; font-size:14px; color:${item.type==='positive'?'#10b981':'#3b82f6'};`">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ──────────────────── GOVERNANCE ──────────────────── -->
      <div v-if="activeTab === 'governance'">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
          <div style="background:#fff; border-radius:16px; padding:24px; box-shadow:0 1px 10px rgba(0,0,0,0.07);">
            <h3 style="margin:0 0 16px; font-size:15px; font-weight:800; color:#1e293b;">نمای راداری دامنه‌های حاکمیتی</h3>
            <canvas id="radar-chart" height="260" />
          </div>
          <div style="background:#fff; border-radius:16px; padding:24px; box-shadow:0 1px 10px rgba(0,0,0,0.07);">
            <h3 style="margin:0 0 16px; font-size:15px; font-weight:800; color:#1e293b;">امتیاز دامنه‌های حاکمیتی</h3>
            <canvas id="gov-bar" height="260" />
          </div>
        </div>

        <!-- Domain detail cards -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div
              v-for="domain in (gov?.domains ?? [])"
              :key="domain.code"
              style="background:#fff; border-radius:14px; padding:20px; box-shadow:0 1px 8px rgba(0,0,0,0.06);"
          >
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
              <div>
                <div style="font-size:11px; color:#6366f1; font-weight:700; margin-bottom:4px;">{{ domain.code }}</div>
                <h4 style="margin:0; font-size:14px; font-weight:800; color:#1e293b;">{{ domain.title }}</h4>
              </div>
              <div :style="`background:${scoreColor(domain.avg_score)}15; color:${scoreColor(domain.avg_score)}; border-radius:8px; padding:4px 12px; font-weight:800; font-size:16px;`">
                {{ domain.avg_score }}
              </div>
            </div>
            <div style="height:6px; background:#f1f5f9; border-radius:3px; margin-bottom:16px;">
              <div :style="`height:6px; border-radius:3px; background:${scoreColor(domain.avg_score)}; width:${domain.avg_score}%; transition:width .8s;`" />
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <tr v-for="kpi in domain.kpis" :key="kpi.code" style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:6px 4px; color:#64748b; max-width:180px;">{{ kpi.title }}</td>
                <td style="padding:6px 4px; text-align:left; font-weight:700; color:#1e293b; white-space:nowrap;">
                  {{ fmtVal(kpi.value, kpi.unit) }}
                </td>
                <td style="padding:6px 4px; text-align:center;">
                  <span :style="`display:inline-block; width:8px; height:8px; border-radius:50%; background:${kpi.status==='answered'?'#10b981':'#f59e0b'};`" />
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- ──────────────────── SOCIAL ──────────────────── -->
      <div v-if="activeTab === 'social'">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
          <div style="background:#fff; border-radius:16px; padding:24px; box-shadow:0 1px 10px rgba(0,0,0,0.07);">
            <h3 style="margin:0 0 16px; font-size:15px; font-weight:800; color:#1e293b;">توزیع سنی کارکنان</h3>
            <canvas id="social-chart" height="220" />
          </div>
          <div style="background:#fff; border-radius:16px; padding:24px; box-shadow:0 1px 10px rgba(0,0,0,0.07);">
            <h3 style="margin:0 0 16px; font-size:15px; font-weight:800; color:#1e293b;">امتیاز دامنه‌های اجتماعی</h3>
            <canvas id="soc-bar" height="220" />
          </div>
        </div>

        <!-- Gender + workforce highlight row -->
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px;">
          <div
              v-for="stat in [
              { label:'کل کارکنان', value:'۲۸۴', unit:'نفر', color:'#06b6d4', icon:'👥' },
              { label:'کارکنان زن', value:'۳۸', unit:'٪', color:'#ec4899', icon:'👩' },
              { label:'مدیران زن', value:'۳۱', unit:'٪', color:'#8b5cf6', icon:'👩‍💼' },
              { label:'ساعات آموزش/نفر', value:'۳۸.۵', unit:'ساعت', color:'#f59e0b', icon:'📚' },
            ]"
              :key="stat.label"
              style="background:#fff; border-radius:12px; padding:16px; box-shadow:0 1px 8px rgba(0,0,0,0.06); text-align:center;"
          >
            <div style="font-size:28px; margin-bottom:6px;">{{ stat.icon }}</div>
            <div :style="`font-size:26px; font-weight:900; color:${stat.color};`">{{ stat.value }}<span style="font-size:14px; color:#94a3b8; font-weight:500;"> {{ stat.unit }}</span></div>
            <div style="font-size:12px; color:#64748b; margin-top:4px;">{{ stat.label }}</div>
          </div>
        </div>

        <!-- Social domain tables -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div
              v-for="domain in (soc?.domains ?? [])"
              :key="domain.code"
              style="background:#fff; border-radius:14px; padding:20px; box-shadow:0 1px 8px rgba(0,0,0,0.06);"
          >
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
              <div>
                <div style="font-size:11px; color:#06b6d4; font-weight:700; margin-bottom:4px;">{{ domain.code }}</div>
                <h4 style="margin:0; font-size:14px; font-weight:800; color:#1e293b;">{{ domain.title }}</h4>
              </div>
              <div :style="`background:${scoreColor(domain.avg_score)}15; color:${scoreColor(domain.avg_score)}; border-radius:8px; padding:4px 12px; font-weight:800; font-size:16px;`">
                {{ domain.avg_score }}
              </div>
            </div>
            <div style="height:6px; background:#f1f5f9; border-radius:3px; margin-bottom:16px;">
              <div :style="`height:6px; border-radius:3px; background:#06b6d4; width:${domain.avg_score}%; transition:width .8s;`" />
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <tr v-for="kpi in domain.kpis" :key="kpi.code" style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:6px 4px; color:#64748b;">{{ kpi.title }}</td>
                <td style="padding:6px 4px; text-align:left; font-weight:700; color:#1e293b; white-space:nowrap;">{{ fmtVal(kpi.value, kpi.unit) }}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- ──────────────────── ENVIRONMENTAL ──────────────────── -->
      <div v-if="activeTab === 'environmental'">
        <!-- GHG highlight -->
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:24px;">
          <div
              v-for="scope in [
              { label:'Scope 1 (مستقیم)', value:'۱٬۲۰۰', unit:'tCO₂e', color:'#059669', pct: Math.round(1200/11700*100) },
              { label:'Scope 2 (غیرمستقیم)', value:'۲٬۵۰۰', unit:'tCO₂e', color:'#10b981', pct: Math.round(2500/11700*100) },
              { label:'Scope 3 (زنجیره ارزش)', value:'۸٬۰۰۰', unit:'tCO₂e', color:'#6ee7b7', pct: Math.round(8000/11700*100) },
            ]"
              :key="scope.label"
              :style="`background:#fff; border-radius:14px; padding:20px; box-shadow:0 1px 8px rgba(0,0,0,0.06); border-top:4px solid ${scope.color};`"
          >
            <div style="font-size:12px; color:#64748b; margin-bottom:8px;">{{ scope.label }}</div>
            <div :style="`font-size:28px; font-weight:900; color:${scope.color};`">{{ scope.value }} <span style="font-size:14px; color:#94a3b8; font-weight:500;">{{ scope.unit }}</span></div>
            <div style="margin-top:10px; height:6px; background:#f1f5f9; border-radius:3px;">
              <div :style="`height:6px; border-radius:3px; background:${scope.color}; width:${scope.pct}%;`" />
            </div>
            <div style="font-size:11px; color:#94a3b8; margin-top:4px;">{{ scope.pct }}٪ از کل انتشار</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
          <div style="background:#fff; border-radius:16px; padding:24px; box-shadow:0 1px 10px rgba(0,0,0,0.07);">
            <h3 style="margin:0 0 16px; font-size:15px; font-weight:800; color:#1e293b;">توزیع انتشار گلخانه‌ای</h3>
            <canvas id="ghg-chart" height="240" />
          </div>
          <div style="background:#fff; border-radius:16px; padding:24px; box-shadow:0 1px 10px rgba(0,0,0,0.07);">
            <h3 style="margin:0 0 16px; font-size:15px; font-weight:800; color:#1e293b;">مصرف انرژی</h3>
            <canvas id="energy-chart" height="240" />
          </div>
        </div>

        <div style="background:#fff; border-radius:16px; padding:24px; box-shadow:0 1px 10px rgba(0,0,0,0.07); margin-bottom:24px;">
          <h3 style="margin:0 0 16px; font-size:15px; font-weight:800; color:#1e293b;">امتیاز دامنه‌های محیط‌زیستی</h3>
          <canvas id="env-bar" height="200" />
        </div>

        <!-- Environmental domain tables -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div
              v-for="domain in (env?.domains ?? [])"
              :key="domain.code"
              style="background:#fff; border-radius:14px; padding:20px; box-shadow:0 1px 8px rgba(0,0,0,0.06);"
          >
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
              <div>
                <div style="font-size:11px; color:#10b981; font-weight:700; margin-bottom:4px;">{{ domain.code }}</div>
                <h4 style="margin:0; font-size:14px; font-weight:800; color:#1e293b;">{{ domain.title }}</h4>
              </div>
              <div :style="`background:${scoreColor(domain.avg_score)}15; color:${scoreColor(domain.avg_score)}; border-radius:8px; padding:4px 12px; font-weight:800; font-size:16px;`">
                {{ domain.avg_score }}
              </div>
            </div>
            <div style="height:6px; background:#f1f5f9; border-radius:3px; margin-bottom:16px;">
              <div :style="`height:6px; border-radius:3px; background:#10b981; width:${domain.avg_score}%; transition:width .8s;`" />
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <tr v-for="kpi in domain.kpis" :key="kpi.code" style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:6px 4px; color:#64748b;">{{ kpi.title }}</td>
                <td style="padding:6px 4px; text-align:left; font-weight:700; color:#1e293b; white-space:nowrap;">{{ fmtVal(kpi.value, kpi.unit) }}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- ──────────────────── KPI TABLE ──────────────────── -->
      <div v-if="activeTab === 'kpitable'">
        <div style="background:#fff; border-radius:16px; box-shadow:0 1px 10px rgba(0,0,0,0.07); overflow:hidden;">
          <div style="padding:20px 24px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; justify-content:space-between;">
            <h3 style="margin:0; font-size:16px; font-weight:800; color:#1e293b;">جدول کامل KPI‌های ESG</h3>
            <div style="font-size:13px; color:#64748b; background:#f8fafc; border-radius:8px; padding:6px 14px;">
              مجموع: {{ data?.total_kpis ?? 0 }} شاخص
            </div>
          </div>

          <!-- GOV table -->
          <div style="padding:0;">
            <div style="background:#6366f108; padding:10px 24px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; gap:10px;">
              <span style="font-size:18px;">⚖️</span>
              <span style="font-weight:800; color:#6366f1; font-size:14px;">حاکمیت</span>
              <span style="color:#94a3b8; font-size:12px;">— {{ gov?.summary?.total_kpis }} شاخص — امتیاز: {{ gov?.summary?.avg_score }}</span>
            </div>
            <template v-for="domain in (gov?.domains ?? [])" :key="domain.code">
              <div style="background:#f8fafc; padding:8px 24px; border-bottom:1px solid #f1f5f9;">
                <span style="font-size:12px; font-weight:700; color:#6366f1;">{{ domain.code }}</span>
                <span style="font-size:12px; color:#475569; margin-right:8px;">{{ domain.title }}</span>
              </div>
              <table style="width:100%; border-collapse:collapse;">
                <tr v-for="kpi in domain.kpis" :key="kpi.code" style="border-bottom:1px solid #f8fafc;">
                  <td style="padding:8px 24px; font-size:12px; color:#64748b; width:60px;">{{ kpi.code }}</td>
                  <td style="padding:8px 12px; font-size:12px; color:#334155;">{{ kpi.title }}</td>
                  <td style="padding:8px 12px; font-size:12px; font-weight:700; color:#1e293b; text-align:left; white-space:nowrap; width:120px;">{{ fmtVal(kpi.value, kpi.unit) }}</td>
                  <td style="padding:8px 12px; width:80px; text-align:center;">
                    <span :style="`font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; background:${kpi.status==='answered'?'#dcfce7':'#fef3c7'}; color:${kpi.status==='answered'?'#166534':'#92400e'};`">
                      {{ kpi.status === 'answered' ? 'پاسخ‌داده' : 'بی‌پاسخ' }}
                    </span>
                  </td>
                </tr>
              </table>
            </template>

            <!-- SOC table -->
            <div style="background:#06b6d408; padding:10px 24px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; gap:10px;">
              <span style="font-size:18px;">👥</span>
              <span style="font-weight:800; color:#06b6d4; font-size:14px;">اجتماعی</span>
              <span style="color:#94a3b8; font-size:12px;">— {{ soc?.summary?.total_kpis }} شاخص — امتیاز: {{ soc?.summary?.avg_score }}</span>
            </div>
            <template v-for="domain in (soc?.domains ?? [])" :key="domain.code">
              <div style="background:#f8fafc; padding:8px 24px; border-bottom:1px solid #f1f5f9;">
                <span style="font-size:12px; font-weight:700; color:#06b6d4;">{{ domain.code }}</span>
                <span style="font-size:12px; color:#475569; margin-right:8px;">{{ domain.title }}</span>
              </div>
              <table style="width:100%; border-collapse:collapse;">
                <tr v-for="kpi in domain.kpis" :key="kpi.code" style="border-bottom:1px solid #f8fafc;">
                  <td style="padding:8px 24px; font-size:12px; color:#64748b; width:60px;">{{ kpi.code }}</td>
                  <td style="padding:8px 12px; font-size:12px; color:#334155;">{{ kpi.title }}</td>
                  <td style="padding:8px 12px; font-size:12px; font-weight:700; color:#1e293b; text-align:left; white-space:nowrap; width:120px;">{{ fmtVal(kpi.value, kpi.unit) }}</td>
                  <td style="padding:8px 12px; width:80px; text-align:center;">
                    <span :style="`font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; background:${kpi.status==='answered'?'#dcfce7':'#fef3c7'}; color:${kpi.status==='answered'?'#166534':'#92400e'};`">
                      {{ kpi.status === 'answered' ? 'پاسخ‌داده' : 'بی‌پاسخ' }}
                    </span>
                  </td>
                </tr>
              </table>
            </template>

            <!-- ENV table -->
            <div style="background:#10b98108; padding:10px 24px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; gap:10px;">
              <span style="font-size:18px;">🌱</span>
              <span style="font-weight:800; color:#10b981; font-size:14px;">محیط‌زیست</span>
              <span style="color:#94a3b8; font-size:12px;">— {{ env?.summary?.total_kpis }} شاخص — امتیاز: {{ env?.summary?.avg_score }}</span>
            </div>
            <template v-for="domain in (env?.domains ?? [])" :key="domain.code">
              <div style="background:#f8fafc; padding:8px 24px; border-bottom:1px solid #f1f5f9;">
                <span style="font-size:12px; font-weight:700; color:#10b981;">{{ domain.code }}</span>
                <span style="font-size:12px; color:#475569; margin-right:8px;">{{ domain.title }}</span>
              </div>
              <table style="width:100%; border-collapse:collapse;">
                <tr v-for="kpi in domain.kpis" :key="kpi.code" style="border-bottom:1px solid #f8fafc;">
                  <td style="padding:8px 24px; font-size:12px; color:#64748b; width:60px;">{{ kpi.code }}</td>
                  <td style="padding:8px 12px; font-size:12px; color:#334155;">{{ kpi.title }}</td>
                  <td style="padding:8px 12px; font-size:12px; font-weight:700; color:#1e293b; text-align:left; white-space:nowrap; width:120px;">{{ fmtVal(kpi.value, kpi.unit) }}</td>
                  <td style="padding:8px 12px; width:80px; text-align:center;">
                    <span :style="`font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; background:${kpi.status==='answered'?'#dcfce7':'#fef3c7'}; color:${kpi.status==='answered'?'#166534':'#92400e'};`">
                      {{ kpi.status === 'answered' ? 'پاسخ‌داده' : 'بی‌پاسخ' }}
                    </span>
                  </td>
                </tr>
              </table>
            </template>
          </div>
        </div>
      </div>

    </div>

    <!-- ═══ FOOTER ═══════════════════════════════════════════════════════════ -->
    <div style="background:#1e1b4b; color:#94a3b8; text-align:center; padding:20px 40px; font-size:12px; margin-top:40px;">
      <div style="display:flex; align-items:center; justify-content:space-between; max-width:1200px; margin:0 auto;">
        <span>گزارش ESG — {{ data?.reporting_period ?? '۱۴۰۳' }} — محرمانه</span>
        <span style="color:#6366f1; font-weight:700;">ESG Management System</span>
        <span>آخرین به‌روزرسانی: {{ data?.last_updated ?? '—' }}</span>
      </div>
    </div>

  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;800;900&display=swap');

.esg-report-wrap * {
  box-sizing: border-box;
}

@media print {
  .esg-report-wrap button { display: none !important; }
  .esg-report-wrap [style*="no-print:true"] { display: none !important; }
}
</style>