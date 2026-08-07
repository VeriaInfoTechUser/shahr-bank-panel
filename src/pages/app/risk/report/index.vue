<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { Form } from 'vee-validate'
import Lucide from '@/base-components/Lucide'
import Button from '@/base-components/Button'
import BaseDateRangePicker from '@/core/ui/base/BaseDateRangePicker.vue'
import { grcRepo } from '@/core/repositories/grcRepo'
import { useReportPagination, faNum, fmtScore, round1, barPct, maxCount, hexToRgba, faDate } from '@/composables/useReportPagination'
import '@/styles/grc-report.css'

// ---------------------------------------------------------------------------
// state + data fetching
// ---------------------------------------------------------------------------
const data = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const reportGenerated = ref(false)

// filter panel state (optional date range, mirroring the risk dashboard)
const dateFrom = ref('')
const dateTo = ref('')

const { isGenerating, progress, buildPages, downloadPDF } = useReportPagination({
  wrapperId: 'risk-report-wrapper',
  sourceId: 'risk-report-source',
  fileName: () => {
    const range = dateFrom.value || dateTo.value ? `-${dateFrom.value || '…'}_${dateTo.value || '…'}` : ''
    return `گزارش-ریسک${range}.pdf`
  },
})

const sections = computed(() => data.value?.sections ?? [])

function byKey(key: string) {
  return sections.value.find((s: any) => s.key === key)
}

async function loadReport() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, unknown> = { reportType: 'baseline' }
    if (dateFrom.value) params.updatedAtStart = dateFrom.value
    if (dateTo.value) params.updatedAtEnd = dateTo.value
    const res = await grcRepo.riskReportSections(params)
    data.value = res?.data ?? null
  } catch (e) {
    console.error(e)
    error.value = (e as Error)?.message || 'خطا در دریافت گزارش'
  } finally {
    loading.value = false
    await nextTick()
    buildPages()
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => buildPages())
    }
  }
}

function generateReport() {
  reportGenerated.value = true
  loadReport()
}

/** vee-validate submit: read the range picker values and generate the report */
function onSubmitFilter(values: Record<string, unknown>) {
  dateFrom.value = String(values.updatedAtStart ?? '').trim()
  dateTo.value = String(values.updatedAtEnd ?? '').trim()
  generateReport()
}

function backToSettings() {
  reportGenerated.value = false
  data.value = null
  window.scrollTo({ top: 0 })
}

// ---------------------------------------------------------------------------
// labels + colors
// ---------------------------------------------------------------------------
const LEVEL_META: Record<string, { label: string; color: string }> = {
  critical: { label: 'بحرانی', color: '#dc2626' },
  high: { label: 'بالا', color: '#f97316' },
  medium: { label: 'متوسط', color: '#f59e0b' },
  low: { label: 'پایین', color: '#16a34a' },
  unknown: { label: 'نامشخص', color: '#94a3b8' },
}
const STATE_META: Record<string, { label: string; color: string }> = {
  draft: { label: 'پیش‌نویس', color: '#94a3b8' },
  registered: { label: 'ثبت‌شده', color: '#6366f1' },
  analysis: { label: 'تحلیل', color: '#0ea5e9' },
  response: { label: 'در حال پاسخ', color: '#f59e0b' },
  monitoring: { label: 'پایش', color: '#8b5cf6' },
  closed: { label: 'بسته', color: '#16a34a' },
  archived: { label: 'بایگانی‌شده', color: '#64748b' },
  unknown: { label: 'نامشخص', color: '#94a3b8' },
}
const TYPE_META: Record<string, { label: string; color: string }> = {
  threat: { label: 'تهدید', color: '#dc2626' },
  opportunity: { label: 'فرصت', color: '#16a34a' },
}
const LEVEL_ORDER = ['critical', 'high', 'medium', 'low', 'unknown']

