<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { reportRepo } from '@/core/repositories/reportRepo'

// ---------------------------------------------------------------------------
// data fetching
// ---------------------------------------------------------------------------
const data = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const reportType = ref<'baseline' | 'comparative'>('baseline')

const isGenerating = ref(false)
const progress = ref(0)

async function loadReport() {
  loading.value = true
  error.value = null
  try {
    const res = await reportRepo.getSustainabilitySections({ reportType: reportType.value })
    let payload = res?.data ?? null
    // For comparative reports: if the backend didn't resolve a comparison period
    // (compare_* params were not sent), derive the previous year and re-request so
    // the comparative-analysis page renders with real comparison data.
    if (
      reportType.value === 'comparative' &&
      payload &&
      !payload.comparisonPeriod &&
      payload.period &&
      payload.period.type === 'YEARLY'
    ) {
      // Best-effort: enrich with a previous-year comparison. If this extra call
      // fails, keep the already-loaded comparative payload.
      try {
        const prev = payload.period.year - 1
        const res2 = await reportRepo.getSustainabilitySections({
          reportType: 'comparative',
          period_type: 'YEARLY',
          compare_period_type: 'YEARLY',
          compare_date_from: `${prev}-01-01`,
          compare_date_to: `${prev}-12-31`,
        })
        payload = res2?.data ?? payload
      } catch (e) {
        console.warn('Comparison enrichment failed, using base payload:', e)
      }
    }
    data.value = payload
  } catch (e) {
    console.error(e)
    error.value = (e as Error)?.message || 'خطا در دریافت گزارش'
  } finally {
    loading.value = false
  }
}

function switchType(type: 'baseline' | 'comparative') {
  if (type === reportType.value) return
  reportType.value = type
  window.scrollTo({ top: 0 })
  loadReport()
}

onMounted(loadReport)

// ---------------------------------------------------------------------------
// derived data
// ---------------------------------------------------------------------------
const sections = computed(() => data.value?.sections ?? [])
function byKey(key: string) {
  return sections.value.find((s: any) => s.key === key)
}

const execSection = computed(() => byKey('executive-summary'))
const summary = computed(() => execSection.value?.data?.summary ?? null)
const governance = computed(() => byKey('governance') ?? null)
// capitals that have live data (used on cover + executive summary strip)
const capitalSections = computed(() =>
  sections.value.filter((s: any) => s.key.endsWith('-capital') && s.data?.capital)
)
// all capital sections (including empty ones, rendered as description-only pages)
const capitalPages = computed(() => sections.value.filter((s: any) => s.key.endsWith('-capital')))
const capitalsByKey = computed(() => {
  const m: Record<string, any> = {}
  for (const s of capitalPages.value) m[s.key] = s.data?.capital ?? null
  return m
})
const sectionsByKey = computed(() => {
  const m: Record<string, any> = {}
  for (const s of sections.value) m[s.key] = s
  return m
})
const riskSection = computed(() => byKey('risk-management') ?? null)
const riskData = computed(() => riskSection.value?.data?.risks ?? null)
const comparativeSection = computed(() => byKey('comparative-analysis') ?? null)
const comparison = computed(() => comparativeSection.value?.data?.comparison ?? null)
const outlook = computed(() => byKey('outlook') ?? null)
const period = computed(() => data.value?.period ?? null)
const comparisonPeriod = computed(() => data.value?.comparisonPeriod ?? null)

const pageGroups = computed(() => {
  const groups: { type: string; key: string }[] = [
    { type: 'cover', key: 'cover' },
    { type: 'exec', key: 'executive-summary' },
  ]
  if (governance.value) groups.push({ type: 'narrative', key: 'governance' })
  for (const s of capitalPages.value) groups.push({ type: 'capital', key: s.key })
  if (riskSection.value) groups.push({ type: 'risk', key: 'risk-management' })
  if (comparativeSection.value) groups.push({ type: 'comparative', key: 'comparative-analysis' })
  if (outlook.value) groups.push({ type: 'narrative', key: 'outlook' })
  return groups
})

const capitalRisks = computed(() => {
  const map: Record<string, { title: string; emoji: string; color: string }> = {}
  for (const s of capitalSections.value) {
    const c = s.data?.capital
    if (!c) continue
    const meta = capitalMeta(c.capitalType)
    map[c.slug] = { title: c.title, emoji: meta.emoji, color: meta.color }
  }
  const byCap = riskData.value?.byCapital ?? {}
  return Object.entries(byCap)
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => ({
      slug,
      count,
      title: map[slug]?.title ?? slug,
      emoji: map[slug]?.emoji ?? '📊',
      color: map[slug]?.color ?? '#64748b',
    }))
})

const comparativeRows = computed(() => {
  const compMap: Record<string, any> = {}
  for (const c of comparison.value?.capitals ?? []) compMap[c.slug] = c
  const rows: any[] = []
  const seen = new Set<string>()
  for (const s of capitalSections.value) {
    const c = s.data?.capital
    if (!c) continue
    seen.add(c.slug)
    rows.push({
      slug: c.slug,
      title: c.title,
      titleEn: c.titleEn,
      capitalType: c.capitalType,
      current: c.score,
      comparison: compMap[c.slug]?.score ?? null,
    })
  }
  for (const c of comparison.value?.capitals ?? []) {
    if (seen.has(c.slug)) continue
    rows.push({
      slug: c.slug,
      title: c.title,
      titleEn: c.titleEn,
      capitalType: c.capitalType,
      current: null,
      comparison: c.score,
    })
  }
  return rows
})

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const CAPITAL_META: Record<string, { color: string; emoji: string }> = {
  NAT: { color: '#16A34A', emoji: '🌿' },
  HUM: { color: '#2563EB', emoji: '👥' },
  SOC: { color: '#DB2777', emoji: '🤝' },
  INS: { color: '#7C3AED', emoji: '🏛️' },
  TEC: { color: '#0891B2', emoji: '💠' },
  FEC: { color: '#CA8A04', emoji: '💰' },
}
function capitalMeta(type?: string) {
  return (type && CAPITAL_META[type]) || { color: '#64748b', emoji: '📊' }
}

