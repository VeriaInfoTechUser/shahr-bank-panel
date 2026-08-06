<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import Lucide from '@/base-components/Lucide'
import { grcRepo } from '@/core/repositories/grcRepo'
import { useReportPagination, faNum, fmtScore, round1, barPct, maxCount, pctWidth, hexToRgba, faDate } from '@/composables/useReportPagination'
import '@/styles/grc-report.css'

// ---------------------------------------------------------------------------
// state + data fetching
// ---------------------------------------------------------------------------
const data = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const reportGenerated = ref(false)

// filter panel state — plan selection (comma-separated slugs, like the dashboard)
const plans = ref<any[]>([])
const selectedPlans = ref<string[]>([])
const planLoading = ref(false)

const { isGenerating, progress, buildPages, downloadPDF } = useReportPagination({
  wrapperId: 'compliance-report-wrapper',
  sourceId: 'compliance-report-source',
  fileName: () => {
    const suffix = selectedPlans.value.length ? `-${selectedPlans.value.length}برنامه` : ''
    return `گزارش-تطبیق${suffix}.pdf`
  },
})

const sections = computed(() => data.value?.sections ?? [])

function byKey(key: string) {
  return sections.value.find((s: any) => s.key === key)
}

async function loadPlans() {
  planLoading.value = true
  try {
    const res = await grcRepo.planList({ limit: 200 })
    plans.value = (res?.data as any)?.list ?? []
  } catch (e) {
    console.warn('Failed to load plans:', e)
  } finally {
    planLoading.value = false
  }
}
loadPlans()

async function loadReport() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, unknown> = { reportType: 'baseline' }
    if (selectedPlans.value.length) params.planSlug = selectedPlans.value.join(',')
    const res = await grcRepo.complianceReportSections(params)
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

function togglePlan(slug: string) {
  const i = selectedPlans.value.indexOf(slug)
  if (i >= 0) selectedPlans.value.splice(i, 1)
  else selectedPlans.value.push(slug)
}

function generateReport() {
  reportGenerated.value = true
  loadReport()
}

function backToSettings() {
  reportGenerated.value = false
  data.value = null
  window.scrollTo({ top: 0 })
}

// ---------------------------------------------------------------------------
// labels + colors
// ---------------------------------------------------------------------------
const ANSWER_META: Record<string, { label: string; color: string }> = {
  compliant: { label: 'منطبق', color: '#16a34a' },
  partially_compliant: { label: 'نسبتاً منطبق', color: '#f59e0b' },
  non_compliant: { label: 'نامنطبق', color: '#dc2626' },
  not_started: { label: 'شروع‌نشده', color: '#94a3b8' },
  unknown: { label: 'نامشخص', color: '#94a3b8' },
}
const STATE_META: Record<string, { label: string; color: string }> = {
  todo: { label: 'در صف', color: '#94a3b8' },
  in_progress: { label: 'در حال انجام', color: '#0ea5e9' },
  done: { label: 'انجام‌شده', color: '#16a34a' },
  approved: { label: 'تأییدشده', color: '#6366f1' },
  rejected: { label: 'ردشده', color: '#dc2626' },
  unknown: { label: 'نامشخص', color: '#94a3b8' },
}
const ANSWER_ORDER = ['compliant', 'partially_compliant', 'non_compliant', 'not_started']
const STATE_ORDER = ['todo', 'in_progress', 'done', 'approved', 'rejected']

function answerMeta(k?: string | null) {
  return ANSWER_META[k ?? 'unknown'] ?? ANSWER_META.unknown
}
function stateMeta(k?: string | null) {
  return STATE_META[k ?? 'unknown'] ?? STATE_META.unknown
}

function countOf(list: any[] | undefined | null, key: string) {
  return (list ?? []).find((x) => x.answer === key || x.state === key)?.count ?? 0
}

// ---------------------------------------------------------------------------
// per-section data accessors
// ---------------------------------------------------------------------------
const execSection = computed(() => byKey('executive-summary'))
const execSummary = computed(() => execSection.value?.data?.summary ?? null)
const execTotalTasks = computed(() => Number(execSummary.value?.totalTasks) || 0)
const execTotalPlans = computed(() => Number(execSummary.value?.totalPlans) || 0)

