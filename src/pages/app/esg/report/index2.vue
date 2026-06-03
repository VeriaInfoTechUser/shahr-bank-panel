<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

// ── Props ─────────────────────────────────────────────────────────────────────
// dashboardData = props.reportData.data (i.e. the inner "data" object from the API)
const props = defineProps({
  dashboardData: { type: Object, default: null },
})

// ── Reactive state ────────────────────────────────────────────────────────────
const isExporting = ref(false)
const chartsReady  = ref(false)

// ── Data helpers ──────────────────────────────────────────────────────────────
const gov = computed(() => props.dashboardData?.governance ?? null)
const soc = computed(() => props.dashboardData?.social     ?? null)
const env = computed(() => props.dashboardData?.environmental ?? null)

const overallScore = computed(() => {
  const scores = [
    gov.value?.summary?.avg_score,
    soc.value?.summary?.avg_score,
    env.value?.summary?.avg_score,
  ].filter(v => v != null)
  if (!scores.length) return 0
  return +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
})

const scoreLabel = computed(() => {
  const s = overallScore.value
  if (s >= 85) return { text: 'عالی',         color: '#059669' }
  if (s >= 70) return { text: 'خوب',          color: '#2563eb' }
  if (s >= 55) return { text: 'متوسط',        color: '#d97706' }
  return             { text: 'نیاز به بهبود', color: '#dc2626' }
})

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtVal(value, unit) {
  if (value === null || value === undefined) return '—'
  const v = parseFloat(value)
  const map = {
    percent:           `${v}٪`,
    tco2e:             `${v.toLocaleString()} tCO₂e`,
    kWh:               `${v.toLocaleString()} kWh`,
    kwh_per_employee:  `${v.toLocaleString()} kWh/نفر`,
    m3:                `${v.toLocaleString()} m³`,
    liter:             `${v.toLocaleString()} لیتر`,
    ton:               `${v.toLocaleString()} تن`,
    kg:                `${v.toLocaleString()} کیلوگرم`,
    hectare:           `${v.toLocaleString()} هکتار`,
    person:            `${v.toLocaleString()} نفر`,
    employee:          `${v.toLocaleString()} نفر`,
    hour:              `${v.toLocaleString()} ساعت`,
    currency:          `${v.toLocaleString()} ریال`,
    count:              v.toLocaleString(),
    tco2e_per_unit:    `${v} tCO₂e/واحد`,
    ton_per_unit:      `${v} تن/واحد`,
  }
  return map[unit] ?? `${v.toLocaleString()} ${unit}`
}

function barColor(score) {
  if (score >= 85) return '#059669'
  if (score >= 70) return '#2563eb'
  if (score >= 55) return '#d97706'
  return '#dc2626'
}

function scoreTag(score) {
  const color = barColor(score)
  return `background:${color}22; color:${color}; border-radius:6px; padding:2px 10px; font-weight:800; font-size:14px; display:inline-block;`
}

// ── Chart builders ────────────────────────────────────────────────────────────
function destroyChart(id) {
  const el = document.getElementById(id)
  if (el) { const c = Chart.getChart(el); if (c) c.destroy() }
}

function doughnut(id, value, hexColor) {
  destroyChart(id)
  const el = document.getElementById(id)
  if (!el) return
  new Chart(el, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [value, 100 - value],
        backgroundColor: [hexColor, '#e5e7eb'],
        borderWidth: 0,
      }],
    },
    options: {
      cutout: '72%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { duration: 700 },
    },
  })
}

function hbar(id, labels, values, hexColor) {
  destroyChart(id)
  const el = document.getElementById(id)
  if (!el) return
  new Chart(el, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: hexColor + 'bb',
        borderColor: hexColor,
        borderWidth: 1,
        borderRadius: 5,
      }],
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { max: 100, grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  })
}

function ghgDonut() {
  destroyChart('ghg-chart')
  const el = document.getElementById('ghg-chart')
  if (!el) return
  new Chart(el, {
    type: 'doughnut',
    data: {
      labels: ['Scope 1', 'Scope 2', 'Scope 3'],
      datasets: [{
        data: [1200, 2500, 8000],
        backgroundColor: ['#059669', '#10b981', '#6ee7b7'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6,
      }],
    },
    options: {
      cutout: '55%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 14, font: { size: 12 } } },
      },
    },
  })
}