const PERIOD_TYPE_FA: Record<string, string> = {
  YEARLY: 'سالانه',
  QUARTERLY: 'فصلی',
  MONTHLY: 'ماهانه',
  WEEKLY: 'هفتگی',
}
const periodLabel = computed(() => {
  const p = period.value
  if (!p) return '—'
  return `${PERIOD_TYPE_FA[p.type] ?? p.type} ${p.year}`
})

const RISK_LEVEL_LABEL: Record<string, string> = {
  critical: 'بحرانی',
  high: 'بالا',
  medium: 'متوسط',
  low: 'پایین',
  unknown: 'نامشخص',
}
const RISK_LEVEL_COLOR: Record<string, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#16a34a',
  unknown: '#94a3b8',
}
const RISK_STATE_LABEL: Record<string, string> = {
  draft: 'پیش‌نویس',
  registered: 'ثبت‌شده',
  analysis: 'تحلیل',
  response: 'در حال پاسخ',
  monitoring: 'پایش',
  closed: 'بسته',
  archived: 'بایگانی‌شده',
  unknown: 'نامشخص',
}
const RISK_STATE_COLOR: Record<string, string> = {
  draft: '#94a3b8',
  registered: '#6366f1',
  analysis: '#0ea5e9',
  response: '#f59e0b',
  monitoring: '#8b5cf6',
  closed: '#16a34a',
  archived: '#64748b',
  unknown: '#94a3b8',
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
function round1(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return 0
  return Math.round(n * 10) / 10
}
function faNum(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return '—'
  return Number(v).toLocaleString('fa-IR')
}
function fmtScore(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return '—'
  return faNum(round1(v))
}
function gaugeOffset(score: number | null | undefined) {
  const C = 2 * Math.PI * 52
  const s = score == null ? 0 : Math.min(Math.max(score, 0), 100)
  return String(C - (C * s) / 100)
}
function deltaValue(node: any): number | null {
  if (node?.score == null || node?.comparison?.value == null) return null
  return node.score - node.comparison.value
}
function deltaBadge(node: any) {
  const d = deltaValue(node)
  if (d == null || d === 0) return '—'
  const arrow = d > 0 ? '▲' : '▼'
  return `${arrow} ${faNum(Math.abs(round1(d)))}`
}
function maturityChipStyle(m: any) {
  const c = m?.color || '#64748b'
  return {
    backgroundColor: hexToRgba(c, 0.12),
    color: c,
    borderColor: hexToRgba(c, 0.4),
  }
}
function sortedEntries(obj: Record<string, number> | null | undefined): [string, number][] {
  return Object.entries(obj ?? {}).sort((a, b) => b[1] - a[1])
}
function barPct(count: number, max: number) {
  return max > 0 ? Math.max(Math.round((count / max) * 100), 4) + '%' : '4%'
}
function maxCount(values: number[]) {
  return Math.max(...values, 1)
}

// ---------------------------------------------------------------------------
// PDF export (same approach as the ESG report)
// ---------------------------------------------------------------------------
async function downloadPDF() {
  isGenerating.value = true
  progress.value = 0
  try {
    const wrapper = document.getElementById('sustainability-report-wrapper')
    if (!wrapper) return
    const pages = wrapper.querySelectorAll('.page') as NodeListOf<HTMLElement>
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const A4_W = 210
    const A4_H = 297

    for (let i = 0; i < pages.length; i++) {
      progress.value = Math.round(((i + 1) / pages.length) * 100)
      const page = pages[i]
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        onclone: (doc) => {
          doc.querySelectorAll('*').forEach((el) => {
            const style = getComputedStyle(el)
            if (style.backgroundColor.includes('oklch')) {
              ;(el as HTMLElement).style.backgroundColor = '#ffffff'
            }
            if (style.color.includes('oklch')) {
              ;(el as HTMLElement).style.color = '#000000'
            }
          })
        },
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const imgW = A4_W
      const imgH = (canvas.height * A4_W) / canvas.width
      if (i > 0) pdf.addPage()
      if (imgH <= A4_H) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH)
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, A4_H)
      }
    }

    pdf.save(`گزارش-پایداری-${period.value?.year ?? ''}.pdf`)
  } catch (e) {
    console.error('PDF generation failed:', e)
    alert('خطا در تولید PDF. لطفاً دوباره تلاش کنید.')
  } finally {
    isGenerating.value = false
    progress.value = 0
  }
}
</script>