const coverStats = computed(() => [
  { num: faNum(execTotalPlans.value), lbl: 'کل برنامه‌ها' },
  { num: faNum(execTotalTasks.value), lbl: 'کل وظایف' },
  { num: fmtScore(execSummary.value?.overallScore), lbl: 'امتیاز تطبیق' },
  { num: fmtPct(execSummary.value?.completionRate), lbl: 'نرخ تکمیل' },
])

function stateFunnelRows(list: any[] | undefined | null) {
  return (list ?? []).slice().sort((a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state))
}
function funnelMax(list: any[] | undefined | null) {
  return maxCount((list ?? []).map((x) => Number(x.count) || 0))
}
function answerRows(list: any[] | undefined | null) {
  return (list ?? []).slice().sort((a, b) => ANSWER_ORDER.indexOf(a.answer) - ANSWER_ORDER.indexOf(b.answer))
}

function or(...vals: (string | number | null | undefined)[]) {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v
  }
  return '—'
}
/** درصد با نمایش «—» برای مقادیر ناموجود */
function fmtPct(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return '—'
  return faNum(round1(v)) + '٪'
}
/** درصد سهم یک جزء از کل (برای قیف وضعیت) */
function sharePct(part: number | null | undefined, total: number | null | undefined) {
  if (part == null || total == null || total === 0) return '—'
  return faNum(round1((part / total) * 100)) + '٪'
}
</script>

