<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Lucide from '@/base-components/Lucide'
import Button from '@/base-components/Button'
import PeriodSelectPanel from '@/components/PeriodSelectPanel.vue'
import { maturityRepo } from '@/core/repositories/maturityRepo'
import { useReportPagination, faNum, fmtScore, barPct, hexToRgba } from '@/composables/useReportPagination'
import { levelColor, levelLabelKey } from '../levels'
import '@/styles/grc-report.css'

// ---------------------------------------------------------------------------
// state + data fetching (same setup → document flow as risk/compliance reports)
// ---------------------------------------------------------------------------
const { t } = useI18n()

const data = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const reportGenerated = ref(false)

const reportTypes = ['executive', 'capital', 'domain', 'capability', 'comparison'] as const
const reportType = ref<(typeof reportTypes)[number]>('executive')

interface SelectedPeriod {
  type: string
  startDate: string
  endDate: string
}
const selectedPeriod = ref<SelectedPeriod | null>(null)

const { isGenerating, progress, buildPages, downloadPDF } = useReportPagination({
  wrapperId: 'maturity-report-wrapper',
  sourceId: 'maturity-report-source',
  fileName: () => {
    const year = selectedPeriod.value?.startDate.slice(0, 4)
    return `گزارش-بلوغ${year ? `-${year}` : ''}.pdf`
  },
})

function typeKey(tp: string) {
  return `maturity.type-${tp}`
}

const periodLabel = computed(() => {
  const p = selectedPeriod.value
  if (!p) return ''
  return `${t('reports.period-type.yearly')} · ${p.startDate.slice(0, 4)}`
})

async function loadReport() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, unknown> = {
      period_type: selectedPeriod.value?.type ?? 'YEARLY',
      date_from: selectedPeriod.value?.startDate ?? undefined,
      date_to: selectedPeriod.value?.endDate ?? undefined,
    }
    const res = await maturityRepo.report(reportType.value, params)
    data.value = res?.data ?? null
  } catch (e) {
    console.error(e)
    error.value = (e as Error)?.message || t('maturity.report-error-fetch')
  } finally {
    loading.value = false
    await nextTick()
    buildPages()
    // Re-measure once webfonts are ready so the A4 page splits are stable
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => buildPages())
    }
  }
}

function generateReport() {
  if (!selectedPeriod.value) return
  reportGenerated.value = true
  loadReport()
}

function backToSettings() {
  reportGenerated.value = false
  data.value = null
  window.scrollTo({ top: 0 })
}

// ---------------------------------------------------------------------------
// year quick-select strip (same UX as the sustainability report)
// ---------------------------------------------------------------------------
const yearStripRef = ref<HTMLElement | null>(null)
const currentYear = () => new Date().getFullYear()

const yearOptions = computed<number[]>(() => {
  const base = selectedPeriod.value ? Number(selectedPeriod.value.startDate.slice(0, 4)) : currentYear() - 1
  const min = Math.min(2015, base)
  const max = Math.max(currentYear() + 1, base)
  const years: number[] = []
  for (let y = min; y <= max; y++) years.push(y)
  return years
})

function scrollYears(direction: number) {
  yearStripRef.value?.scrollBy({ left: direction * 220, behavior: 'smooth' })
}

function isQuickYearActive(year: number): boolean {
  const p = selectedPeriod.value
  return !!p && Number(p.startDate.slice(0, 4)) === year
}

function quickSelectYear(year: number) {
  selectedPeriod.value = { type: 'YEARLY', startDate: `${year}-01-01`, endDate: `${year}-12-31` }
}

// keep the active year chip visible in the scrollable strip
watch(
  () => selectedPeriod.value?.startDate,
  () => {
    void nextTick(() => {
      yearStripRef.value
        ?.querySelector('[data-active="true"]')
        ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    })
  },
)

// ---------------------------------------------------------------------------
// derived data
// ---------------------------------------------------------------------------
const report = computed(() => data.value ?? null)
const canGenerate = computed(() => !!selectedPeriod.value)

/** Total assessed capabilities — the report slices some lists, so use the longest one available. */
const assessedCount = computed(() =>
  Math.max(
    (report.value?.capabilitySummary ?? []).length,
    (report.value?.gapAnalysis ?? []).length,
    (report.value?.improvementPriority ?? []).length,
  ),
)