function levelMeta(k?: string | null) {
  return LEVEL_META[k ?? 'unknown'] ?? LEVEL_META.unknown
}
function stateMeta(k?: string | null) {
  return STATE_META[k ?? 'unknown'] ?? STATE_META.unknown
}
function typeMeta(k?: string | null) {
  return TYPE_META[k ?? 'threat'] ?? TYPE_META.threat
}

function countOf(list: any[] | undefined | null, key: string) {
  return (list ?? []).find((x) => x.level === key || x.state === key || x.riskType === key || x.answer === key)?.count ?? 0
}
function sumCounts(list: any[] | undefined | null) {
  return (list ?? []).reduce((acc, x) => acc + (Number(x.count) || 0), 0)
}

// ---------------------------------------------------------------------------
// per-section data accessors
// ---------------------------------------------------------------------------
const execSection = computed(() => byKey('executive-summary'))
const execSummary = computed(() => execSection.value?.data?.summary ?? null)
const execLevels = computed(() => execSummary.value?.byLevel ?? [])
const execStates = computed(() => execSummary.value?.byState ?? [])
const execTypes = computed(() => execSummary.value?.byType ?? [])
const execTotal = computed(() => execSummary.value?.total ?? sumCounts(execLevels.value))

const coverStats = computed(() => [
  { num: faNum(execTotal.value), lbl: 'کل ریسک‌ها' },
  { num: faNum(countOf(execLevels.value, 'critical')), lbl: 'بحرانی' },
  { num: faNum(countOf(execLevels.value, 'high')), lbl: 'بالا' },
  { num: faNum(countOf(execStates.value, 'monitoring')), lbl: 'در حال پایش' },
])

// risk matrix (impact × likelihood)
function matrixGrid(cells: any[] | undefined | null) {
  const grid: any[] = []
  for (let impact = 5; impact >= 1; impact--) {
    const row: any[] = []
    for (let likelihood = 1; likelihood <= 5; likelihood++) {
      const c = (cells ?? []).find((x) => x.impact === impact && x.likelihood === likelihood)
      row.push({ impact, likelihood, count: c?.count ?? 0 })
    }
    grid.push(row)
  }
  return grid
}
function matrixColor(impact: number, likelihood: number) {
  const score = impact * likelihood
  if (score >= 16) return LEVEL_META.critical.color
  if (score >= 10) return LEVEL_META.high.color
  if (score >= 5) return LEVEL_META.medium.color
  return LEVEL_META.low.color
}

// framework heatmap: rows = frameworks, cols = levels
function frameworkRows(cells: any[] | undefined | null) {
  const map = new Map<string, { title: string; cells: Record<string, number> }>()
  for (const c of cells ?? []) {
    if (!map.has(c.frameworkTitle)) {
      map.set(c.frameworkTitle, { title: c.frameworkTitle, cells: {} })
    }
    map.get(c.frameworkTitle)!.cells[c.level] = c.count ?? 0
  }
  return Array.from(map.values())
}

// risk heatmap (impact × likelihood with dominant level)
function riskHeatGrid(cells: any[] | undefined | null) {
  const grid: any[] = []
  for (let impact = 5; impact >= 1; impact--) {
    const row: any[] = []
    for (let likelihood = 1; likelihood <= 5; likelihood++) {
      const c = (cells ?? []).find((x) => x.impact === impact && x.likelihood === likelihood)
      row.push({
        impact,
        likelihood,
        count: c?.count ?? 0,
        level: c?.dominantLevel ?? null,
      })
    }
    grid.push(row)
  }
  return grid
}