<template>
  <div v-if="loading" class="py-12 text-center">{{ 'در حال دریافت گزارش…' }}</div>
  <div v-else-if="error" class="py-12 text-center text-red-600">
    {{ error }}
    <div class="mt-3">
      <button
          class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
          @click="loadReport"
      >تلاش مجدد</button>
    </div>
  </div>
  <div v-else-if="!data" class="py-12 text-center text-slate-400">داده‌ای برای گزارش موجود نیست.</div>

  <div v-else dir="rtl" style="font-family: 'Vazirmatn', sans-serif" id="sustainability-report-root">
    <!-- ======================= TOOLBAR ======================= -->
    <div class="download-bar">
      <div class="seg">
        <button
            type="button"
            :class="{ active: reportType === 'baseline' }"
            @click="switchType('baseline')"
        >گزارش مبنا</button>
        <button
            type="button"
            :class="{ active: reportType === 'comparative' }"
            @click="switchType('comparative')"
        >گزارش مقایسه‌ای</button>
      </div>
      <span class="download-note">گزارش پایداری · دوره: {{ periodLabel }}</span>
      <span class="flex-1" />
      <button class="download-btn" :disabled="isGenerating" @click="downloadPDF">
        <svg v-if="!isGenerating" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <svg v-else class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <span v-if="!isGenerating">دانلود PDF گزارش</span>
        <span v-else>در حال تولید PDF... {{ progress }}%</span>
      </button>
      <div v-if="isGenerating" class="progress-bar-wrap">
        <div class="progress-bar-fill" :style="{ width: progress + '%' }" />
      </div>
    </div>

    <!-- ======================= REPORT PAGES ======================= -->
    <div class="report-wrapper" id="sustainability-report-wrapper">
      <div
          v-for="(pg, i) in pageGroups"
          :key="pg.key"
          class="page"
          :class="pg.type === 'cover' ? 'page-cover' : 'page-body'"
      >
        <!-- ================= COVER ================= -->
        <template v-if="pg.type === 'cover'">
          <div class="cover">
            <div class="cover-head">
              <div class="cover-logo">
                <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="16" stroke="rgba(255,255,255,0.55)" stroke-width="2" />
                  <path d="M10 20l5-6 5 4 6-8" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="cover-brand">پایداری شرکتی</div>
            </div>

            <div class="cover-mid">
              <div class="cover-title-fa">گزارش پایداری</div>
              <div class="cover-title-en" dir="ltr">Sustainability Report</div>
              <div class="cover-period">دوره گزارش‌دهی: {{ periodLabel }}</div>
            </div>

            <div class="cover-score">
              <div class="gauge-wrap cover-gauge">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.18)" stroke-width="9" fill="none" />
                  <circle
                      cx="60" cy="60" r="52"
                      stroke="#34D399" stroke-width="9" fill="none" stroke-linecap="round"
                      :stroke-dasharray="2 * Math.PI * 52"
                      :stroke-dashoffset="gaugeOffset(summary?.avgScore)"
                      transform="rotate(-90 60 60)"
                  />
                </svg>
                <div class="gauge-center">
                  <div class="g-val">{{ fmtScore(summary?.avgScore) }}</div>
                  <div class="g-lbl">امتیاز پایداری</div>
                </div>
              </div>
            </div>

            <div class="cover-stats">
              <div class="cover-stat">
                <div class="num">{{ faNum(summary?.capitals) }}</div>
                <div class="lbl">سرمایه</div>
              </div>
              <div class="cover-stat">
                <div class="num">{{ faNum(summary?.domains) }}</div>
                <div class="lbl">حوزه</div>
              </div>
              <div class="cover-stat">
                <div class="num">{{ faNum(summary?.capabilities) }}</div>
                <div class="lbl">قابلیت</div>
              </div>
              <div class="cover-stat">
                <div class="num">{{ faNum(summary?.indicators) }}</div>
                <div class="lbl">شاخص</div>
              </div>
              <div class="cover-stat">
                <div class="num">{{ fmtScore(summary?.dataCompletion) }}٪</div>
                <div class="lbl">تکمیل داده</div>
              </div>
            </div>

            <div class="cover-capitals">
              <div
                  v-for="s in capitalSections"
                  :key="s.key"
                  class="cover-cap"
                  :style="{ borderColor: hexToRgba(capitalMeta(s.data.capital.capitalType).color, 0.4) }"
              >
                <span class="cc-emoji">{{ capitalMeta(s.data.capital.capitalType).emoji }}</span>
                <span class="cc-score">{{ fmtScore(s.data.capital.score) }}</span>
              </div>
            </div>

            <div class="cover-foot">
              <span>محرمانه — جهت استفاده داخلی</span>
              <span>چارچوب‌ها: GRI · ISSB · TCFD</span>
            </div>
          </div>
        </template>

        <!-- ================= EXECUTIVE SUMMARY ================= -->
        <template v-else-if="pg.type === 'exec'">
          <div class="page-header">
            <div>
              <div class="page-section-title">{{ execSection?.title }}</div>
              <div class="page-section-sub" dir="ltr">{{ execSection?.titleEn }} · نگاهی کلی به عملکرد پایداری</div>
            </div>
            <div class="header-meta">
              <div class="hm-label">دوره</div>
              <div class="hm-value">{{ periodLabel }}</div>
            </div>
          </div>

          <div class="narrative-box">{{ execSection?.description }}</div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">امتیاز میانگین</div>
              <div class="kpi-value" style="color:#0B5C43">{{ fmtScore(summary?.avgScore) }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">تکمیل داده</div>
              <div class="kpi-value" style="color:#0B5C43">{{ fmtScore(summary?.dataCompletion) }}٪</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">حوزه‌ها</div>
              <div class="kpi-value">{{ faNum(summary?.domains) }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">اجزا</div>
              <div class="kpi-value">{{ faNum(summary?.components) }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">قابلیت‌ها</div>
              <div class="kpi-value">{{ faNum(summary?.capabilities) }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">شاخص‌ها</div>
              <div class="kpi-value">{{ faNum(summary?.indicatorsWithData) }}/{{ faNum(summary?.indicators) }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">اهداف محقق‌شده</div>
              <div class="kpi-value">{{ faNum(summary?.targetsMet) }}/{{ faNum(summary?.targetsTotal) }}</div>
            </div>
          </div>

          <div class="strip-title">امتیاز سرمایه‌ها</div>
          <div class="capital-strip">
            <div v-for="s in capitalSections" :key="s.key" class="cap-strip-row">
              <div class="csr-name">
                <span class="csr-emoji" :style="{ background: hexToRgba(capitalMeta(s.data.capital.capitalType).color, 0.14) }">
                  {{ capitalMeta(s.data.capital.capitalType).emoji }}
                </span>
                <span>{{ s.data.capital.title }}</span>
              </div>
              <div class="csr-bar-bg">
                <div
                    class="csr-bar-fill"
                    :style="{ width: (s.data.capital.score ?? 0) + '%', background: capitalMeta(s.data.capital.capitalType).color }"
                />
              </div>
              <span class="csr-score">{{ fmtScore(s.data.capital.score) }}</span>
              <span
                  v-if="deltaValue(s.data.capital) != null"
                  class="delta-badge"
                  :class="deltaValue(s.data.capital)! > 0 ? 'delta-up' : deltaValue(s.data.capital)! < 0 ? 'delta-down' : ''"
              >{{ deltaBadge(s.data.capital) }}</span>
            </div>
          </div>
        </template>

        <!-- ================= NARRATIVE (governance / outlook) ================= -->
        <template v-else-if="pg.type === 'narrative'">
          <div class="page-header">
            <div>
              <div class="page-section-title">{{ pg.key === 'governance' ? governance?.title : outlook?.title }}</div>
              <div class="page-section-sub" dir="ltr">
                {{ pg.key === 'governance' ? governance?.titleEn : outlook?.titleEn }}
              </div>
            </div>
            <div class="header-meta">
              <div class="hm-label">دوره</div>
              <div class="hm-value">{{ periodLabel }}</div>
            </div>
          </div>
          <div class="narrative-page">
            <div class="quote-mark">“</div>
            <p class="narrative-long">
              {{ pg.key === 'governance' ? governance?.description : outlook?.description }}
            </p>
          </div>
          <div v-if="pg.key === 'governance'" class="gov-bands">
            <div class="gov-band">
              <span class="gb-emoji">🎯</span>
              <div>
                <div class="gb-title">راهبرد و نظارت</div>
                <div class="gb-text">شفافیت، پاسخگویی و نظارت مستمر بر موضوعات پایداری در سطح هیئت‌مدیره</div>
              </div>
            </div>
            <div class="gov-band">
              <span class="gb-emoji">⚖️</span>
              <div>
                <div class="gb-title">اخلاق و تطبیق</div>
                <div class="gb-text">رعایت الزامات قانونی، استانداردهای رفتاری و مدیریت مسئولانه ریسک</div>
              </div>
            </div>
          </div>
          <div v-else class="outlook-band">
            <span class="gb-emoji">🚀</span>
            <div>
              <div class="gb-title">افق آینده</div>
              <div class="gb-text">ارتقای سطح بلوغ هر یک از سرمایه‌های شش‌گانه در دوره‌های آتی گزارش‌گری</div>
            </div>
          </div>
        </template>

        <!-- ================= CAPITAL ================= -->
        <template v-else-if="pg.type === 'capital'">
          <template v-if="capitalsByKey[pg.key]">
            <div class="page-header capital-header">
              <div class="cap-head-right">
                <div
                    class="cap-emoji"
                    :style="{ background: hexToRgba(capitalMeta(capitalsByKey[pg.key].capitalType).color, 0.14) }"
                >{{ capitalMeta(capitalsByKey[pg.key].capitalType).emoji }}</div>
                <div>
                  <div class="page-section-title">{{ capitalsByKey[pg.key].title }}</div>
                  <div class="page-section-sub" dir="ltr">{{ capitalsByKey[pg.key].titleEn }}</div>
                </div>
              </div>
              <div class="cap-meta">
                <div
                    v-if="capitalsByKey[pg.key].maturity"
                    class="maturity-chip"
                    :style="maturityChipStyle(capitalsByKey[pg.key].maturity)"
                >
                  {{ capitalsByKey[pg.key].maturity.emoji }} {{ capitalsByKey[pg.key].maturity.labelFa }}
                </div>
                <span
                    v-if="deltaValue(capitalsByKey[pg.key]) != null"
                    class="delta-badge"
                    :class="deltaValue(capitalsByKey[pg.key])! > 0 ? 'delta-up' : deltaValue(capitalsByKey[pg.key])! < 0 ? 'delta-down' : ''"
                >{{ deltaBadge(capitalsByKey[pg.key]) }}</span>
              </div>
            </div>

            <div class="cap-score-row">
              <div class="gauge-wrap cap-gauge">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" stroke="#E8EDF2" stroke-width="9" fill="none" />
                  <circle
                      cx="60" cy="60" r="52"
                      :stroke="capitalMeta(capitalsByKey[pg.key].capitalType).color"
                      stroke-width="9" fill="none" stroke-linecap="round"
                      :stroke-dasharray="2 * Math.PI * 52"
                      :stroke-dashoffset="gaugeOffset(capitalsByKey[pg.key].score)"
                      transform="rotate(-90 60 60)"
                  />
                </svg>
                <div class="gauge-center">
                  <div class="g-val" :style="{ color: capitalMeta(capitalsByKey[pg.key].capitalType).color }">
                    {{ fmtScore(capitalsByKey[pg.key].score) }}
                  </div>
                  <div class="g-lbl">امتیاز سرمایه</div>
                </div>
              </div>
              <div class="cap-quick">
                <div class="cq-item">
                  <div class="cq-num">{{ faNum(capitalsByKey[pg.key].domains?.length) }}</div>
                  <div class="cq-lbl">حوزه</div>
                </div>
                <div class="cq-item">
                  <div class="cq-num">{{ faNum(capitalsByKey[pg.key].indicatorCount) }}</div>
                  <div class="cq-lbl">شاخص</div>
                </div>
                <div class="cq-item">
                  <div class="cq-num">{{ faNum(capitalsByKey[pg.key].indicatorsWithData) }}</div>
                  <div class="cq-lbl">با داده</div>
                </div>
              </div>
              <div class="cap-desc">{{ sectionsByKey[pg.key]?.description }}</div>
            </div>

            <div class="domains">
              <div v-for="dom in capitalsByKey[pg.key].domains ?? []" :key="dom.slug" class="domain-block">
                <div class="domain-head">
                  <div class="domain-title">
                    {{ dom.title }}
                    <span class="domain-title-en" dir="ltr">{{ dom.titleEn }}</span>
                  </div>
                  <div class="domain-right">
                    <span v-if="dom.maturity" class="maturity-mini" :style="{ color: dom.maturity.color }">
                      {{ dom.maturity.emoji }} {{ dom.maturity.labelFa }}
                    </span>
                    <div class="mini-bar">
                      <div
                          class="mini-bar-fill"
                          :style="{
                            width: (dom.score ?? 0) + '%',
                            background: capitalMeta(capitalsByKey[pg.key].capitalType).color,
                          }"
                      />
                    </div>
                    <span class="domain-score">{{ fmtScore(dom.score) }}</span>
                    <span
                        v-if="deltaValue(dom) != null"
                        class="delta-mini"
                        :class="deltaValue(dom)! > 0 ? 'delta-up' : deltaValue(dom)! < 0 ? 'delta-down' : ''"
                    >{{ deltaBadge(dom) }}</span>
                  </div>
                </div>

                <div v-if="dom.components?.length" class="components">
                  <div v-for="comp in dom.components" :key="comp.slug" class="comp-block">
                    <div class="comp-row">
                      <span class="comp-name">◈ {{ comp.title }}</span>
                      <div class="mini-bar slim">
                        <div
                            class="mini-bar-fill"
                            :style="{ width: (comp.score ?? 0) + '%', background: capitalMeta(capitalsByKey[pg.key].capitalType).color }"
                        />
                      </div>
                      <span class="comp-score">{{ fmtScore(comp.score) }}</span>
                      <span v-if="deltaValue(comp) != null" class="delta-mini" :class="deltaValue(comp)! > 0 ? 'delta-up' : deltaValue(comp)! < 0 ? 'delta-down' : ''">
                        {{ deltaBadge(comp) }}
                      </span>
                    </div>
                    <div v-if="comp.capabilities?.length" class="capab-list">
                      <div v-for="capab in comp.capabilities" :key="capab.slug" class="capab-row">
                        <span class="capab-name">{{ capab.title }}</span>
                        <span v-if="capab.meetsTarget" class="target-ok" title="مطابق هدف">✓</span>
                        <span v-if="capab.risks?.summary?.total" class="risk-chip">
                          ⚠ {{ faNum(capab.risks.summary.total) }}
                        </span>
                        <span class="capab-score">{{ fmtScore(capab.score) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <!-- empty capital: description-only page -->
          <template v-else>
            <div class="page-header">
              <div>
                <div class="page-section-title">{{ sectionsByKey[pg.key]?.title }}</div>
                <div class="page-section-sub" dir="ltr">{{ sectionsByKey[pg.key]?.titleEn }}</div>
              </div>
              <div class="header-meta">
                <div class="hm-label">دوره</div>
                <div class="hm-value">{{ periodLabel }}</div>
              </div>
            </div>
            <div class="narrative-page">
              <div class="quote-mark">“</div>
              <p class="narrative-long">{{ sectionsByKey[pg.key]?.description || 'داده‌ای برای این سرمایه در دوره جاری ثبت نشده است.' }}</p>
            </div>
          </template>
        </template>

        <!-- ================= RISK MANAGEMENT ================= -->
        <template v-else-if="pg.type === 'risk'">
          <div class="page-header">
            <div>
              <div class="page-section-title">مدیریت ریسک و فرصت‌ها</div>
              <div class="page-section-sub" dir="ltr">Risk &amp; Opportunity Management · پرتفوی ریسک‌های پایداری</div>
            </div>
            <div class="header-meta">
              <div class="hm-label">دوره</div>
              <div class="hm-value">{{ periodLabel }}</div>
            </div>
          </div>

          <div v-if="riskData" class="risk-body">
            <div class="risk-kpis">
              <div class="risk-kpi">
                <div class="rk-num">{{ faNum(riskData.total) }}</div>
                <div class="rk-lbl">کل ریسک‌ها</div>
              </div>
              <div class="risk-kpi">
                <div class="rk-num">{{ faNum(riskData.active) }}</div>
                <div class="rk-lbl">ریسک‌های فعال</div>
              </div>
              <div class="risk-kpi">
                <div class="rk-num">{{ faNum(riskData.archived) }}</div>
                <div class="rk-lbl">بایگانی‌شده</div>
              </div>
            </div>

            <div class="two-col">
              <div class="dist-card">
                <div class="dist-title">توزیع سطح ریسک</div>
                <div v-for="([lvl, count]) in sortedEntries(riskData.byLevel)" :key="lvl" class="bar-row">
                  <span class="bar-label">{{ RISK_LEVEL_LABEL[lvl] ?? lvl }}</span>
                  <div class="bar-bg">
                    <div
                        class="bar-fill"
                        :style="{ width: barPct(count, Math.max(...Object.values(riskData.byLevel ?? {}), 1)), background: RISK_LEVEL_COLOR[lvl] ?? '#94a3b8' }"
                    />
                  </div>
                  <span class="bar-count">{{ faNum(count) }}</span>
                </div>
              </div>
              <div class="dist-card">
                <div class="dist-title">توزیع وضعیت ریسک</div>
                <div v-for="([state, count]) in sortedEntries(riskData.byState)" :key="state" class="bar-row">
                  <span class="bar-label">{{ RISK_STATE_LABEL[state] ?? state }}</span>
                  <div class="bar-bg">
                    <div
                        class="bar-fill"
                        :style="{ width: barPct(count, Math.max(...Object.values(riskData.byState ?? {}), 1)), background: RISK_STATE_COLOR[state] ?? '#94a3b8' }"
                    />
                  </div>
                  <span class="bar-count">{{ faNum(count) }}</span>
                </div>
              </div>
            </div>

            <div class="dist-card">
              <div class="dist-title">توزیع ریسک بر اساس سرمایه</div>
              <div v-for="item in capitalRisks" :key="item.slug" class="bar-row">
                <span class="bar-label">{{ item.emoji }} {{ item.title }}</span>
                <div class="bar-bg">
                  <div
                      class="bar-fill"
                      :style="{ width: barPct(item.count, maxCount(capitalRisks.map((r) => r.count))), background: item.color }"
                  />
                </div>
                <span class="bar-count">{{ faNum(item.count) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="narrative-page">
            <div class="quote-mark">“</div>
            <p class="narrative-long">{{ riskSection?.description || 'داده‌ای برای پرتفوی ریسک در دوره جاری ثبت نشده است.' }}</p>
          </div>
        </template>

        <!-- ================= COMPARATIVE ================= -->
        <template v-else-if="pg.type === 'comparative'">
          <div class="page-header">
            <div>
              <div class="page-section-title">تحلیل مقایسه‌ای دوره‌ها</div>
              <div class="page-section-sub" dir="ltr">Comparative Analysis · مقایسه عملکرد دو دوره گزارش‌گری</div>
            </div>
            <div class="header-meta">
              <div class="hm-label">دوره‌ها</div>
              <div class="hm-value">{{ periodLabel }} ← {{ PERIOD_TYPE_FA[comparisonPeriod?.type] ?? comparisonPeriod?.type }} {{ comparisonPeriod?.year }}</div>
            </div>
          </div>

          <template v-if="comparison">
            <div class="compare-summary">
              <div class="cs-item">
                <div class="cs-lbl">دوره جاری</div>
                <div class="cs-val">{{ periodLabel }}</div>
              </div>
              <div class="cs-arrow">←</div>
              <div class="cs-item">
                <div class="cs-lbl">دوره مقایسه</div>
                <div class="cs-val">{{ PERIOD_TYPE_FA[comparisonPeriod?.type] ?? comparisonPeriod?.type }} {{ comparisonPeriod?.year }}</div>
              </div>
            </div>

            <table class="compare-table">
              <thead>
              <tr>
                <th>سرمایه</th>
                <th>امتیاز دوره جاری</th>
                <th>امتیاز دوره مقایسه</th>
                <th>تغییر</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="row in comparativeRows" :key="row.slug">
                <td>
                  <span class="ct-cap">
                    <span class="csr-emoji" :style="{ background: hexToRgba(capitalMeta(row.capitalType).color, 0.14) }">
                      {{ capitalMeta(row.capitalType).emoji }}
                    </span>
                    {{ row.title }}
                  </span>
                </td>
                <td class="ct-score">{{ row.current != null ? fmtScore(row.current) : '—' }}</td>
                <td class="ct-score muted">{{ row.comparison != null ? fmtScore(row.comparison) : '—' }}</td>
                <td>
                  <span
                      v-if="row.current != null && row.comparison != null"
                      class="delta-badge"
                      :class="row.current - row.comparison > 0 ? 'delta-up' : row.current - row.comparison < 0 ? 'delta-down' : ''"
                  >
                    {{ row.current - row.comparison > 0 ? '▲' : row.current - row.comparison < 0 ? '▼' : '' }}
                    {{ faNum(Math.abs(round1(row.current - row.comparison))) }}
                  </span>
                  <span v-else class="delta-badge">—</span>
                </td>
              </tr>
              </tbody>
            </table>
          </template>
          <div v-else class="narrative-page">
            <div class="quote-mark">“</div>
            <p class="narrative-long">
              {{ comparativeSection?.description || 'برای این گزارش دوره مقایسه‌ای تعیین نشده است.' }}
            </p>
          </div>
        </template>

        <!-- page number (skip cover) -->
        <div v-if="pg.type !== 'cover'" class="page-num">صفحه {{ faNum(i + 1) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap');

@media print {
  .download-bar { display: none; }
  .report-wrapper { background: none; padding: 0; }
  .page { box-shadow: none; margin: 0; page-break-after: always; }
}
* { box-sizing: border-box; }

/* ---------------- toolbar ---------------- */
.download-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.seg {
  display: inline-flex;
  background: #f1f5f9;
  border-radius: 9px;
  padding: 3px;
  gap: 2px;
}
.seg button {
  border: none;
  background: transparent;
  font-family: 'Vazirmatn', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  padding: 7px 14px;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s;
}
.seg button.active {
  background: #fff;
  color: #0B5C43;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-weight: 700;
}
.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #0B5C43;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 13px;
  font-family: 'Vazirmatn', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}
.download-btn:hover:not(:disabled) { background: #085041; }
.download-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.progress-bar-wrap {
  flex: 1;
  max-width: 180px;
  height: 6px;
  background: #e5e5e5;
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: #10B981;
  border-radius: 3px;
  transition: width 0.3s;
}
.download-note { font-size: 11px; color: #8892a0; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }

/* ---------------- wrapper + page ---------------- */
.report-wrapper {
  background: #eceff2;
  padding: 28px;
  min-height: 100vh;
}
.page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto 28px;
  background: #fff;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 15mm 16mm 12mm;
  overflow: hidden;
}
.page-cover {
  background: linear-gradient(160deg, #064E3B 0%, #0B5C43 38%, #0F766E 100%);
  color: #fff;
}
.page-body {
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.08);
  border-radius: 4px;
}

/* ---------------- page header ---------------- */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #0B5C43;
  margin-bottom: 14px;
}
.page-section-title {
  font-size: 17px;
  font-weight: 800;
  color: #0F172A;
}
.page-section-sub {
  font-size: 10.5px;
  color: #64748B;
  margin-top: 2px;
  font-weight: 400;
}
.header-meta {
  text-align: center;
  background: #F1F5F9;
  border-radius: 8px;
  padding: 6px 14px;
  flex-shrink: 0;
}
.hm-label { font-size: 9px; color: #94A3B8; }
.hm-value { font-size: 12px; font-weight: 700; color: #0F172A; margin-top: 1px; }

/* ---------------- narrative ---------------- */
.narrative-box {
  background: #F6FAF8;
  border: 1px solid #DCEAE3;
  border-right: 3px solid #10B981;
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 11.5px;
  line-height: 2.1;
  color: #334155;
}
.narrative-page {
  position: relative;
  background: linear-gradient(180deg, #F8FBF9 0%, #fff 100%);
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 26px 28px;
  margin-top: 6px;
}
.quote-mark {
  font-size: 56px;
  font-family: Georgia, serif;
  color: #0B5C43;
  line-height: 0.6;
  height: 40px;
  opacity: 0.35;
}
.narrative-long {
  font-size: 13px;
  line-height: 2.4;
  color: #334155;
  margin: 10px 0 0;
  text-align: justify;
}
.gov-bands { margin-top: 16px; display: flex; gap: 12px; }
.gov-band, .outlook-band {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 14px 16px;
}
.gb-emoji { font-size: 20px; }
.gb-title { font-size: 12.5px; font-weight: 700; color: #0F172A; }
.gb-text { font-size: 10.5px; color: #64748B; margin-top: 4px; line-height: 1.9; }
.outlook-band { max-width: 60%; }

/* ---------------- KPI grid ---------------- */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 14px;
}
.kpi-card {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-top: 3px solid #0B5C43;
  border-radius: 10px;
  padding: 12px 14px;
}
.kpi-label { font-size: 10.5px; color: #64748B; }
.kpi-value { font-size: 22px; font-weight: 800; color: #0F172A; margin-top: 6px; }

/* ---------------- capital strip (exec summary) ---------------- */
.strip-title {
  font-size: 13px;
  font-weight: 700;
  color: #0F172A;
  margin: 18px 0 8px;
}
.capital-strip { display: flex; flex-direction: column; gap: 8px; }
.cap-strip-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.csr-name {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 180px;
  font-size: 11px;
  font-weight: 600;
  color: #1E293B;
  flex-shrink: 0;
}
.csr-emoji {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}
.csr-bar-bg {
  flex: 1;
  height: 9px;
  background: #EEF2F6;
  border-radius: 6px;
  overflow: hidden;
}
.csr-bar-fill { height: 100%; border-radius: 6px; }
.csr-score { width: 44px; text-align: center; font-size: 13px; font-weight: 800; color: #0F172A; }

/* ---------------- delta + maturity chips ---------------- */
.delta-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  padding: 2px 8px;
  background: #F1F5F9;
  color: #64748B;
}
.delta-up { background: #ECFDF5; color: #059669; }
.delta-down { background: #FEF2F2; color: #DC2626; }
.delta-mini { font-size: 10px; font-weight: 700; }
.maturity-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 700;
  border: 1px solid;
  border-radius: 999px;
  padding: 4px 12px;
}
.maturity-mini { font-size: 10px; font-weight: 600; }

/* ---------------- cover ---------------- */
.cover {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.cover-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cover-logo {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-brand { font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, 0.85); }
.cover-mid { text-align: center; margin-top: 46px; }
.cover-title-fa { font-size: 40px; font-weight: 800; letter-spacing: -0.5px; }
.cover-title-en { font-size: 15px; font-weight: 500; color: rgba(255, 255, 255, 0.75); margin-top: 8px; letter-spacing: 1px; }
.cover-period {
  display: inline-block;
  margin-top: 14px;
  font-size: 12.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  padding: 7px 18px;
}
.cover-score {
  display: flex;
  justify-content: center;
  margin-top: 34px;
}
.cover-gauge { width: 190px; height: 190px; }
.cover-gauge svg { width: 100%; height: 100%; }
.cover-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-top: 30px;
}
.cover-stat {
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
}
.cover-stat .num { font-size: 21px; font-weight: 800; }
.cover-stat .lbl { font-size: 10px; color: rgba(255, 255, 255, 0.72); margin-top: 4px; }
.cover-capitals {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-top: 18px;
}
.cover-cap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid;
  border-radius: 10px;
  padding: 9px 6px;
}
.cc-emoji { font-size: 15px; }
.cc-score { font-size: 13px; font-weight: 800; }
.cover-foot {
  margin-top: auto;
  padding-top: 26px;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}

/* ---------------- gauge ---------------- */
.gauge-wrap { position: relative; display: inline-flex; }
.gauge-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.g-val { font-size: 26px; font-weight: 800; }
.g-lbl { font-size: 9.5px; color: #64748B; margin-top: 2px; }
.cover-gauge .g-val { font-size: 40px; color: #fff; }
.cover-gauge .g-lbl { color: rgba(255, 255, 255, 0.72); }
.cap-gauge { width: 130px; height: 130px; flex-shrink: 0; }
.cap-gauge svg { width: 100%; height: 100%; }
.cap-gauge .g-val { font-size: 27px; }

/* ---------------- capital page ---------------- */
.capital-header { align-items: center; }
.cap-head-right { display: flex; align-items: center; gap: 12px; }
.cap-emoji {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.cap-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.cap-score-row {
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 4px 0 14px;
}
.cap-quick { display: flex; gap: 10px; }
.cq-item {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 9px 16px;
  text-align: center;
}
.cq-num { font-size: 17px; font-weight: 800; color: #0F172A; }
.cq-lbl { font-size: 9.5px; color: #94A3B8; margin-top: 2px; }
.cap-desc {
  flex: 1;
  font-size: 10px;
  line-height: 1.9;
  color: #64748B;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 10px 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------------- domain drill-down ---------------- */
.domains { display: flex; flex-direction: column; gap: 12px; }
.domain-block {
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 10px 14px;
}
.domain-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.domain-title {
  font-size: 12px;
  font-weight: 700;
  color: #0F172A;
}
.domain-title-en { font-size: 9.5px; color: #94A3B8; font-weight: 400; margin-right: 6px; }
.domain-right { display: flex; align-items: center; gap: 10px; }
.mini-bar {
  width: 110px;
  height: 7px;
  background: #EEF2F6;
  border-radius: 5px;
  overflow: hidden;
}
.mini-bar.slim { width: 80px; height: 5px; }
.mini-bar-fill { height: 100%; border-radius: 5px; }
.domain-score { font-size: 13px; font-weight: 800; color: #0F172A; width: 34px; text-align: center; }

.components {
  margin-top: 8px;
  padding-right: 14px;
  border-right: 2px solid #E2E8F0;
}
.comp-block { padding: 5px 0 2px 10px; }
.comp-row { display: flex; align-items: center; gap: 10px; }
.comp-name { font-size: 11px; font-weight: 600; color: #334155; width: 250px; }
.comp-score { font-size: 11.5px; font-weight: 700; color: #0F172A; width: 30px; text-align: center; }
.capab-list {
  margin: 4px 12px 2px 0;
  padding-right: 12px;
  border-right: 1px dashed #CBD5E1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.capab-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: #64748B;
  padding: 2px 0;
}
.capab-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.capab-score { font-weight: 700; color: #475569; width: 26px; text-align: center; }
.target-ok { color: #059669; font-weight: 800; font-size: 10px; }
.risk-chip {
  font-size: 9px;
  font-weight: 600;
  color: #DC2626;
  background: #FEF2F2;
  border-radius: 999px;
  padding: 1px 7px;
}

/* ---------------- risk page ---------------- */
.risk-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}
.risk-kpi {
  border: 1px solid #E2E8F0;
  border-top: 3px solid #DC2626;
  border-radius: 10px;
  padding: 14px;
  text-align: center;
  background: #fff;
}
.risk-kpi:nth-child(2) { border-top-color: #F59E0B; }
.risk-kpi:nth-child(3) { border-top-color: #64748B; }
.rk-num { font-size: 24px; font-weight: 800; color: #0F172A; }
.rk-lbl { font-size: 10.5px; color: #64748B; margin-top: 4px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.dist-card {
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 12px 14px;
}
.dist-title { font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 10px; }
.bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 7px; }
.bar-label { width: 110px; font-size: 10.5px; color: #334155; flex-shrink: 0; }
.bar-bg { flex: 1; height: 12px; background: #F1F5F9; border-radius: 6px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 6px; }
.bar-count { width: 30px; text-align: center; font-size: 11.5px; font-weight: 700; color: #0F172A; }

/* ---------------- comparative ---------------- */
.compare-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  margin: 4px 0 16px;
}
.cs-item { text-align: center; }
.cs-lbl { font-size: 10px; color: #94A3B8; }
.cs-val { font-size: 14px; font-weight: 800; color: #0F172A; margin-top: 3px; }
.cs-arrow { font-size: 20px; color: #10B981; }
.compare-table { width: 100%; border-collapse: collapse; }
.compare-table th {
  font-size: 10.5px;
  color: #64748B;
  font-weight: 600;
  text-align: right;
  border-bottom: 2px solid #E2E8F0;
  padding: 9px 10px;
}
.compare-table td {
  font-size: 11.5px;
  color: #334155;
  border-bottom: 1px solid #F1F5F9;
  padding: 10px;
}
.ct-cap { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #0F172A; }
.ct-score { font-weight: 800; color: #0F172A; }
.ct-score.muted { color: #94A3B8; font-weight: 600; }

/* ---------------- page number ---------------- */
.page-num {
  margin-top: auto;
  padding-top: 12px;
  text-align: center;
  font-size: 10px;
  color: #94A3B8;
}
</style>