const pageGroups = computed<{ type: string; key: string }[]>(() => {
  const r = report.value
  if (!r) return []
  const groups: { type: string; key: string }[] = [
    { type: 'cover', key: 'cover' },
    { type: 'exec', key: 'exec' },
  ]
  if ((r.capitalSummary ?? []).length) groups.push({ type: 'capital', key: 'capital' })
  if ((r.domainMaturity ?? []).length) groups.push({ type: 'domain', key: 'domain' })
  if ((r.capabilitySummary ?? []).length) groups.push({ type: 'capability', key: 'capability' })
  if ((r.distribution ?? []).length || (r.trend ?? []).length) groups.push({ type: 'dist-trend', key: 'dist-trend' })
  return groups
})

const coverStats = computed(() => [
  { num: fmtScore(report.value?.overallScore) + '٪', lbl: t('maturity.overall-score') },
  { num: 'L' + faNum(report.value?.overallMaturityLevel), lbl: t('maturity.overall-level') },
  { num: faNum(assessedCount.value), lbl: t('maturity.assessed-capabilities') },
  { num: faNum((report.value?.capitalSummary ?? []).length), lbl: t('maturity.evaluated-capitals') },
])

const execStrengths = computed(() => (report.value?.keyStrengths ?? []).slice(0, 10))
const execGaps = computed(() => (report.value?.majorGaps ?? []).slice(0, 10))
const execPriorities = computed(() => (report.value?.improvementPriorities ?? []).slice(0, 10))
const improvementRows = computed(() => (report.value?.improvementPriority ?? []).slice(0, 15))

const distributionRows = computed(() =>
  (report.value?.distribution ?? []).slice().sort((a: any, b: any) => a.level - b.level),
)
const distTotal = computed(() =>
  distributionRows.value.reduce((acc: number, x: any) => acc + (Number(x.count) || 0), 0),
)

function levelLabel(l: number) {
  return t(levelLabelKey(l))
}

function priorityTone(p: string) {
  if (p === 'high') return { background: hexToRgba('#dc2626', 0.12), color: '#dc2626' }
  if (p === 'medium') return { background: hexToRgba('#d97706', 0.12), color: '#d97706' }
  return { background: hexToRgba('#16a34a', 0.12), color: '#16a34a' }
}
function priorityKey(p: string) {
  return p === 'high' ? 'maturity.priority-high' : p === 'medium' ? 'maturity.priority-medium' : 'maturity.priority-low'
}

/** ارقام فارسی بدون جداکننده هزارگان (برای نمایش سال) */
function yearFa(v: string | number | null | undefined): string {
  if (v == null) return '—'
  return String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}
</script>