// trend line chart (threat vs opportunity)
function polyline(rows: any[] | undefined | null, field: 'threat' | 'opportunity', w = 320, h = 110) {
  const list = rows ?? []
  if (list.length < 2) return ''
  const vals = list.map((r) => Number(r?.[field]) || 0)
  const max = Math.max(...vals, 1)
  const step = w / (list.length - 1)
  return list
    .map((r, i) => {
      const x = i * step
      const y = h - ((Number(r?.[field]) || 0) / max) * (h - 16) - 8
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}
function trendMax(rows: any[] | undefined | null) {
  const list = rows ?? []
  return Math.max(...list.flatMap((r) => [Number(r?.threat) || 0, Number(r?.opportunity) || 0]), 1)
}

// helpers for tables
function or(...vals: (string | number | null | undefined)[]) {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v
  }
  return '—'
}
/** درصد با نمایش «—» برای مقادیر ناموجود (برخلاف round1 که صفر برمی‌گرداند) */
function fmtPct(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return '—'
  return faNum(round1(v)) + '٪'
}
</script>

<template>
  <!-- ======================= FILTER / SETUP ======================= -->
  <div v-if="!reportGenerated" class="grc-report-root">
    <div class="report-setup">
      <div class="setup-card">
        <div class="setup-head">
          <span class="setup-badge risk">
            <Lucide icon="ShieldAlert" class="h-5 w-5" />
          </span>
          <div>
            <div class="setup-title">گزارش ریسک</div>
            <div class="setup-sub">بازه زمانی به‌روزرسانی را انتخاب کنید و سپس گزارش را تولید کنید</div>
          </div>
        </div>

        <Form
          class="block"
          :initial-values="{ updatedAtStart: dateFrom, updatedAtEnd: dateTo }"
          @submit="onSubmitFilter"
        >
          <template #default="{ values }">
            <div class="setup-field">
              <div class="setup-label">
                <Lucide icon="CalendarRange" class="h-3.5 w-3.5" />
                بازه به‌روزرسانی (اختیاری)
              </div>
              <BaseDateRangePicker
                name-from="updatedAtStart"
                name-to="updatedAtEnd"
                compact-label
                :label="'از تاریخ تا تاریخ'"
              />
              <p class="setup-hint">
                بدون انتخاب بازه، گزارش بر اساس همه ریسک‌ها تهیه می‌شود. بخش‌های «روند زمانی» و «نقشه حرارتی شدت»
                همواره بر اساس کل ریسک‌ها (۹۰ روز اخیر) محاسبه می‌شوند.
              </p>
            </div>

            <div class="setup-summary">
              <div class="setup-summary-row">
                <span class="ss-label">بازه</span>
                <span class="ss-value">{{
                  values.updatedAtStart || values.updatedAtEnd
                    ? `${faDate(String(values.updatedAtStart)) || '…'} ← ${faDate(String(values.updatedAtEnd)) || '…'}`
                    : 'همه ریسک‌ها'
                }}</span>
              </div>
              <div class="setup-summary-row">
                <span class="ss-label">نوع گزارش</span>
                <span class="ss-value">گزارش مبنا</span>
              </div>
            </div>

            <Button type="submit" variant="danger" class="w-full gap-2">
              <Lucide icon="Sparkles" class="h-4 w-4" />
              تولید گزارش
            </Button>
          </template>
        </Form>
      </div>
    </div>
  </div>

  <!-- ======================= REPORT ======================= -->
  <template v-else>
    <div v-if="loading" class="py-12 text-center">{{ 'در حال دریافت گزارش…' }}</div>
    <div v-else-if="error" class="py-12 text-center text-red-600">
      {{ error }}
      <div class="mt-3 flex items-center justify-center gap-2">
        <Button type="button" variant="outline-secondary" size="sm" @click="loadReport">تلاش مجدد</Button>
        <Button type="button" variant="outline-secondary" size="sm" @click="backToSettings">تغییر تنظیمات</Button>
      </div>
    </div>
    <div v-else-if="!data" class="py-12 text-center text-slate-400">
      داده‌ای برای گزارش موجود نیست.
      <div class="mt-3">
        <Button type="button" variant="outline-secondary" size="sm" @click="backToSettings">تغییر تنظیمات</Button>
      </div>
    </div>

    <div v-else class="grc-report-root" id="risk-report-root">
      <!-- ======================= TOOLBAR ======================= -->
      <div class="download-bar">
        <span class="download-note">گزارش ریسک · بازه: {{ dateFrom || dateTo ? `${faDate(dateFrom) || '…'} ← ${faDate(dateTo) || '…'}` : 'همه ریسک‌ها' }}</span>
        <span class="flex-1" />
        <Button type="button" variant="outline-secondary" class="gap-2" :disabled="isGenerating" @click="backToSettings">
          <Lucide icon="Settings2" class="h-4 w-4" />
          <span>تنظیمات گزارش</span>
        </Button>
        <Button type="button" variant="danger" class="gap-2" :disabled="isGenerating" @click="downloadPDF">
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
        </Button>
        <div v-if="isGenerating" class="progress-bar-wrap">
          <div class="progress-bar-fill" :style="{ width: progress + '%' }" />
        </div>
      </div>

      <!-- ======================= REPORT PAGES ======================= -->
      <div class="report-source" id="risk-report-source" aria-hidden="true">
        <!-- COVER -->
        <div class="page page-source page-cover risk">
          <div class="cover">
            <div class="cover-head">
              <div class="cover-logo">
                <Lucide icon="ShieldAlert" class="h-5 w-5" />
              </div>
              <div class="cover-brand">حاکمیت، ریسک و تطبیق (GRC)</div>
            </div>
            <div class="cover-mid">
              <div class="cover-title-fa">گزارش ریسک</div>
              <div class="cover-title-en">RISK REPORT</div>
              <div class="cover-period">
                بازه: {{ dateFrom || dateTo ? `${faDate(dateFrom) || '…'} ← ${faDate(dateTo) || '…'}` : 'همه ریسک‌ها' }}
              </div>
            </div>
            <div class="cover-stats">
              <div v-for="st in coverStats" :key="st.lbl" class="cover-stat">
                <div class="num">{{ st.num }}</div>
                <div class="lbl">{{ st.lbl }}</div>
              </div>
            </div>
            <div class="cover-foot">
              <span>محرمانه — جهت استفاده داخلی</span>
              <span>گزارش ریسک</span>
            </div>
          </div>
        </div>

        <!-- SECTIONS -->
        <div v-for="sec in sections" :key="sec.key" class="page page-source page-body">
          <div class="page-header risk">
            <div>
              <div class="page-section-title">{{ sec.title }}</div>
              <div class="page-section-sub">{{ sec.titleEn }} · بخش {{ faNum(sec.order) }}</div>
            </div>
            <div class="header-meta">
              <div class="hm-label">بخش</div>
              <div class="hm-value">{{ faNum(sec.order) }}</div>
            </div>
          </div>

          <div class="narrative-box">{{ sec.description }}</div>

          <!-- ============ executive-summary ============ -->
          <template v-if="sec.key === 'executive-summary'">
            <div class="kpi-grid">
              <div class="kpi-card risk">
                <div class="kpi-label">کل ریسک‌ها</div>
                <div class="kpi-value">{{ faNum(execTotal) }}</div>
              </div>
              <div v-for="lvl in LEVEL_ORDER" :key="lvl" class="kpi-card">
                <div class="kpi-label">{{ levelMeta(lvl).label }}</div>
                <div class="kpi-value" :style="{ color: levelMeta(lvl).color }">{{ faNum(countOf(execLevels, lvl)) }}</div>
              </div>
            </div>
            <div class="two-col" style="margin-top: 12px">
              <div class="dist-card">
                <div class="dist-title">توزیع بر اساس سطح ریسک</div>
                <div v-for="lvl in LEVEL_ORDER" :key="lvl" class="bar-row">
                  <span class="bar-label">{{ levelMeta(lvl).label }}</span>
                  <div class="bar-bg">
                    <div class="bar-fill" :style="{ width: barPct(countOf(execLevels, lvl), execTotal), background: levelMeta(lvl).color }" />
                  </div>
                  <span class="bar-count">{{ faNum(countOf(execLevels, lvl)) }}</span>
                </div>
              </div>
              <div class="dist-card">
                <div class="dist-title">وضعیت چرخه عمر</div>
                <div v-for="st in execStates" :key="st.state" class="bar-row">
                  <span class="bar-label">{{ stateMeta(st.state).label }}</span>
                  <div class="bar-bg">
                    <div class="bar-fill" :style="{ width: barPct(Number(st.count) || 0, execTotal), background: stateMeta(st.state).color }" />
                  </div>
                  <span class="bar-count">{{ faNum(Number(st.count) || 0) }}</span>
                </div>
              </div>
            </div>
            <div class="dist-card">
              <div class="dist-title">ماهیت ریسک (تهدید / فرصت)</div>
              <div v-for="ty in execTypes" :key="ty.riskType" class="bar-row">
                <span class="bar-label">{{ typeMeta(ty.riskType).label }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: barPct(Number(ty.count) || 0, execTotal), background: typeMeta(ty.riskType).color }" />
                </div>
                <span class="bar-count">{{ faNum(Number(ty.count) || 0) }}</span>
              </div>
            </div>
          </template>

          <!-- ============ framework-overview ============ -->
          <template v-else-if="sec.key === 'framework-overview'">
            <table class="rpt-table" style="margin-top: 12px">
              <thead>
                <tr>
                  <th style="width: 30%">چارچوب</th>
                  <th style="width: 14%">تعداد ریسک</th>
                  <th style="width: 12%">میانگین امتیاز</th>
                  <th style="width: 30%">سطح ریسک</th>
                  <th style="width: 14%">بیشترین</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in sec.data?.frameworkOverview ?? []" :key="idx" class="rpt-row">
                  <td>
                    <div class="rpt-title-main">{{ row.frameworkTitle ?? row.title ?? '—' }}</div>
                    <div class="rpt-title-sub">{{ row.frameworkSlug }}</div>
                  </td>
                  <td class="score-val">{{ faNum(Number(row.totalRisks) || 0) }}</td>
                  <td class="score-val">{{ fmtScore(row.avgScore) }}</td>
                  <td>
                    <div class="mini-bar" style="display: inline-block; vertical-align: middle">
                      <div
                        class="mini-bar-fill"
                        :style="{ width: barPct(countOf(row.byLevel, 'critical') + countOf(row.byLevel, 'high'), Number(row.totalRisks) || 1), background: '#dc2626' }"
                      />
                    </div>
                    <span class="muted" style="font-size: 9px; margin-right: 6px">
                      بحرانی {{ faNum(countOf(row.byLevel, 'critical')) }} · بالا {{ faNum(countOf(row.byLevel, 'high')) }}
                    </span>
                  </td>
                  <td class="score-val">{{ fmtScore(row.maxScore) }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- ============ framework-heatmap ============ -->
          <template v-else-if="sec.key === 'framework-heatmap'">
            <div class="heat-grid">
              <div v-for="fw in frameworkRows(sec.data?.frameworkHeatmap)" :key="fw.title" class="hg-row">
                <span class="hg-label" :title="fw.title">{{ fw.title }}</span>
                <div
                  v-for="lvl in ['critical', 'high', 'medium', 'low']"
                  :key="lvl"
                  class="hg-cell"
                  :style="{ background: hexToRgba(levelMeta(lvl).color, 0.25 + Math.min(fw.cells[lvl] ?? 0, 5) * 0.14) }"
                >
                  {{ faNum(fw.cells[lvl] ?? 0) }}
                </div>
              </div>
              <div class="legend">
                <span v-for="lvl in ['critical', 'high', 'medium', 'low']" :key="lvl">
                  <i :style="{ background: levelMeta(lvl).color }" />{{ levelMeta(lvl).label }}
                </span>
              </div>
            </div>
          </template>

          <!-- ============ high / low risk frameworks ============ -->
          <template v-else-if="sec.key === 'high-risk-frameworks' || sec.key === 'low-risk-frameworks'">
            <table class="rpt-table" style="margin-top: 12px">
              <thead>
                <tr>
                  <th style="width: 28%">چارچوب</th>
                  <th style="width: 34%">ریسک شاخص</th>
                  <th style="width: 14%">امتیاز</th>
                  <th style="width: 14%">سطح</th>
                  <th style="width: 10%">#</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in sec.data?.frameworkHighRisk ?? sec.data?.frameworkLowRisk ?? []"
                  :key="idx"
                  class="rpt-row"
                >
                  <td>
                    <div class="rpt-title-main">{{ row.frameworkTitle ?? '—' }}</div>
                    <div class="rpt-title-sub">{{ row.frameworkSlug }}</div>
                  </td>
                  <td>
                    <div class="rpt-title-main" style="font-size: 9.5px">{{ row.riskTitle ?? '—' }}</div>
                  </td>
                  <td class="score-val">{{ fmtScore(row.score) }}</td>
                  <td>
                    <span class="pill" :style="{ background: hexToRgba(levelMeta(row.level).color, 0.12), color: levelMeta(row.level).color }">
                      {{ levelMeta(row.level).label }}
                    </span>
                  </td>
                  <td class="muted">{{ faNum(idx + 1) }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- ============ top-risks ============ -->
          <template v-else-if="sec.key === 'top-risks'">
            <div v-for="grp in [
              { key: 'topAnalysis', title: 'ریسک‌های در حال تحلیل', color: '#0ea5e9' },
              { key: 'topResponse', title: 'ریسک‌های در حال پاسخ', color: '#f59e0b' },
              { key: 'topMonitoring', title: 'ریسک‌های در حال پایش', color: '#8b5cf6' },
            ]" :key="grp.key" class="dist-card" style="margin-top: 12px">
              <div class="dist-title" :style="{ borderRight: `3px solid ${grp.color}`, paddingRight: '8px' }">{{ grp.title }}</div>
              <table class="rpt-table">
                <thead>
                  <tr>
                    <th style="width: 34%">ریسک</th>
                    <th style="width: 12%">امتیاز</th>
                    <th style="width: 12%">سطح</th>
                    <th style="width: 12%">نوع</th>
                    <th style="width: 18%">چارچوب</th>
                    <th style="width: 12%">به‌روزرسانی</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in (sec.data?.topRisks?.[grp.key] ?? []).slice(0, 10)" :key="i" class="rpt-row">
                    <td>
                      <div class="rpt-title-main">{{ r.title ?? '—' }}</div>
                      <div class="rpt-title-sub">{{ r.slug }}</div>
                    </td>
                    <td class="score-val">{{ fmtScore(r.score) }}</td>
                    <td>
                      <span class="pill" :style="{ background: hexToRgba(levelMeta(r.level).color, 0.12), color: levelMeta(r.level).color }">
                        {{ levelMeta(r.level).label }}
                      </span>
                    </td>
                    <td>
                      <span class="pill" :style="{ background: hexToRgba(typeMeta(r.riskType).color, 0.12), color: typeMeta(r.riskType).color }">
                        {{ typeMeta(r.riskType).label }}
                      </span>
                    </td>
                    <td class="muted">{{ r.frameworkTitle ?? '—' }}</td>
                    <td class="muted">{{ faDate(r.updatedAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <!-- ============ risk-by-domain ============ -->
          <template v-else-if="sec.key === 'risk-by-domain'">
            <div v-for="(row, idx) in sec.data?.riskByDomain ?? []" :key="idx" class="dist-card" style="margin-top: 10px">
              <div class="dist-title" style="display: flex; justify-content: space-between">
                <span>{{ row.domainTitle ?? '—' }}</span>
                <span class="muted" style="font-size: 10px; font-weight: 600">{{ faNum(Number(row.totalRisks) || 0) }} ریسک</span>
              </div>
              <div v-for="lvl in ['critical', 'high', 'medium', 'low']" :key="lvl" class="bar-row">
                <span class="bar-label">{{ levelMeta(lvl).label }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: barPct(countOf(row.byLevel, lvl), Number(row.totalRisks) || 1), background: levelMeta(lvl).color }" />
                </div>
                <span class="bar-count">{{ faNum(countOf(row.byLevel, lvl)) }}</span>
              </div>
            </div>
          </template>

          <!-- ============ owner-distribution ============ -->
          <template v-else-if="sec.key === 'owner-distribution'">
            <table class="rpt-table" style="margin-top: 12px">
              <thead>
                <tr>
                  <th style="width: 30%">مالک ریسک</th>
                  <th style="width: 20%">تعداد ریسک</th>
                  <th style="width: 20%">میانگین امتیاز</th>
                  <th style="width: 30%">ریسک‌های پرخطر</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in sec.data?.ownerDistribution ?? []" :key="idx" class="rpt-row">
                  <td>
                    <div class="rpt-title-main">{{ row.ownerId ? `کارشناس ${faNum(Number(row.ownerId))}` : 'بدون مالک' }}</div>
                  </td>
                  <td class="score-val">{{ faNum(Number(row.totalRisks) || 0) }}</td>
                  <td class="score-val">{{ fmtScore(row.avgScore) }}</td>
                  <td>
                    <div class="mini-bar" style="display: inline-block; vertical-align: middle">
                      <div class="mini-bar-fill" :style="{ width: barPct(Number(row.highRiskCount) || 0, Number(row.totalRisks) || 1), background: '#dc2626' }" />
                    </div>
                    <span class="muted" style="font-size: 9px; margin-right: 6px">{{ faNum(Number(row.highRiskCount) || 0) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- ============ category-distribution ============ -->
          <template v-else-if="sec.key === 'category-distribution'">
            <div v-for="(row, idx) in sec.data?.categoryDistribution ?? []" :key="idx" class="dist-card" style="margin-top: 10px">
              <div class="dist-title" style="display: flex; justify-content: space-between">
                <span>{{ row.categoryTitle ?? '—' }}</span>
                <span class="muted" style="font-size: 10px; font-weight: 600">{{ faNum(Number(row.totalRisks) || 0) }} ریسک</span>
              </div>
              <div v-for="lvl in ['critical', 'high', 'medium', 'low']" :key="lvl" class="bar-row">
                <span class="bar-label">{{ levelMeta(lvl).label }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: barPct(countOf(row.byLevel, lvl), Number(row.totalRisks) || 1), background: levelMeta(lvl).color }" />
                </div>
                <span class="bar-count">{{ faNum(countOf(row.byLevel, lvl)) }}</span>
              </div>
            </div>
          </template>

          <!-- ============ score-distribution ============ -->
          <template v-else-if="sec.key === 'score-distribution'">
            <div class="dist-card" style="margin-top: 12px">
              <div class="dist-title">بازه‌بندی امتیاز ریسک</div>
              <div v-for="(row, idx) in sec.data?.scoreDistribution ?? []" :key="idx" class="bar-row">
                <span class="bar-label">{{ row.range ?? '—' }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: barPct(Number(row.count) || 0, maxCount((sec.data?.scoreDistribution ?? []).map((x: any) => Number(x.count) || 0))), background: '#1a4470' }" />
                </div>
                <span class="bar-count">{{ faNum(Number(row.count) || 0) }}</span>
              </div>
            </div>
          </template>

          <!-- ============ risk-matrix ============ -->
          <template v-else-if="sec.key === 'risk-matrix'">
            <div class="matrix-grid">
              <div v-for="(row, ri) in matrixGrid(sec.data?.riskMatrix)" :key="ri" class="mx-row">
                <span class="mx-label">اثر {{ faNum(row[0]?.impact) }}</span>
                <div
                  v-for="cell in row"
                  :key="cell.likelihood"
                  class="mx-cell"
                  :style="{ background: matrixColor(cell.impact, cell.likelihood), opacity: cell.count ? 1 : 0.28 }"
                >
                  {{ faNum(cell.count) }}
                  <small>احتمال {{ faNum(cell.likelihood) }}</small>
                </div>
              </div>
              <div class="legend">
                <span><i style="background: #16a34a" />کم</span>
                <span><i style="background: #f59e0b" />متوسط</span>
                <span><i style="background: #f97316" />بالا</span>
                <span><i style="background: #dc2626" />بحرانی</span>
              </div>
            </div>
          </template>

          <!-- ============ trend-over-time ============ -->
          <template v-else-if="sec.key === 'trend-over-time'">
            <div class="trend-chart">
              <svg viewBox="0 0 320 110">
                <line v-for="y in [1, 2, 3, 4]" :key="y" x1="0" :y1="y * 24" x2="320" :y2="y * 24" stroke="#EEF2F6" stroke-width="1" />
                <polyline :points="polyline(sec.data?.trendOverTime, 'threat')" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                <polyline :points="polyline(sec.data?.trendOverTime, 'opportunity')" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <div class="legend-trend">
                <span><i style="background: #dc2626" />تهدید</span>
                <span><i style="background: #16a34a" />فرصت</span>
                <span class="muted" style="font-size: 9px">
                  حداکثر: {{ faNum(round1(trendMax(sec.data?.trendOverTime))) }} · آخرین ۹۰ روز
                </span>
              </div>
            </div>
          </template>

          <!-- ============ risk-heatmap ============ -->
          <template v-else-if="sec.key === 'risk-heatmap'">
            <div class="matrix-grid">
              <div v-for="(row, ri) in riskHeatGrid(sec.data?.riskHeatmap)" :key="ri" class="mx-row">
                <span class="mx-label">اثر {{ faNum(row[0]?.impact) }}</span>
                <div
                  v-for="cell in row"
                  :key="cell.likelihood"
                  class="mx-cell"
                  :style="{ background: cell.count ? levelMeta(cell.level).color : 'transparent', border: cell.count ? 'none' : '1px dashed #E2E8F0', color: cell.count ? '#fff' : '#CBD5E1' }"
                >
                  {{ faNum(cell.count) }}
                  <small>{{ cell.level ? levelMeta(cell.level).label : '—' }}</small>
                </div>
              </div>
            </div>
          </template>

          <!-- ============ recent-activity ============ -->
          <template v-else-if="sec.key === 'recent-activity'">
            <table class="rpt-table" style="margin-top: 12px">
              <thead>
                <tr>
                  <th style="width: 32%">ریسک</th>
                  <th style="width: 12%">سطح</th>
                  <th style="width: 12%">نوع</th>
                  <th style="width: 14%">امتیاز</th>
                  <th style="width: 18%">چارچوب</th>
                  <th style="width: 12%">به‌روزرسانی</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in sec.data?.recentActivity ?? []" :key="idx" class="rpt-row">
                  <td>
                    <div class="rpt-title-main">{{ r.title ?? '—' }}</div>
                    <div class="rpt-title-sub">{{ or(r.categoryTitle, r.domainTitle) }}</div>
                  </td>
                  <td>
                    <span class="pill" :style="{ background: hexToRgba(levelMeta(r.level).color, 0.12), color: levelMeta(r.level).color }">
                      {{ levelMeta(r.level).label }}
                    </span>
                  </td>
                  <td>
                    <span class="pill" :style="{ background: hexToRgba(typeMeta(r.riskType).color, 0.12), color: typeMeta(r.riskType).color }">
                      {{ typeMeta(r.riskType).label }}
                    </span>
                  </td>
                  <td class="score-val">{{ fmtScore(r.score) }}</td>
                  <td class="muted">{{ r.frameworkTitle ?? '—' }}</td>
                  <td class="muted">{{ faDate(r.updatedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- ============ outlook / narrative-only ============ -->
          <template v-else>
            <div class="narrative-page">
              <div class="quote-mark">"</div>
              <p class="narrative-long">{{ sec.description }}</p>
            </div>
          </template>

          <div class="page-num" />
        </div>
      </div>

      <!-- paginated A4 output (filled by buildPages) -->
      <div class="report-wrapper" id="risk-report-wrapper" />
    </div>
  </template>
</template>