<template>
  <!-- ======================= FILTER / SETUP ======================= -->
  <div v-if="!reportGenerated" class="grc-report-root">
    <div class="report-setup">
      <div class="setup-card">
        <div class="setup-head">
          <span class="setup-badge compliance">
            <Lucide icon="ClipboardCheck" class="h-5 w-5" />
          </span>
          <div>
            <div class="setup-title">گزارش تطبیق</div>
            <div class="setup-sub">برنامه‌های تطبیق را انتخاب کنید و سپس گزارش را تولید کنید</div>
          </div>
        </div>

        <div class="setup-field">
          <div class="setup-label">
            <Lucide icon="Layers" class="h-3.5 w-3.5" />
            برنامه‌های تطبیق (اختیاری)
          </div>
          <div v-if="planLoading" class="py-3 text-center text-[11px] text-slate-400">در حال بارگذاری برنامه‌ها…</div>
          <div v-else-if="plans.length" class="flex flex-wrap gap-1.5">
            <button
              v-for="p in plans"
              :key="p.slug"
              type="button"
              class="rounded-full border px-3 py-1.5 text-[11px] font-medium transition"
              :class="
                selectedPlans.includes(p.slug)
                  ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40'
              "
              @click="togglePlan(p.slug)"
            >
              {{ p.title ?? p.slug }}
            </button>
          </div>
          <div v-else class="setup-empty" style="border: 1px dashed #dbe2e9; border-radius: 10px; padding: 14px; text-align: center; color: #94a3b8; font-size: 11px">
            برنامه‌ای یافت نشد. گزارش بر اساس همه برنامه‌ها تهیه می‌شود.
          </div>
          <p class="setup-hint">
            بدون انتخاب برنامه، گزارش بر اساس همه برنامه‌های تطبیق تهیه می‌شود.
          </p>
        </div>

        <div class="setup-summary">
          <div class="setup-summary-row">
            <span class="ss-label">برنامه‌ها</span>
            <span class="ss-value">{{ selectedPlans.length ? faNum(selectedPlans.length) + ' برنامه انتخاب شد' : 'همه برنامه‌ها' }}</span>
          </div>
          <div class="setup-summary-row">
            <span class="ss-label">نوع گزارش</span>
            <span class="ss-value">گزارش مبنا</span>
          </div>
        </div>

        <button type="button" class="setup-generate" @click="generateReport">
          <Lucide icon="Sparkles" class="h-4 w-4" />
          تولید گزارش
        </button>
      </div>
    </div>
  </div>

  <!-- ======================= REPORT ======================= -->
  <template v-else>
    <div v-if="loading" class="py-12 text-center">{{ 'در حال دریافت گزارش…' }}</div>
    <div v-else-if="error" class="py-12 text-center text-red-600">
      {{ error }}
      <div class="mt-3 flex items-center justify-center gap-2">
        <button class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50" @click="loadReport">تلاش مجدد</button>
        <button class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50" @click="backToSettings">تغییر تنظیمات</button>
      </div>
    </div>
    <div v-else-if="!data" class="py-12 text-center text-slate-400">
      داده‌ای برای گزارش موجود نیست.
      <div class="mt-3">
        <button class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50" @click="backToSettings">تغییر تنظیمات</button>
      </div>
    </div>

    <div v-else class="grc-report-root" id="compliance-report-root">
      <!-- ======================= TOOLBAR ======================= -->
      <div class="download-bar">
        <span class="download-note">
          گزارش تطبیق · برنامه‌ها: {{ selectedPlans.length ? faNum(selectedPlans.length) + ' برنامه' : 'همه برنامه‌ها' }}
        </span>
        <span class="flex-1" />
        <button class="download-btn secondary" :disabled="isGenerating" @click="backToSettings">
          <Lucide icon="Settings2" class="h-4 w-4" />
          <span>تنظیمات گزارش</span>
        </button>
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
      <div class="report-source" id="compliance-report-source" aria-hidden="true">
        <!-- COVER -->
        <div class="page page-source page-cover compliance">
          <div class="cover">
            <div class="cover-head">
              <div class="cover-logo">
                <Lucide icon="ClipboardCheck" class="h-5 w-5" />
              </div>
              <div class="cover-brand">حاکمیت، ریسک و تطبیق (GRC)</div>
            </div>
            <div class="cover-mid">
              <div class="cover-title-fa">گزارش تطبیق</div>
              <div class="cover-title-en">COMPLIANCE REPORT</div>
              <div class="cover-period">
                برنامه‌ها: {{ selectedPlans.length ? faNum(selectedPlans.length) + ' برنامه' : 'همه برنامه‌ها' }}
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
              <span>گزارش تطبیق</span>
            </div>
          </div>
        </div>

        <!-- SECTIONS -->
        <div v-for="sec in sections" :key="sec.key" class="page page-source page-body">
          <div class="page-header compliance">
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
              <div class="kpi-card compliance">
                <div class="kpi-label">کل برنامه‌ها</div>
                <div class="kpi-value">{{ faNum(execTotalPlans) }}</div>
              </div>
              <div class="kpi-card compliance">
                <div class="kpi-label">کل وظایف</div>
                <div class="kpi-value">{{ faNum(execTotalTasks) }}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">امتیاز کلی تطبیق</div>
                <div class="kpi-value">{{ fmtScore(execSummary?.overallScore) }}<small class="kpi-unit">٪</small></div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">نرخ تکمیل</div>
                <div class="kpi-value">{{ fmtPct(execSummary?.completionRate) }}</div>
              </div>
            </div>
            <div class="two-col" style="margin-top: 12px">
              <div class="dist-card">
                <div class="dist-title">توزیع پاسخ‌های ارزیابی</div>
                <div v-for="a in ANSWER_ORDER" :key="a" class="bar-row">
                  <span class="bar-label">{{ answerMeta(a).label }}</span>
                  <div class="bar-bg">
                    <div class="bar-fill" :style="{ width: barPct(countOf(execSummary?.tasksByAnswer, a), execTotalTasks), background: answerMeta(a).color }" />
                  </div>
                  <span class="bar-count">{{ faNum(countOf(execSummary?.tasksByAnswer, a)) }}</span>
                </div>
              </div>
              <div class="dist-card">
                <div class="dist-title">وضعیت چرخه کاری</div>
                <div v-for="st in STATE_ORDER" :key="st" class="bar-row">
                  <span class="bar-label">{{ stateMeta(st).label }}</span>
                  <div class="bar-bg">
                    <div class="bar-fill" :style="{ width: barPct(countOf(execSummary?.tasksByState, st), execTotalTasks), background: stateMeta(st).color }" />
                  </div>
                  <span class="bar-count">{{ faNum(countOf(execSummary?.tasksByState, st)) }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- ============ plan-performance ============ -->
          <template v-else-if="sec.key === 'plan-performance'">
            <table class="rpt-table" style="margin-top: 12px">
              <thead>
                <tr>
                  <th style="width: 26%">برنامه</th>
                  <th style="width: 10%">وظایف</th>
                  <th style="width: 12%">تکمیل</th>
                  <th style="width: 12%">میانگین امتیاز</th>
                  <th style="width: 26%">ترکیب وضعیت</th>
                  <th style="width: 14%">مهلت</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in sec.data?.planOverview ?? []" :key="idx" class="rpt-row">
                  <td>
                    <div class="rpt-title-main">{{ row.title ?? '—' }}</div>
                    <div class="rpt-title-sub">{{ row.planSlug }}</div>
                  </td>
                  <td class="score-val">{{ faNum(Number(row.totalTasks) || 0) }}</td>
                  <td>
                    <div class="mini-bar" style="display: inline-block; vertical-align: middle">
                      <div class="mini-bar-fill" :style="{ width: pctWidth(row.completionRate, 100), background: '#0B5C43' }" />
                    </div>
                    <span style="font-size: 9px; margin-right: 4px; color: #0B5C43; font-weight: 700">{{ fmtPct(row.completionRate) }}</span>
                  </td>
                  <td class="score-val">{{ fmtScore(row.avgScore) }}</td>
                  <td>
                    <span style="display: inline-flex; gap: 2px">
                      <span
                        v-for="st in STATE_ORDER"
                        :key="st"
                        :title="stateMeta(st).label"
                        class="mini-bar-fill"
                        :style="{
                          width: `${Math.max((Number(row[st === 'in_progress' ? 'inProgressTasks' : st + 'Tasks']) || 0) / Math.max(Number(row.totalTasks) || 1, 1) * 100, Number(row[st === 'in_progress' ? 'inProgressTasks' : st + 'Tasks']) ? 3 : 0)}px`,
                          background: stateMeta(st).color,
                          height: '7px',
                          borderRadius: '2px',
                          display: 'inline-block',
                        }"
                      />
                    </span>
                  </td>
                  <td class="muted">{{ faDate(row.deadline) }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- ============ framework-compliance ============ -->
          <template v-else-if="sec.key === 'framework-compliance'">
            <div v-for="(row, idx) in sec.data?.frameworkCompliance ?? []" :key="idx" class="dist-card" style="margin-top: 10px">
              <div class="dist-title" style="display: flex; justify-content: space-between">
                <span>{{ row.frameworkTitle ?? '—' }}</span>
                <span style="font-size: 10px; font-weight: 700; color: #0B5C43">{{ fmtPct(row.complianceRate) }} تطبیق</span>
              </div>
              <div class="bar-row">
                <span class="bar-label">وظایف</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: pctWidth(row.totalTasks, Math.max(execTotalTasks, 1)), background: '#0B5C43' }" />
                </div>
                <span class="bar-count">{{ faNum(Number(row.totalTasks) || 0) }}</span>
              </div>
              <div v-for="a in ANSWER_ORDER" :key="a" class="bar-row">
                <span class="bar-label">{{ answerMeta(a).label }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: barPct(countOf(row.byAnswer, a), Number(row.totalTasks) || 1), background: answerMeta(a).color }" />
                </div>
                <span class="bar-count">{{ faNum(countOf(row.byAnswer, a)) }}</span>
              </div>
            </div>
          </template>

          <!-- ============ domain-compliance ============ -->
          <template v-else-if="sec.key === 'domain-compliance'">
            <div v-for="(row, idx) in sec.data?.domainCompliance ?? []" :key="idx" class="dist-card" style="margin-top: 10px">
              <div class="dist-title" style="display: flex; justify-content: space-between">
                <span>{{ row.domainTitle ?? '—' }}</span>
                <span style="font-size: 10px; font-weight: 700; color: #0B5C43">{{ fmtPct(row.complianceRate) }} تطبیق</span>
              </div>
              <div v-for="a in ANSWER_ORDER" :key="a" class="bar-row">
                <span class="bar-label">{{ answerMeta(a).label }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: barPct(countOf(row.byAnswer, a), Number(row.totalTasks) || 1), background: answerMeta(a).color }" />
                </div>
                <span class="bar-count">{{ faNum(countOf(row.byAnswer, a)) }}</span>
              </div>
            </div>
          </template>

          <!-- ============ control-compliance ============ -->
          <template v-else-if="sec.key === 'control-compliance'">
            <table class="rpt-table" style="margin-top: 12px">
              <thead>
                <tr>
                  <th style="width: 34%">کنترل</th>
                  <th style="width: 10%">وظایف</th>
                  <th style="width: 12%">میانگین امتیاز</th>
                  <th style="width: 34%">پاسخ‌ها</th>
                  <th style="width: 10%">تطبیق</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in sec.data?.controlCompliance ?? []" :key="idx" class="rpt-row">
                  <td>
                    <div class="rpt-title-main">{{ row.controlTitle ?? row.title ?? '—' }}</div>
                    <div class="rpt-title-sub">{{ or(row.controlSlug, row.domainTitle) }}</div>
                  </td>
                  <td class="score-val">{{ faNum(Number(row.totalTasks) || 0) }}</td>
                  <td class="score-val">{{ fmtScore(row.avgScore) }}</td>
                  <td>
                    <span style="display: inline-flex; gap: 2px">
                      <span
                        v-for="a in ANSWER_ORDER"
                        :key="a"
                        class="mini-bar-fill"
                        :title="answerMeta(a).label"
                        :style="{
                          width: `${Math.max(countOf(row.byAnswer, a) / Math.max(Number(row.totalTasks) || 1, 1) * 60, countOf(row.byAnswer, a) ? 3 : 0)}px`,
                          background: answerMeta(a).color,
                          height: '7px',
                          borderRadius: '2px',
                          display: 'inline-block',
                        }"
                      />
                    </span>
                  </td>
                  <td class="score-val" style="color: #0B5C43">{{ fmtPct(row.complianceRate) }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- ============ assignee-performance ============ -->
          <template v-else-if="sec.key === 'assignee-performance'">
            <table class="rpt-table" style="margin-top: 12px">
              <thead>
                <tr>
                  <th style="width: 28%">مجری وظایف</th>
                  <th style="width: 20%">تعداد وظایف</th>
                  <th style="width: 20%">میانگین امتیاز</th>
                  <th style="width: 16%">منطبق</th>
                  <th style="width: 16%">نامنطبق</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in sec.data?.assigneePerformance ?? []" :key="idx" class="rpt-row">
                  <td>
                    <div class="rpt-title-main">{{ row.assigneeId ? `کارشناس ${faNum(Number(row.assigneeId))}` : 'بدون مسئول' }}</div>
                  </td>
                  <td class="score-val">{{ faNum(Number(row.totalTasks) || 0) }}</td>
                  <td class="score-val">{{ fmtScore(row.avgScore) }}</td>
                  <td>
                    <span class="pill" style="background: rgba(22, 163, 74, 0.12); color: #16a34a">{{ faNum(Number(row.compliantCount) || 0) }}</span>
                  </td>
                  <td>
                    <span class="pill" style="background: rgba(220, 38, 38, 0.12); color: #dc2626">{{ faNum(Number(row.nonCompliantCount) || 0) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- ============ owner-overview ============ -->
          <template v-else-if="sec.key === 'owner-overview'">
            <table class="rpt-table" style="margin-top: 12px">
              <thead>
                <tr>
                  <th style="width: 28%">مالک برنامه</th>
                  <th style="width: 22%">برنامه‌ها</th>
                  <th style="width: 22%">وظایف</th>
                  <th style="width: 28%">میانگین نرخ تکمیل</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in sec.data?.ownerOverview ?? []" :key="idx" class="rpt-row">
                  <td>
                    <div class="rpt-title-main">{{ row.ownerId ? `کارشناس ${faNum(Number(row.ownerId))}` : 'بدون مالک' }}</div>
                  </td>
                  <td class="score-val">{{ faNum(Number(row.totalPlans) || 0) }}</td>
                  <td class="score-val">{{ faNum(Number(row.totalTasks) || 0) }}</td>
                  <td>
                    <div class="mini-bar" style="display: inline-block; vertical-align: middle">
                      <div class="mini-bar-fill" :style="{ width: pctWidth(row.avgCompletionRate, 100), background: '#0B5C43' }" />
                    </div>
                    <span style="font-size: 9px; margin-right: 4px; color: #0B5C43; font-weight: 700">{{ fmtPct(row.avgCompletionRate) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- ============ answer-distribution ============ -->
          <template v-else-if="sec.key === 'answer-distribution'">
            <div class="dist-card" style="margin-top: 12px">
              <div class="dist-title">توزیع پاسخ‌های ارزیابی</div>
              <div v-for="(row, idx) in answerRows(sec.data?.answerDistribution)" :key="idx" class="bar-row">
                <span class="bar-label">{{ answerMeta(row.answer).label }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: pctWidth(Number(row.count) || 0, execTotalTasks), background: answerMeta(row.answer).color }" />
                </div>
                <span class="bar-count">{{ faNum(Number(row.count) || 0) }}</span>
                <span class="bar-pct">{{ fmtPct(row.percentage) }}</span>
              </div>
            </div>
          </template>

          <!-- ============ score-distribution ============ -->
          <template v-else-if="sec.key === 'score-distribution'">
            <div class="dist-card" style="margin-top: 12px">
              <div class="dist-title">بازه‌بندی امتیاز تطبیق</div>
              <div v-for="(row, idx) in sec.data?.scoreDistribution ?? []" :key="idx" class="bar-row">
                <span class="bar-label">{{ row.range ?? '—' }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: barPct(Number(row.count) || 0, maxCount((sec.data?.scoreDistribution ?? []).map((x: any) => Number(x.count) || 0))), background: '#0B5C43' }" />
                </div>
                <span class="bar-count">{{ faNum(Number(row.count) || 0) }}</span>
              </div>
            </div>
          </template>

          <!-- ============ state-funnel ============ -->
          <template v-else-if="sec.key === 'state-funnel'">
            <div class="dist-card" style="margin-top: 12px">
              <div class="dist-title">قیف وضعیت وظایف</div>
              <div v-for="(row, idx) in stateFunnelRows(sec.data?.stateFunnel)" :key="idx" class="bar-row">
                <span class="bar-label">{{ stateMeta(row.state).label }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: barPct(Number(row.count) || 0, funnelMax(sec.data?.stateFunnel)), background: stateMeta(row.state).color }" />
                </div>
                <span class="bar-count">{{ faNum(Number(row.count) || 0) }}</span>
                <span class="bar-pct">{{ sharePct(Number(row.count) || 0, execTotalTasks) }}</span>
              </div>
            </div>
          </template>

          <!-- ============ overdue-tasks ============ -->
          <template v-else-if="sec.key === 'overdue-tasks'">
            <table class="rpt-table" style="margin-top: 12px">
              <thead>
                <tr>
                  <th style="width: 34%">وظیفه</th>
                  <th style="width: 14%">برنامه</th>
                  <th style="width: 12%">پاسخ</th>
                  <th style="width: 14%">مهلت</th>
                  <th style="width: 14%">به‌روزرسانی</th>
                  <th style="width: 12%">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in sec.data?.overdueTasks ?? []" :key="idx" class="rpt-row">
                  <td>
                    <div class="rpt-title-main">{{ r.title ?? '—' }}</div>
                    <div class="rpt-title-sub">{{ or(r.controlTitle, r.domainTitle) }}</div>
                  </td>
                  <td class="muted">{{ r.planSlug ?? '—' }}</td>
                  <td>
                    <span class="pill" :style="{ background: hexToRgba(answerMeta(r.answer).color, 0.12), color: answerMeta(r.answer).color }">
                      {{ answerMeta(r.answer).label }}
                    </span>
                  </td>
                  <td class="score-val" style="color: #dc2626">{{ faDate(r.deadline) }}</td>
                  <td class="muted">{{ faDate(r.updatedAt) }}</td>
                  <td>
                    <span class="pill" :style="{ background: hexToRgba(stateMeta(r.state).color, 0.12), color: stateMeta(r.state).color }">
                      {{ stateMeta(r.state).label }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- ============ recent-activity ============ -->
          <template v-else-if="sec.key === 'recent-activity'">
            <table class="rpt-table" style="margin-top: 12px">
              <thead>
                <tr>
                  <th style="width: 34%">وظیفه</th>
                  <th style="width: 14%">برنامه</th>
                  <th style="width: 12%">پاسخ</th>
                  <th style="width: 14%">امتیاز</th>
                  <th style="width: 14%">به‌روزرسانی</th>
                  <th style="width: 12%">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in sec.data?.recentActivity ?? []" :key="idx" class="rpt-row">
                  <td>
                    <div class="rpt-title-main">{{ r.title ?? '—' }}</div>
                    <div class="rpt-title-sub">{{ or(r.controlTitle, r.domainTitle) }}</div>
                  </td>
                  <td class="muted">{{ r.planSlug ?? '—' }}</td>
                  <td>
                    <span class="pill" :style="{ background: hexToRgba(answerMeta(r.answer).color, 0.12), color: answerMeta(r.answer).color }">
                      {{ answerMeta(r.answer).label }}
                    </span>
                  </td>
                  <td class="score-val">{{ fmtScore(r.answerScore) }}</td>
                  <td class="muted">{{ faDate(r.updatedAt) }}</td>
                  <td>
                    <span class="pill" :style="{ background: hexToRgba(stateMeta(r.state).color, 0.12), color: stateMeta(r.state).color }">
                      {{ stateMeta(r.state).label }}
                    </span>
                  </td>
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
      <div class="report-wrapper" id="compliance-report-wrapper" />
    </div>
  </template>
</template>