function energyBar() {
  destroyChart('energy-chart')
  const el = document.getElementById('energy-chart')
  if (!el) return
  new Chart(el, {
    type: 'bar',
    data: {
      labels: ['برق (MWh)', 'گاز طبیعی\n(هزار m³)', 'سوخت مایع\n(هزار L)'],
      datasets: [{
        data: [1850, 620, 145],
        backgroundColor: ['#3b82f6', '#8b5cf6', '#d97706'],
        borderRadius: 7,
        borderWidth: 0,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  })
}

function radarChart() {
  destroyChart('radar-chart')
  const el = document.getElementById('radar-chart')
  if (!el) return
  const domains = (gov.value?.domains ?? []).slice(0, 8)
  new Chart(el, {
    type: 'radar',
    data: {
      labels: domains.map(d => d.title.length > 10 ? d.title.substring(0, 10) + '…' : d.title),
      datasets: [{
        label: 'حاکمیت',
        data: domains.map(d => d.avg_score),
        backgroundColor: 'rgba(99,102,241,0.15)',
        borderColor: '#6366f1',
        pointBackgroundColor: '#6366f1',
        borderWidth: 2,
        pointRadius: 3,
      }],
    },
    options: {
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { stepSize: 25, font: { size: 9 } },
          pointLabels: { font: { size: 9 } },
          grid: { color: '#e5e7eb' },
        },
      },
      plugins: { legend: { display: false } },
    },
  })
}

// ── Init charts after mount ───────────────────────────────────────────────────
onMounted(async () => {
  await nextTick()
  await nextTick()
  buildAllCharts()
})

function buildAllCharts() {
  // overview doughnuts
  doughnut('gov-doughnut', gov.value?.summary?.avg_score ?? 0, '#6366f1')
  doughnut('soc-doughnut', soc.value?.summary?.avg_score ?? 0, '#06b6d4')
  doughnut('env-doughnut', env.value?.summary?.avg_score ?? 0, '#059669')

  // governance
  radarChart()
  const gDomains = gov.value?.domains ?? []
  hbar('gov-bar',
      gDomains.map(d => d.title.length > 14 ? d.title.substring(0, 14) + '…' : d.title),
      gDomains.map(d => d.avg_score),
      '#6366f1')

  // social
  hbar('soc-bar',
      (soc.value?.domains ?? []).map(d => d.title.length > 14 ? d.title.substring(0, 14) + '…' : d.title),
      (soc.value?.domains ?? []).map(d => d.avg_score),
      '#06b6d4')

  // environmental
  ghgDonut()
  energyBar()
  hbar('env-bar',
      (env.value?.domains ?? []).map(d => d.title.length > 14 ? d.title.substring(0, 14) + '…' : d.title),
      (env.value?.domains ?? []).map(d => d.avg_score),
      '#059669')

  chartsReady.value = true
}

// ── PDF export ─────────────────────────────────────────────────────────────────
async function exportPDF() {
  isExporting.value = true
  try {
    const { default: html2pdf } = await import('html2pdf.js')
    const el = document.getElementById('esg-pdf-root')

    // Temporarily force white backgrounds for oklch-sensitive elements
    const allEls = el.querySelectorAll('*')
    const saved = []
    allEls.forEach(node => {
      const cs = getComputedStyle(node)
      if (cs.backgroundColor.includes('oklch') || cs.color.includes('oklch')) {
        saved.push({ node, bg: node.style.backgroundColor, color: node.style.color })
        node.style.backgroundColor = '#ffffff'
        node.style.color = '#1e293b'
      }
    })

    await html2pdf()
        .set({
          margin: [8, 8],
          filename: `ESG-Report-${props.dashboardData?.reporting_period ?? '2024'}.pdf`,
          image:    { type: 'jpeg', quality: 0.95 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            scrollY: 0,
            backgroundColor: '#ffffff',
            // disable oklch-incompatible parsing
            ignoreElements: el => false,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(el)
        .save()

    // Restore
    saved.forEach(({ node, bg, color }) => {
      node.style.backgroundColor = bg
      node.style.color = color
    })
  } catch (e) {
    console.error('PDF export error:', e)
    alert('خطا در تولید PDF. لطفاً دوباره تلاش کنید.')
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div
      dir="rtl"
      style="font-family:'Tahoma','Vazirmatn',sans-serif; background:#f1f5f9; color:#1e293b;"
  >
    <!-- ── Sticky Action Bar (not in PDF) ────────────────────────────────── -->
    <div
        class="no-pdf"
        style="position:sticky; top:0; z-index:50; background:#1e1b4b; padding:10px 32px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 2px 16px rgba(0,0,0,0.25);"
    >
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:34px; height:34px; background:linear-gradient(135deg,#818cf8,#06b6d4); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:900; color:#fff; font-size:13px;">ESG</div>
        <span style="color:#c7d2fe; font-size:15px; font-weight:700;">گزارش جامع پایداری سازمانی</span>
        <span style="background:#312e81; color:#a5b4fc; border-radius:6px; padding:3px 10px; font-size:12px;">{{ dashboardData?.reporting_period }}</span>
      </div>
      <button
          @click="exportPDF"
          :disabled="isExporting"
          style="background:linear-gradient(135deg,#818cf8,#6366f1); color:#fff; border:none; border-radius:8px; padding:9px 20px; font-family:inherit; font-size:13px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:7px; box-shadow:0 3px 12px rgba(99,102,241,0.5); transition:opacity .2s;"
          :style="isExporting ? 'opacity:.7;cursor:not-allowed;' : ''"
      >
        <span>{{ isExporting ? '⏳ در حال تولید…' : '⬇ دریافت PDF' }}</span>
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════
         PDF ROOT — everything inside here goes to PDF
    ═══════════════════════════════════════════════════════════════════════ -->
    <div id="esg-pdf-root" style="background:#ffffff; max-width:1080px; margin:0 auto;">

      <!-- ════ COVER PAGE ════════════════════════════════════════════════════ -->
      <div
          style="background:#1e1b4b; padding:60px 56px 48px; position:relative; overflow:hidden; page-break-after:always;"
      >
        <!-- decorative rings -->
        <div style="position:absolute;top:-80px;left:-80px;width:300px;height:300px;border-radius:50%;border:40px solid rgba(255,255,255,0.04);" />
        <div style="position:absolute;bottom:-60px;right:8%;width:220px;height:220px;border-radius:50%;border:30px solid rgba(255,255,255,0.03);" />

        <div style="position:relative;z-index:1;">
          <!-- Logo row -->
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:36px;">
            <div style="width:56px;height:56px;border-radius:14px;background:#4f46e5;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;color:#fff;">ESG</div>
            <div>
              <div style="color:#a5b4fc;font-size:12px;letter-spacing:2px;margin-bottom:3px;">ENVIRONMENTAL · SOCIAL · GOVERNANCE</div>
              <div style="color:#fff;font-size:22px;font-weight:800;">گزارش پایداری سازمانی</div>
            </div>
          </div>

          <!-- Title -->
          <h1 style="color:#fff;font-size:38px;font-weight:900;margin:0 0 12px;line-height:1.2;">
            گزارش جامع ESG<br>
            <span style="color:#818cf8;font-size:26px;font-weight:700;">{{ dashboardData?.reporting_period }}</span>
          </h1>
          <p style="color:#94a3b8;font-size:15px;margin:0 0 40px;max-width:500px;line-height:1.8;">
            این گزارش جامع عملکرد سازمان را در سه محور حاکمیت، اجتماعی و محیط‌زیست بررسی کرده و
            شاخص‌های کلیدی پایداری را به صورت شفاف ارائه می‌دهد.
          </p>

          <!-- Overall score + 3 pillars -->
          <div style="display:flex;gap:24px;align-items:center;">
            <!-- big score -->
            <div style="background:rgba(255,255,255,0.08);border-radius:16px;padding:24px 32px;text-align:center;flex-shrink:0;">
              <div style="color:#a5b4fc;font-size:12px;margin-bottom:8px;">امتیاز کلی ESG</div>
              <div style="color:#fff;font-size:52px;font-weight:900;line-height:1;">{{ overallScore }}</div>
              <div style="color:#818cf8;font-size:14px;">از ۱۰۰</div>
              <div
                  :style="`margin-top:8px;background:${scoreLabel.color}33;color:${scoreLabel.color};border-radius:20px;padding:4px 16px;font-size:13px;font-weight:700;display:inline-block;`"
              >{{ scoreLabel.text }}</div>
            </div>

            <!-- 3 pillar mini cards -->
            <div style="display:flex;flex-direction:column;gap:12px;flex:1;">
              <div
                  v-for="p in [
                  { label:'حاکمیت',     score:gov?.summary?.avg_score, kpis:gov?.summary?.total_kpis,     color:'#818cf8', icon:'⚖️' },
                  { label:'اجتماعی',    score:soc?.summary?.avg_score, kpis:soc?.summary?.total_kpis,     color:'#06b6d4', icon:'👥' },
                  { label:'محیط‌زیست', score:env?.summary?.avg_score, kpis:env?.summary?.total_kpis,     color:'#10b981', icon:'🌱' },
                ]"
                  :key="p.label"
                  style="background:rgba(255,255,255,0.07);border-radius:12px;padding:12px 20px;display:flex;align-items:center;gap:14px;"
              >
                <span style="font-size:22px;">{{ p.icon }}</span>
                <span style="color:#e2e8f0;font-weight:700;font-size:14px;flex:1;">{{ p.label }}</span>
                <span style="color:#94a3b8;font-size:12px;">{{ p.kpis }} شاخص</span>
                <div style="width:80px;height:8px;background:rgba(255,255,255,0.12);border-radius:4px;">
                  <div :style="`height:8px;border-radius:4px;background:${p.color};width:${p.score}%;`" />
                </div>
                <span :style="`color:${p.color};font-weight:900;font-size:18px;min-width:36px;text-align:left;`">{{ p.score }}</span>
              </div>
            </div>
          </div>

          <!-- meta -->
          <div style="display:flex;gap:16px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;">
            <div v-for="m in [
              { label:'دوره گزارش', val: dashboardData?.reporting_period },
              { label:'آخرین به‌روزرسانی', val: dashboardData?.last_updated },
              { label:'مجموع شاخص‌های ارزیابی‌شده', val: `${dashboardData?.total_kpis} KPI` },
            ]" :key="m.label" style="flex:1;">
              <div style="color:#64748b;font-size:11px;margin-bottom:3px;">{{ m.label }}</div>
              <div style="color:#e2e8f0;font-weight:700;font-size:13px;">{{ m.val }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ════ EXECUTIVE SUMMARY ════════════════════════════════════════════ -->
      <div style="padding:48px 56px 36px; background:#ffffff;">
        <div style="border-right:5px solid #6366f1;padding-right:18px;margin-bottom:24px;">
          <div style="color:#6366f1;font-size:12px;font-weight:700;letter-spacing:1px;margin-bottom:4px;">EXECUTIVE SUMMARY</div>
          <h2 style="margin:0;font-size:22px;font-weight:900;color:#0f172a;">خلاصه اجرایی</h2>
        </div>

        <p style="color:#475569;font-size:14px;line-height:2;margin:0 0 16px;">
          سازمان در دوره گزارش‌دهی {{ dashboardData?.reporting_period }}، مجموعاً
          <strong style="color:#1e293b;">{{ dashboardData?.total_kpis }} شاخص کلیدی عملکردی (KPI)</strong>
          را در سه حوزه اصلی پایداری ارزیابی نموده است. امتیاز کلی ESG سازمان معادل
          <strong style="color:#6366f1;">{{ overallScore }} از ۱۰۰</strong> بوده که نشان‌دهنده سطح
          «{{ scoreLabel.text }}» در مقیاس ارزیابی ESG است.
        </p>
        <p style="color:#475569;font-size:14px;line-height:2;margin:0 0 16px;">
          در بُعد <strong style="color:#6366f1;">حاکمیت</strong>، سازمان با کسب امتیاز
          <strong>{{ gov?.summary?.avg_score }}</strong> در {{ gov?.summary?.total_kpis }} شاخص،
          عملکرد قابل توجهی در حوزه‌های اخلاق سازمانی، انطباق قانونی، امنیت سایبری و
          حاکمیت داده به ثبت رسانده است. نرخ تکمیل پاسخ‌دهی به شاخص‌های حاکمیتی
          <strong>{{ gov?.summary?.completion }}٪</strong> بوده است.
        </p>
        <p style="color:#475569;font-size:14px;line-height:2;margin:0 0 16px;">
          در بُعد <strong style="color:#06b6d4;">اجتماعی</strong>، با نرخ تکمیل
          <strong>{{ soc?.summary?.completion }}٪</strong> و امتیاز
          <strong>{{ soc?.summary?.avg_score }}</strong>، وضعیت نیروی انسانی، آموزش کارکنان،
          سلامت و ایمنی و مسئولیت اجتماعی سازمان مورد سنجش قرار گرفته است.
          سازمان در این دوره <strong>284 نفر کارمند</strong> داشته که 38٪ آن‌ها زن هستند.
        </p>
        <p style="color:#475569;font-size:14px;line-height:2;margin:0;">
          در بُعد <strong style="color:#059669;">محیط‌زیست</strong>، مجموع انتشار گازهای
          گلخانه‌ای سازمان <strong>11٬700 tCO₂e</strong> بوده و مصرف برق به
          <strong>1٬850٬000 kWh</strong> رسیده است. سازمان در این دوره
          <strong>18٪ انرژی تجدیدپذیر</strong> مصرف نموده و موفق به کاهش
          <strong>7.4٪ مصرف انرژی</strong> نسبت به دوره قبل شده است.
        </p>

        <!-- key metrics grid -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:28px;">
          <div
              v-for="m in [
              { icon:'👨‍💼', label:'تعداد کارکنان',       value:'284',    unit:'نفر',    color:'#6366f1' },
              { icon:'🏭', label:'انتشار کربن کل',      value:'11٬700', unit:'tCO₂e', color:'#059669' },
              { icon:'⚡', label:'مصرف برق',            value:'1٬850',  unit:'MWh',   color:'#d97706' },
              { icon:'♻️', label:'انرژی تجدیدپذیر',    value:'18',     unit:'٪',      color:'#06b6d4' },
            ]"
              :key="m.label"
              style="background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e2e8f0;text-align:center;"
          >
            <div style="font-size:26px;margin-bottom:6px;">{{ m.icon }}</div>
            <div :style="`font-size:22px;font-weight:900;color:${m.color};line-height:1;`">
              {{ m.value }}<span style="font-size:12px;font-weight:500;color:#94a3b8;margin-right:2px;"> {{ m.unit }}</span>
            </div>
            <div style="font-size:11px;color:#64748b;margin-top:5px;">{{ m.label }}</div>
          </div>
        </div>
      </div>

      <!-- ════ SECTION 1 — GOVERNANCE ═══════════════════════════════════════ -->
      <div style="padding:40px 56px; background:#f8fafc; page-break-before:always;">
        <!-- section header -->
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:28px;">
          <div style="width:48px;height:48px;border-radius:12px;background:#6366f1;display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;flex-shrink:0;">⚖️</div>
          <div>
            <div style="color:#6366f1;font-size:11px;font-weight:700;letter-spacing:1px;">GOVERNANCE</div>
            <h2 style="margin:0;font-size:20px;font-weight:900;color:#0f172a;">بخش اول: حاکمیت سازمانی</h2>
          </div>
          <div style="margin-right:auto;background:#fff;border-radius:10px;padding:10px 20px;border:1px solid #e2e8f0;text-align:center;">
            <div style="font-size:11px;color:#64748b;margin-bottom:2px;">امتیاز حاکمیت</div>
            <div :style="`font-size:26px;font-weight:900;color:${barColor(gov?.summary?.avg_score ?? 0)};`">{{ gov?.summary?.avg_score }}</div>
          </div>
        </div>

        <p style="color:#475569;font-size:13px;line-height:2;margin:0 0 24px;">
          حوزه حاکمیت سازمانی شامل {{ gov?.summary?.total_kpis }} شاخص در
          {{ gov?.domains?.length }} دامنه مختلف می‌باشد. در این دوره
          {{ gov?.summary?.answered }} شاخص پاسخ‌داده شده و نرخ تکمیل به
          {{ gov?.summary?.completion }}٪ رسیده است. عملکرد سازمان در حوزه‌هایی
          چون اخلاق سازمانی و امنیت سایبری بسیار مطلوب بوده، در حالی که حوزه‌های
          مدیریت ریسک و شفافیت مالی نیاز به توجه بیشتری دارند.
        </p>

        <!-- charts row -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
          <div style="background:#fff;border-radius:14px;padding:20px;border:1px solid #e2e8f0;">
            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:14px;">نمای راداری دامنه‌های حاکمیتی</div>
            <canvas id="radar-chart" height="240" />
          </div>
          <div style="background:#fff;border-radius:14px;padding:20px;border:1px solid #e2e8f0;">
            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:14px;">امتیاز دامنه‌ها</div>
            <canvas id="gov-bar" height="240" />
          </div>
        </div>

        <!-- governance domains table -->
        <div style="background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px 16px;text-align:right;color:#475569;font-weight:700;">دامنه</th>
              <th style="padding:10px 12px;text-align:center;color:#475569;font-weight:700;width:60px;">KPI</th>
              <th style="padding:10px 12px;text-align:center;color:#475569;font-weight:700;width:60px;">پاسخ</th>
              <th style="padding:10px 12px;text-align:center;color:#475569;font-weight:700;width:100px;">امتیاز</th>
              <th style="padding:10px 16px;text-align:right;color:#475569;font-weight:700;">نوار عملکرد</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="(d, i) in (gov?.domains ?? [])"
                :key="d.code"
                :style="`background:${i%2===0?'#fff':'#f8fafc'};border-bottom:1px solid #f1f5f9;`"
            >
              <td style="padding:10px 16px;">
                <div style="font-size:10px;color:#6366f1;font-weight:700;">{{ d.code }}</div>
                <div style="color:#1e293b;font-weight:600;">{{ d.title }}</div>
              </td>
              <td style="padding:10px 12px;text-align:center;color:#64748b;">{{ d.kpi_count }}</td>
              <td style="padding:10px 12px;text-align:center;color:#64748b;">{{ d.answered }}</td>
              <td style="padding:10px 12px;text-align:center;">
                <span :style="scoreTag(d.avg_score)">{{ d.avg_score }}</span>
              </td>
              <td style="padding:10px 16px;">
                <div style="height:8px;background:#f1f5f9;border-radius:4px;">
                  <div :style="`height:8px;border-radius:4px;background:${barColor(d.avg_score)};width:${d.avg_score}%;`" />
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ════ SECTION 2 — SOCIAL ════════════════════════════════════════════ -->
      <div style="padding:40px 56px; background:#ffffff; page-break-before:always;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:28px;">
          <div style="width:48px;height:48px;border-radius:12px;background:#06b6d4;display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;flex-shrink:0;">👥</div>
          <div>
            <div style="color:#06b6d4;font-size:11px;font-weight:700;letter-spacing:1px;">SOCIAL</div>
            <h2 style="margin:0;font-size:20px;font-weight:900;color:#0f172a;">بخش دوم: مسئولیت اجتماعی</h2>
          </div>
          <div style="margin-right:auto;background:#f0fdfa;border-radius:10px;padding:10px 20px;border:1px solid #ccfbf1;text-align:center;">
            <div style="font-size:11px;color:#0f766e;margin-bottom:2px;">امتیاز اجتماعی</div>
            <div :style="`font-size:26px;font-weight:900;color:${barColor(soc?.summary?.avg_score ?? 0)};`">{{ soc?.summary?.avg_score }}</div>
          </div>
        </div>

        <p style="color:#475569;font-size:13px;line-height:2;margin:0 0 24px;">
          حوزه اجتماعی شامل {{ soc?.summary?.total_kpis }} شاخص در {{ soc?.domains?.length }} دامنه است
          که همگی با نرخ تکمیل {{ soc?.summary?.completion }}٪ پاسخ داده شده‌اند.
          این حوزه طیف گسترده‌ای از ابعاد مدیریت نیروی انسانی، آموزش، سلامت و ایمنی،
          برابری جنسیتی و مشارکت اجتماعی را پوشش می‌دهد.
        </p>

        <!-- workforce highlights -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">
          <div
              v-for="s in [
              { icon:'👥', label:'کل کارکنان',    value:'284',  unit:'نفر',   color:'#06b6d4' },
              { icon:'👩', label:'کارکنان زن',     value:'38',   unit:'٪',     color:'#ec4899' },
              { icon:'👩‍💼',label:'مدیران زن',       value:'31',   unit:'٪',     color:'#8b5cf6' },
              { icon:'📚', label:'ساعت آموزش/نفر', value:'38.5', unit:'ساعت', color:'#d97706' },
            ]"
              :key="s.label"
              style="background:#f8fafc;border-radius:12px;padding:14px;border:1px solid #e2e8f0;text-align:center;"
          >
            <div style="font-size:24px;margin-bottom:5px;">{{ s.icon }}</div>
            <div :style="`font-size:20px;font-weight:900;color:${s.color};line-height:1;`">
              {{ s.value }}<span style="font-size:11px;color:#94a3b8;font-weight:500;"> {{ s.unit }}</span>
            </div>
            <div style="font-size:11px;color:#64748b;margin-top:4px;">{{ s.label }}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
          <!-- age bar chart -->
          <div style="background:#f8fafc;border-radius:14px;padding:20px;border:1px solid #e2e8f0;">
            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:14px;">توزیع سنی کارکنان</div>
            <canvas id="soc-bar" height="220" />
          </div>
          <!-- gender / age breakdown table -->
          <div style="background:#f8fafc;border-radius:14px;padding:20px;border:1px solid #e2e8f0;">
            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:14px;">ترکیب نیروی انسانی</div>
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <tr v-for="row in [
                { label:'کارکنان زیر ۳۰ سال',    value:'27٪' },
                { label:'کارکنان ۳۰ تا ۵۰ سال',  value:'52٪' },
                { label:'کارکنان بالای ۵۰ سال',  value:'21٪' },
                { label:'نسبت زنان در کل',         value:'38٪' },
                { label:'نسبت زنان در مدیریت',     value:'31٪' },
                { label:'نسبت اعضای زن هیئت‌مدیره',value:'33٪' },
              ]" :key="row.label" style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:9px 4px;color:#475569;">{{ row.label }}</td>
                <td style="padding:9px 4px;font-weight:700;color:#1e293b;text-align:left;">{{ row.value }}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- social domains table -->
        <div style="background:#f8fafc;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
            <tr style="background:#ecfeff;">
              <th style="padding:10px 16px;text-align:right;color:#0e7490;font-weight:700;">دامنه اجتماعی</th>
              <th style="padding:10px 12px;text-align:center;color:#0e7490;font-weight:700;width:60px;">KPI</th>
              <th style="padding:10px 12px;text-align:center;color:#0e7490;font-weight:700;width:60px;">پاسخ</th>
              <th style="padding:10px 12px;text-align:center;color:#0e7490;font-weight:700;width:100px;">امتیاز</th>
              <th style="padding:10px 16px;text-align:right;color:#0e7490;font-weight:700;">نوار عملکرد</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="(d, i) in (soc?.domains ?? [])"
                :key="d.code"
                :style="`background:${i%2===0?'#fff':'#f0fdfa'};border-bottom:1px solid #e2e8f0;`"
            >
              <td style="padding:10px 16px;">
                <div style="font-size:10px;color:#06b6d4;font-weight:700;">{{ d.code }}</div>
                <div style="color:#1e293b;font-weight:600;">{{ d.title }}</div>
              </td>
              <td style="padding:10px 12px;text-align:center;color:#64748b;">{{ d.kpi_count }}</td>
              <td style="padding:10px 12px;text-align:center;color:#64748b;">{{ d.answered }}</td>
              <td style="padding:10px 12px;text-align:center;">
                <span :style="scoreTag(d.avg_score)">{{ d.avg_score }}</span>
              </td>
              <td style="padding:10px 16px;">
                <div style="height:8px;background:#e2e8f0;border-radius:4px;">
                  <div :style="`height:8px;border-radius:4px;background:#06b6d4;width:${d.avg_score}%;`" />
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ════ SECTION 3 — ENVIRONMENTAL ════════════════════════════════════ -->
      <div style="padding:40px 56px; background:#f0fdf4; page-break-before:always;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:28px;">
          <div style="width:48px;height:48px;border-radius:12px;background:#059669;display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;flex-shrink:0;">🌱</div>
          <div>
            <div style="color:#059669;font-size:11px;font-weight:700;letter-spacing:1px;">ENVIRONMENTAL</div>
            <h2 style="margin:0;font-size:20px;font-weight:900;color:#0f172a;">بخش سوم: عملکرد محیط‌زیستی</h2>
          </div>
          <div style="margin-right:auto;background:#fff;border-radius:10px;padding:10px 20px;border:1px solid #bbf7d0;text-align:center;">
            <div style="font-size:11px;color:#166534;margin-bottom:2px;">امتیاز محیط‌زیست</div>
            <div :style="`font-size:26px;font-weight:900;color:${barColor(env?.summary?.avg_score ?? 0)};`">{{ env?.summary?.avg_score }}</div>
          </div>
        </div>

        <p style="color:#475569;font-size:13px;line-height:2;margin:0 0 24px;">
          حوزه محیط‌زیست با {{ env?.summary?.total_kpis }} شاخص در {{ env?.domains?.length }} دامنه،
          عملکرد سازمان را در ابعاد انرژی، انتشار گازهای گلخانه‌ای، مدیریت آب،
          پسماند، تنوع زیستی و استراتژی اقلیمی ارزیابی می‌کند. در این دوره
          سازمان موفق به کاهش 12٪ انتشار کربن نسبت به سال پایه شده است.
        </p>

        <!-- GHG scope cards -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px;">
          <div
              v-for="sc in [
              { label:'Scope 1 — انتشار مستقیم',      value:'1٬200', unit:'tCO₂e', color:'#059669', pct:10 },
              { label:'Scope 2 — انتشار غیرمستقیم',   value:'2٬500', unit:'tCO₂e', color:'#10b981', pct:21 },
              { label:'Scope 3 — زنجیره ارزش',         value:'8٬000', unit:'tCO₂e', color:'#34d399', pct:68 },
            ]"
              :key="sc.label"
              :style="`background:#fff;border-radius:12px;padding:18px;border-top:4px solid ${sc.color};border:1px solid #e2e8f0;border-top:4px solid ${sc.color};`"
          >
            <div style="font-size:11px;color:#64748b;margin-bottom:6px;">{{ sc.label }}</div>
            <div :style="`font-size:24px;font-weight:900;color:${sc.color};`">{{ sc.value }} <span style="font-size:12px;color:#94a3b8;font-weight:500;">{{ sc.unit }}</span></div>
            <div style="margin-top:8px;height:6px;background:#f1f5f9;border-radius:3px;">
              <div :style="`height:6px;border-radius:3px;background:${sc.color};width:${sc.pct}%;`" />
            </div>
            <div style="font-size:11px;color:#94a3b8;margin-top:3px;">{{ sc.pct }}٪ از کل انتشار</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
          <div style="background:#fff;border-radius:14px;padding:20px;border:1px solid #e2e8f0;">
            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:14px;">توزیع انتشار گلخانه‌ای</div>
            <canvas id="ghg-chart" height="220" />
          </div>
          <div style="background:#fff;border-radius:14px;padding:20px;border:1px solid #e2e8f0;">
            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:14px;">مصرف انرژی به تفکیک</div>
            <canvas id="energy-chart" height="220" />
          </div>
        </div>

        <!-- env bar chart -->
        <div style="background:#fff;border-radius:14px;padding:20px;border:1px solid #e2e8f0;margin-bottom:24px;">
          <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:14px;">امتیاز دامنه‌های محیط‌زیستی</div>
          <canvas id="env-bar" height="200" />
        </div>

        <!-- env domains table -->
        <div style="background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
            <tr style="background:#f0fdf4;">
              <th style="padding:10px 16px;text-align:right;color:#166534;font-weight:700;">دامنه محیط‌زیستی</th>
              <th style="padding:10px 12px;text-align:center;color:#166534;font-weight:700;width:60px;">KPI</th>
              <th style="padding:10px 12px;text-align:center;color:#166534;font-weight:700;width:60px;">پاسخ</th>
              <th style="padding:10px 12px;text-align:center;color:#166534;font-weight:700;width:100px;">امتیاز</th>
              <th style="padding:10px 16px;text-align:right;color:#166534;font-weight:700;">نوار عملکرد</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="(d, i) in (env?.domains ?? [])"
                :key="d.code"
                :style="`background:${i%2===0?'#fff':'#f0fdf4'};border-bottom:1px solid #e2e8f0;`"
            >
              <td style="padding:10px 16px;">
                <div style="font-size:10px;color:#059669;font-weight:700;">{{ d.code }}</div>
                <div style="color:#1e293b;font-weight:600;">{{ d.title }}</div>
              </td>
              <td style="padding:10px 12px;text-align:center;color:#64748b;">{{ d.kpi_count }}</td>
              <td style="padding:10px 12px;text-align:center;color:#64748b;">{{ d.answered }}</td>
              <td style="padding:10px 12px;text-align:center;">
                <span :style="scoreTag(d.avg_score)">{{ d.avg_score }}</span>
              </td>
              <td style="padding:10px 16px;">
                <div style="height:8px;background:#e2e8f0;border-radius:4px;">
                  <div :style="`height:8px;border-radius:4px;background:#059669;width:${d.avg_score}%;`" />
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ════ SECTION 4 — FULL KPI TABLE ════════════════════════════════════ -->
      <div style="padding:40px 56px 56px; background:#ffffff; page-break-before:always;">
        <div style="border-right:5px solid #334155;padding-right:18px;margin-bottom:24px;">
          <div style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:1px;margin-bottom:4px;">APPENDIX</div>
          <h2 style="margin:0;font-size:20px;font-weight:900;color:#0f172a;">جدول کامل شاخص‌های ESG</h2>
        </div>
        <p style="color:#475569;font-size:13px;line-height:1.8;margin:0 0 24px;">
          جدول زیر مجموعه کامل {{ dashboardData?.total_kpis }} شاخص کلیدی عملکردی (KPI) سازمان را در سه حوزه اصلی ESG به تفکیک دامنه نمایش می‌دهد.
        </p>

        <!-- GOV -->
        <div style="margin-bottom:24px;">
          <div style="background:#6366f1;color:#fff;padding:8px 16px;border-radius:8px 8px 0 0;font-weight:800;font-size:13px;display:flex;align-items:center;gap:8px;">
            <span>⚖️</span> حاکمیت (Governance) — {{ gov?.summary?.total_kpis }} شاخص
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:11px;border:1px solid #e2e8f0;border-top:none;">
            <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:8px 12px;text-align:right;color:#475569;font-weight:700;width:110px;">کد</th>
              <th style="padding:8px 12px;text-align:right;color:#475569;font-weight:700;">دامنه</th>
              <th style="padding:8px 12px;text-align:right;color:#475569;font-weight:700;">شاخص</th>
              <th style="padding:8px 12px;text-align:left;color:#475569;font-weight:700;width:120px;">مقدار</th>
              <th style="padding:8px 12px;text-align:center;color:#475569;font-weight:700;width:80px;">وضعیت</th>
            </tr>
            </thead>
            <tbody>
            <template v-for="domain in (gov?.domains ?? [])" :key="domain.code">
              <tr v-for="(kpi, ki) in domain.kpis" :key="kpi.code" :style="`background:${ki%2===0?'#fff':'#f8fafc'};border-bottom:1px solid #f1f5f9;`">
                <td style="padding:7px 12px;color:#6366f1;font-weight:700;">{{ kpi.code }}</td>
                <td style="padding:7px 12px;color:#64748b;">{{ domain.title }}</td>
                <td style="padding:7px 12px;color:#1e293b;">{{ kpi.title }}</td>
                <td style="padding:7px 12px;font-weight:700;color:#1e293b;text-align:left;">{{ fmtVal(kpi.value, kpi.unit) }}</td>
                <td style="padding:7px 12px;text-align:center;">
                    <span :style="`font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700;background:${kpi.status==='answered'?'#dcfce7':'#fef3c7'};color:${kpi.status==='answered'?'#166534':'#92400e'};`">
                      {{ kpi.status === 'answered' ? '✓' : '!' }}
                    </span>
                </td>
              </tr>
            </template>
            </tbody>
          </table>
        </div>

        <!-- SOC -->
        <div style="margin-bottom:24px;">
          <div style="background:#06b6d4;color:#fff;padding:8px 16px;border-radius:8px 8px 0 0;font-weight:800;font-size:13px;display:flex;align-items:center;gap:8px;">
            <span>👥</span> اجتماعی (Social) — {{ soc?.summary?.total_kpis }} شاخص
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:11px;border:1px solid #e2e8f0;border-top:none;">
            <thead>
            <tr style="background:#f0fdfe;">
              <th style="padding:8px 12px;text-align:right;color:#0e7490;font-weight:700;width:110px;">کد</th>
              <th style="padding:8px 12px;text-align:right;color:#0e7490;font-weight:700;">دامنه</th>
              <th style="padding:8px 12px;text-align:right;color:#0e7490;font-weight:700;">شاخص</th>
              <th style="padding:8px 12px;text-align:left;color:#0e7490;font-weight:700;width:120px;">مقدار</th>
              <th style="padding:8px 12px;text-align:center;color:#0e7490;font-weight:700;width:80px;">وضعیت</th>
            </tr>
            </thead>
            <tbody>
            <template v-for="domain in (soc?.domains ?? [])" :key="domain.code">
              <tr v-for="(kpi, ki) in domain.kpis" :key="kpi.code" :style="`background:${ki%2===0?'#fff':'#f0fdfe'};border-bottom:1px solid #f1f5f9;`">
                <td style="padding:7px 12px;color:#06b6d4;font-weight:700;">{{ kpi.code }}</td>
                <td style="padding:7px 12px;color:#64748b;">{{ domain.title }}</td>
                <td style="padding:7px 12px;color:#1e293b;">{{ kpi.title }}</td>
                <td style="padding:7px 12px;font-weight:700;color:#1e293b;text-align:left;">{{ fmtVal(kpi.value, kpi.unit) }}</td>
                <td style="padding:7px 12px;text-align:center;">
                    <span :style="`font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700;background:${kpi.status==='answered'?'#dcfce7':'#fef3c7'};color:${kpi.status==='answered'?'#166534':'#92400e'};`">
                      {{ kpi.status === 'answered' ? '✓' : '!' }}
                    </span>
                </td>
              </tr>
            </template>
            </tbody>
          </table>
        </div>

        <!-- ENV -->
        <div>
          <div style="background:#059669;color:#fff;padding:8px 16px;border-radius:8px 8px 0 0;font-weight:800;font-size:13px;display:flex;align-items:center;gap:8px;">
            <span>🌱</span> محیط‌زیست (Environmental) — {{ env?.summary?.total_kpis }} شاخص
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:11px;border:1px solid #e2e8f0;border-top:none;">
            <thead>
            <tr style="background:#f0fdf4;">
              <th style="padding:8px 12px;text-align:right;color:#166534;font-weight:700;width:110px;">کد</th>
              <th style="padding:8px 12px;text-align:right;color:#166534;font-weight:700;">دامنه</th>
              <th style="padding:8px 12px;text-align:right;color:#166534;font-weight:700;">شاخص</th>
              <th style="padding:8px 12px;text-align:left;color:#166534;font-weight:700;width:120px;">مقدار</th>
              <th style="padding:8px 12px;text-align:center;color:#166534;font-weight:700;width:80px;">وضعیت</th>
            </tr>
            </thead>
            <tbody>
            <template v-for="domain in (env?.domains ?? [])" :key="domain.code">
              <tr v-for="(kpi, ki) in domain.kpis" :key="kpi.code" :style="`background:${ki%2===0?'#fff':'#f0fdf4'};border-bottom:1px solid #f1f5f9;`">
                <td style="padding:7px 12px;color:#059669;font-weight:700;">{{ kpi.code }}</td>
                <td style="padding:7px 12px;color:#64748b;">{{ domain.title }}</td>
                <td style="padding:7px 12px;color:#1e293b;">{{ kpi.title }}</td>
                <td style="padding:7px 12px;font-weight:700;color:#1e293b;text-align:left;">{{ fmtVal(kpi.value, kpi.unit) }}</td>
                <td style="padding:7px 12px;text-align:center;">
                    <span :style="`font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700;background:${kpi.status==='answered'?'#dcfce7':'#fef3c7'};color:${kpi.status==='answered'?'#166534':'#92400e'};`">
                      {{ kpi.status === 'answered' ? '✓' : '!' }}
                    </span>
                </td>
              </tr>
            </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ════ FOOTER ════════════════════════════════════════════════════════ -->
      <div style="background:#1e1b4b;color:#94a3b8;padding:20px 56px;display:flex;align-items:center;justify-content:space-between;font-size:11px;">
        <span>گزارش جامع ESG — {{ dashboardData?.reporting_period }}</span>
        <span style="color:#818cf8;font-weight:800;">ESG Management System</span>
        <span>آخرین به‌روزرسانی: {{ dashboardData?.last_updated }}</span>
      </div>

    </div><!-- /esg-pdf-root -->
  </div>
</template>

<style scoped>
@media print {
  .no-pdf { display: none !important; }
}
</style>