<template>
  <!-- ======================= FILTER / SETUP ======================= -->
  <div v-if="!reportGenerated" class="grc-report-root">
    <div class="report-setup">
      <div class="setup-card">
        <div class="setup-head">
          <span class="setup-badge">
            <Lucide icon="TrendingUp" class="h-5 w-5" />
          </span>
          <div>
            <div class="setup-title">{{ t('maturity.report-title') }}</div>
            <div class="setup-sub">{{ t('maturity.report-subtitle') }}</div>
          </div>
        </div>

        <!-- report type -->
        <div class="setup-field">
          <div class="setup-label">
            <Lucide icon="Layers" class="h-3.5 w-3.5" />
            {{ t('maturity.report-type') }}
          </div>
          <div class="seg seg-wide">
            <button
              v-for="tp in reportTypes"
              :key="tp"
              type="button"
              :class="{ active: reportType === tp }"
              @click="reportType = tp"
            >
              {{ t(typeKey(tp)) }}
            </button>
          </div>
          <p class="setup-hint">{{ t('maturity.report-hint') }}</p>
        </div>

        <!-- period -->
        <div class="setup-field">
          <div class="setup-label">
            <Lucide icon="CalendarRange" class="h-3.5 w-3.5" />
            {{ t('maturity.report-period-label') }}
          </div>
          <div class="mb-2 flex items-center gap-1">
            <button type="button" class="year-nav" title="سال قبل" @click="scrollYears(-1)">
              <Lucide icon="ChevronRight" class="h-3.5 w-3.5" />
            </button>
            <div ref="yearStripRef" class="year-strip">
              <button
                v-for="y in yearOptions"
                :key="y"
                type="button"
                :data-active="isQuickYearActive(y)"
                class="year-chip"
                :class="{ active: isQuickYearActive(y) }"
                @click="quickSelectYear(y)"
              >{{ y }}</button>
            </div>
            <button type="button" class="year-nav" title="سال بعد" @click="scrollYears(1)">
              <Lucide icon="ChevronLeft" class="h-3.5 w-3.5" />
            </button>
          </div>
          <PeriodSelectPanel
            v-model="selectedPeriod"
            :label="periodLabel"
            :placeholder="t('maturity.report-period-label')"
            :types="['YEARLY']"
          />
        </div>

        <!-- summary + generate -->
        <div class="setup-summary">
          <div class="setup-summary-row">
            <span class="ss-label">{{ t('maturity.report-summary-type') }}</span>
            <span class="ss-value">{{ t(typeKey(reportType)) }}</span>
            <span class="ss-type">{{ t('reports.period-type.yearly') }}</span>
          </div>
          <div class="setup-summary-row">
            <span class="ss-label">{{ t('maturity.report-summary-period') }}</span>
            <span class="ss-value">{{ periodLabel || '—' }}</span>
          </div>
        </div>

        <button type="button" class="setup-generate" :disabled="!canGenerate" @click="generateReport">
          <Lucide icon="Wand2" class="h-4 w-4" />
          {{ t('maturity.generate') }}
        </button>
        <p v-if="!selectedPeriod" class="setup-error center">{{ t('maturity.report-period-required') }}</p>
      </div>
    </div>
  </div>

  <!-- ======================= REPORT ======================= -->
  <template v-else>
    <div v-if="loading" class="py-12 text-center">{{ t('maturity.report-loading') }}</div>
    <div v-else-if="error" class="py-12 text-center text-red-600">
      {{ error }}
      <div class="mt-3 flex items-center justify-center gap-2">
        <Button type="button" variant="outline-secondary" size="sm" @click="loadReport">{{ t('maturity.report-retry') }}</Button>
        <Button type="button" variant="outline-secondary" size="sm" @click="backToSettings">{{ t('maturity.report-change-settings') }}</Button>
      </div>
    </div>
    <div v-else-if="!data" class="py-12 text-center text-slate-400">
      {{ t('maturity.report-no-data') }}
      <div class="mt-3">
        <Button type="button" variant="outline-secondary" size="sm" @click="backToSettings">{{ t('maturity.report-change-settings') }}</Button>
      </div>
    </div>

    <div v-else class="grc-report-root" id="maturity-report-root">
      <!-- ======================= TOOLBAR ======================= -->
      <div class="download-bar">
        <span class="download-note">{{ t('maturity.report-title') }} · {{ t(typeKey(reportType)) }} · {{ periodLabel }}</span>
        <span class="flex-1" />
        <button type="button" class="download-btn secondary" :disabled="isGenerating" @click="backToSettings">
          <Lucide icon="Settings2" class="h-4 w-4" />
          <span>{{ t('maturity.report-settings') }}</span>
        </button>
        <button type="button" class="download-btn" :disabled="isGenerating" @click="downloadPDF">
          <Lucide v-if="!isGenerating" icon="Download" class="h-4 w-4" />
          <Lucide v-else icon="Loader2" class="spin h-4 w-4" />
          <span v-if="!isGenerating">{{ t('maturity.report-download') }}</span>
          <span v-else>{{ t('maturity.report-downloading') }}... {{ progress }}%</span>
        </button>
        <div v-if="isGenerating" class="progress-bar-wrap">
          <div class="progress-bar-fill" :style="{ width: progress + '%' }" />
        </div>
      </div>

      <!-- ======================= REPORT PAGES ======================= -->
      <!-- hidden layout source; buildPages() measures it and splits each page
           into exact-A4 pages inside #maturity-report-wrapper -->
      <div class="report-source" id="maturity-report-source" aria-hidden="true">
        <div
          v-for="(pg, i) in pageGroups"
          :key="pg.key"
          class="page page-source"
          :class="pg.type === 'cover' ? 'page-cover maturity' : 'page-body'"
        >
          <!-- ================= COVER ================= -->
          <template v-if="pg.type === 'cover'">
            <div class="cover">
              <div class="cover-head">
                <div class="cover-logo">
                  <Lucide icon="TrendingUp" class="h-5 w-5" />
                </div>
                <div class="cover-brand">{{ t('maturity.report-cover-brand') }}</div>
              </div>
              <div class="cover-mid">
                <div class="cover-title-fa">{{ t('maturity.report-title') }}</div>
                <div class="cover-title-en" dir="ltr">{{ t('maturity.report-cover-en') }}</div>
                <div class="cover-period">{{ t('maturity.report-period-label') }}: {{ periodLabel }}</div>
              </div>
              <div class="cover-stats">
                <div v-for="st in coverStats" :key="st.lbl" class="cover-stat">
                  <div class="num">{{ st.num }}</div>
                  <div class="lbl">{{ st.lbl }}</div>
                </div>
              </div>
              <div class="cover-foot">
                <span>{{ t('maturity.report-confidential') }}</span>
                <span>{{ t('maturity.report-title') }}</span>
              </div>
            </div>
          </template>

          <!-- ================= EXECUTIVE SUMMARY ================= -->
          <template v-else-if="pg.type === 'exec'">
            <div class="page-header">
              <div>
                <div class="page-section-title">{{ t('maturity.report-exec-title') }}</div>
                <div class="page-section-sub" dir="ltr">{{ t('maturity.report-exec-en') }} · {{ t('maturity.report-section') }} {{ faNum(i) }}</div>
              </div>
              <div class="header-meta">
                <div class="hm-label">{{ t('maturity.period') }}</div>
                <div class="hm-value">{{ periodLabel }}</div>
              </div>
            </div>

            <div class="narrative-box">{{ t('maturity.report-subtitle') }}</div>

            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-label">{{ t('maturity.overall-score') }}</div>
                <div class="kpi-value">{{ fmtScore(report.overallScore) }}٪</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">{{ t('maturity.overall-level') }}</div>
                <div class="kpi-value">L{{ faNum(report.overallMaturityLevel) }}</div>
                <div class="kpi-sub">{{ levelLabel(report.overallMaturityLevel) }}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">{{ t('maturity.assessed-capabilities') }}</div>
                <div class="kpi-value">{{ faNum(assessedCount) }}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">{{ t('maturity.evaluated-capitals') }}</div>
                <div class="kpi-value">{{ faNum((report.capitalSummary ?? []).length) }}</div>
              </div>
            </div>

            <div v-if="execStrengths.length" class="dist-card" style="margin-top: 12px">
              <div class="dist-title" style="display: flex; align-items: center; gap: 6px">
                <Lucide icon="CheckCircle2" class="h-3.5 w-3.5" style="color: #16a34a" />
                {{ t('maturity.key-strengths') }}
              </div>
              <div v-for="(s, idx) in execStrengths" :key="idx" class="bar-row" style="align-items: flex-start; margin-bottom: 4px">
                <span class="bar-label" style="width: 16px; color: #16a34a; margin-top: 1px">
                  <Lucide icon="CheckCircle2" class="h-3 w-3" />
                </span>
                <span style="flex: 1; font-size: 10.5px; color: #334155; line-height: 1.9">{{ s }}</span>
              </div>
            </div>

            <div v-if="execGaps.length" class="dist-card" style="margin-top: 12px">
              <div class="dist-title" style="display: flex; align-items: center; gap: 6px">
                <Lucide icon="AlertTriangle" class="h-3.5 w-3.5" style="color: #dc2626" />
                {{ t('maturity.major-gaps') }}
              </div>
              <div v-for="(g, idx) in execGaps" :key="idx" class="bar-row" style="align-items: flex-start; margin-bottom: 4px">
                <span class="bar-label" style="width: 16px; color: #dc2626; margin-top: 1px">
                  <Lucide icon="AlertTriangle" class="h-3 w-3" />
                </span>
                <span style="flex: 1; font-size: 10.5px; color: #b91c1c; line-height: 1.9">{{ g }}</span>
              </div>
            </div>

            <div v-if="execPriorities.length" class="dist-card" style="margin-top: 12px">
              <div class="dist-title" style="display: flex; align-items: center; gap: 6px">
                <Lucide icon="Target" class="h-3.5 w-3.5" style="color: #d97706" />
                {{ t('maturity.improvement-priorities') }}
              </div>
              <div v-for="(p, idx) in execPriorities" :key="idx" class="bar-row" style="align-items: flex-start; margin-bottom: 4px">
                <span class="bar-label" style="width: 16px; color: #d97706; margin-top: 1px">
                  <Lucide icon="Target" class="h-3 w-3" />
                </span>
                <span style="flex: 1; font-size: 10.5px; color: #334155; line-height: 1.9">{{ p }}</span>
              </div>
            </div>

            <div class="page-num" />
          </template>

          <!-- ================= CAPITAL MATURITY ================= -->
          <template v-else-if="pg.type === 'capital'">
            <div class="page-header">
              <div>
                <div class="page-section-title">{{ t('maturity.capital-maturity') }}</div>
                <div class="page-section-sub" dir="ltr">{{ t('maturity.capital-maturity-sub') }} · {{ t('maturity.report-section') }} {{ faNum(i) }}</div>
              </div>
              <div class="header-meta">
                <div class="hm-label">{{ t('maturity.period') }}</div>
                <div class="hm-value">{{ periodLabel }}</div>
              </div>
            </div>

            <div class="narrative-box">{{ t('maturity.capital-maturity-sub') }}</div>

            <div class="dist-card" style="margin-top: 12px">
              <div v-for="c in report.capitalSummary" :key="c.capitalSlug" class="bar-row">
                <span class="bar-label">{{ c.capitalTitle }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: barPct(c.score, 100), background: levelColor(c.maturityLevel) }" />
                </div>
                <span class="bar-count">{{ fmtScore(c.score) }}</span>
                <span class="pill" :style="{ background: hexToRgba(levelColor(c.maturityLevel), 0.12), color: levelColor(c.maturityLevel) }">
                  L{{ faNum(c.maturityLevel) }}
                </span>
              </div>
            </div>

            <div class="page-num" />
          </template>

          <!-- ================= DOMAIN MATURITY ================= -->
          <template v-else-if="pg.type === 'domain'">
            <div class="page-header">
              <div>
                <div class="page-section-title">{{ t('maturity.domain-maturity') }}</div>
                <div class="page-section-sub" dir="ltr">{{ t('maturity.domain-maturity-sub') }} · {{ t('maturity.report-section') }} {{ faNum(i) }}</div>
              </div>
              <div class="header-meta">
                <div class="hm-label">{{ t('maturity.period') }}</div>
                <div class="hm-value">{{ periodLabel }}</div>
              </div>
            </div>

            <div class="narrative-box">{{ t('maturity.domain-maturity-sub') }}</div>

            <div class="dist-card" style="margin-top: 12px">
              <div v-for="d in report.domainMaturity" :key="d.domainSlug" class="bar-row">
                <span class="bar-label" :title="d.domainTitle">{{ d.domainTitle }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: barPct(d.score, 100), background: levelColor(d.maturityLevel) }" />
                </div>
                <span class="bar-count">{{ fmtScore(d.score) }}</span>
                <span class="pill" :style="{ background: hexToRgba(levelColor(d.maturityLevel), 0.12), color: levelColor(d.maturityLevel) }">
                  L{{ faNum(d.maturityLevel) }}
                </span>
              </div>
            </div>

            <div class="page-num" />
          </template>

          <!-- ================= CAPABILITY SUMMARY ================= -->
          <template v-else-if="pg.type === 'capability'">
            <div class="page-header">
              <div>
                <div class="page-section-title">{{ t('maturity.capability-summary') }}</div>
                <div class="page-section-sub" dir="ltr">{{ t('maturity.capability-summary-sub') }} · {{ t('maturity.report-section') }} {{ faNum(i) }}</div>
              </div>
              <div class="header-meta">
                <div class="hm-label">{{ t('maturity.period') }}</div>
                <div class="hm-value">{{ periodLabel }}</div>
              </div>
            </div>

            <div class="narrative-box">{{ t('maturity.capability-summary-sub') }}</div>

            <table class="rpt-table" style="margin-top: 12px">
              <thead>
                <tr>
                  <th style="width: 30%">{{ t('maturity.col-capability') }}</th>
                  <th style="width: 24%">{{ t('maturity.col-domain') }}</th>
                  <th style="width: 14%">{{ t('maturity.col-score') }}</th>
                  <th style="width: 16%">{{ t('maturity.col-level') }}</th>
                  <th style="width: 16%">{{ t('maturity.col-gap') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in report.capabilitySummary" :key="c.capabilitySlug" class="rpt-row">
                  <td>
                    <div class="rpt-title-main">{{ c.capabilityTitle }}</div>
                    <div class="rpt-title-sub">{{ c.capabilitySlug }}</div>
                  </td>
                  <td class="muted">{{ c.domainSlug }}</td>
                  <td class="score-val">{{ fmtScore(c.score) }}٪</td>
                  <td>
                    <span class="pill" :style="{ background: hexToRgba(levelColor(c.maturityLevel), 0.12), color: levelColor(c.maturityLevel) }">
                      L{{ faNum(c.maturityLevel) }}
                    </span>
                  </td>
                  <td>
                    <span v-if="c.gap > 0" class="score-val" style="color: #dc2626">-{{ faNum(c.gap) }}</span>
                    <span v-else class="muted">—</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="improvementRows.length" class="dist-card" style="margin-top: 12px">
              <div class="dist-title">{{ t('maturity.improvement-priorities') }}</div>
              <div v-for="p in improvementRows" :key="p.capabilitySlug" class="bar-row" style="align-items: flex-start; margin-bottom: 5px">
                <span style="flex: 1; font-size: 10.5px; color: #334155; line-height: 1.9">{{ p.capabilityTitle }}</span>
                <span class="pill" :style="priorityTone(p.priority)">{{ t(priorityKey(p.priority)) }}</span>
                <span class="score-val" style="width: 44px; text-align: left; color: #dc2626">-{{ faNum(p.gap) }}</span>
              </div>
            </div>

            <div class="page-num" />
          </template>

          <!-- ================= DISTRIBUTION + TREND ================= -->
          <template v-else-if="pg.type === 'dist-trend'">
            <div class="page-header">
              <div>
                <div class="page-section-title">{{ t('maturity.distribution') }}</div>
                <div class="page-section-sub" dir="ltr">{{ t('maturity.distribution-sub') }} · {{ t('maturity.report-section') }} {{ faNum(i) }}</div>
              </div>
              <div class="header-meta">
                <div class="hm-label">{{ t('maturity.period') }}</div>
                <div class="hm-value">{{ periodLabel }}</div>
              </div>
            </div>

            <div class="narrative-box">{{ t('maturity.distribution-sub') }}</div>

            <div v-if="distributionRows.length" class="dist-card" style="margin-top: 12px">
              <div class="dist-title">{{ t('maturity.distribution') }}</div>
              <div v-for="row in distributionRows" :key="row.level" class="bar-row">
                <span class="bar-label">
                  <i class="inline-block h-2 w-2 rounded" :style="{ background: levelColor(row.level) }" />
                  {{ levelLabel(row.level) }}
                </span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: barPct(Number(row.count) || 0, distTotal), background: levelColor(row.level) }" />
                </div>
                <span class="bar-count">{{ faNum(Number(row.count) || 0) }}</span>
                <span class="bar-pct" style="width: 48px; text-align: left">
                  {{ faNum(Math.round(((Number(row.count) || 0) / Math.max(distTotal, 1)) * 100)) }}٪
                </span>
              </div>
            </div>

            <div v-if="(report.trend ?? []).length" class="dist-card" style="margin-top: 12px">
              <div class="dist-title">{{ t('maturity.trend') }}</div>
              <div v-for="(tr, idx) in report.trend" :key="idx" class="bar-row">
                <span class="bar-label">{{ yearFa(tr.period) }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: barPct(tr.score, 100), background: levelColor(tr.maturityLevel) }" />
                </div>
                <span class="bar-count">{{ fmtScore(tr.score) }}</span>
                <span class="pill" :style="{ background: hexToRgba(levelColor(tr.maturityLevel), 0.12), color: levelColor(tr.maturityLevel) }">
                  L{{ faNum(tr.maturityLevel) }}
                </span>
              </div>
            </div>

            <div class="page-num" />
          </template>
        </div>
      </div>

      <!-- paginated A4 output (filled by buildPages) -->
      <div class="report-wrapper" id="maturity-report-wrapper" />
    </div>
  </template>
</template>

<style>
/* maturity-specific cover gradient — distinct from risk (sky) / compliance (teal) */
.grc-report-root .page-cover.maturity {
  background: linear-gradient(160deg, #312e81 0%, #4f46e5 42%, #818cf8 100%);
}

/* setup: make the 5 type buttons share the row evenly */
.grc-report-root .seg-wide button { flex: 1; }

/* year quick-select strip (same UX as the sustainability report) */
.grc-report-root .year-strip {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  padding: 2px 0;
  scrollbar-width: thin;
}
.grc-report-root .year-chip {
  flex: none;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 4px 11px;
  font-size: 11px;
  color: #64748b;
  transition: all 0.15s;
}
.grc-report-root .year-chip:hover { background: #f8fafc; }
.grc-report-root .year-chip.active {
  border-color: rgb(var(--color-primary) / 0.4);
  background: rgb(var(--color-primary-muted));
  color: rgb(var(--color-primary));
  font-weight: 700;
}
.grc-report-root .year-nav {
  display: inline-flex;
  height: 28px;
  width: 24px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #94a3b8;
  transition: all 0.15s;
}
.grc-report-root .year-nav:hover { background: #f8fafc; color: #475569; }
</style>
