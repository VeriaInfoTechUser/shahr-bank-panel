<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import Lucide from '@/base-components/Lucide'
import { theme } from '@/config/theme'
import { reportRepo } from '@/core/repositories/reportRepo'
import PeriodSelectPanel from '@/components/PeriodSelectPanel.vue'

// ---------------------------------------------------------------------------
// data fetching
// ---------------------------------------------------------------------------
const data = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const reportType = ref<'baseline' | 'comparative'>('baseline')

const isGenerating = ref(false)
const progress = ref(0)

// ---- report filter panel state (period + comparison, like the dashboard) ----
interface SelectedPeriod {
  type: string
  startDate: string
  endDate: string
}
const reportGenerated = ref(false)
const selectedPeriod = ref<SelectedPeriod | null>(null)
const compareEnabled = ref(false)
const comparePeriod = ref<SelectedPeriod | null>(null)

async function loadReport() {
  loading.value = true
  error.value = null
  try {
    const params = buildReportParams()
    const res = await reportRepo.getSustainabilitySections(params)
    let payload = res?.data ?? null
    // Comparative report without an explicit comparison period: if the backend
    // didn't resolve one, derive the previous year so the section isn't empty.
    if (
      reportType.value === 'comparative' &&
      !(compareEnabled.value && comparePeriod.value) &&
      payload &&
      !payload.comparisonPeriod &&
      payload.period &&
      payload.period.type === 'YEARLY'
    ) {
      try {
        const prev = payload.period.year - 1
        const res2 = await reportRepo.getSustainabilitySections({
          ...params,
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
    await nextTick()
    buildPages()
    // Re-measure once webfonts are ready so the A4 page splits are stable
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => buildPages())
    }
  }
}

function switchType(type: 'baseline' | 'comparative') {
  if (type === reportType.value) return
  reportType.value = type
  if (type === 'comparative' && !comparePeriod.value && prevComparePeriod.value) {
    // default the comparison to the previous period so the section has data
    comparePeriod.value = prevComparePeriod.value
    compareEnabled.value = true
  }
  window.scrollTo({ top: 0 })
  loadReport()
}

/** Filter-panel type toggle: only updates the selection, does not fetch yet. */
function setReportType(type: 'baseline' | 'comparative') {
  if (type === reportType.value) return
  reportType.value = type
  if (type === 'baseline') {
    compareEnabled.value = false
    comparePeriod.value = null
  }
}

/** Apply the configured filters and load the report. */
function generateReport() {
  if (!canGenerate.value) return
  reportGenerated.value = true
  loadReport()
}

/** Go back to the filter panel to change the configuration. */
function backToSettings() {
  reportGenerated.value = false
  data.value = null
  window.scrollTo({ top: 0 })
}

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
  return groups
})

const capitalRisks = computed(() => {
  const map: Record<string, { title: string; icon: string; color: string }> = {}
  for (const s of capitalSections.value) {
    const c = s.data?.capital
    if (!c) continue
    const meta = capitalMeta(c.capitalType)
    map[c.slug] = { title: c.title, icon: meta.icon, color: meta.color }
  }
  const byCap = riskData.value?.byCapital ?? {}
  return Object.entries(byCap)
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => ({
      slug,
      count,
      title: map[slug]?.title ?? slug,
      icon: map[slug]?.icon ?? 'CircleDot',
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
const CAPITAL_META: Record<string, { color: string; icon: string }> = {
  NAT: { color: '#16A34A', icon: 'Leaf' },
  HUM: { color: '#2563EB', icon: 'Users' },
  SOC: { color: '#DB2777', icon: 'Handshake' },
  INS: { color: '#7C3AED', icon: 'Landmark' },
  TEC: { color: '#0891B2', icon: 'Cpu' },
  FEC: { color: '#CA8A04', icon: 'Coins' },
}
function capitalMeta(type?: string) {
  return (type && CAPITAL_META[type]) || { color: '#64748b', icon: 'CircleDot' }
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
  critical: theme.status.critical,
  high: theme.status.high,
  medium: theme.status.medium,
  low: theme.status.low,
  unknown: theme.status.draft,
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
  draft: theme.status.draft,
  registered: theme.status.registered,
  analysis: theme.status.analysis,
  response: theme.status.response,
  monitoring: theme.status.monitoring,
  closed: theme.status.closed,
  archived: theme.status.archived,
  unknown: theme.status.draft,
}
const RISK_TYPE_LABEL: Record<string, string> = {
  threat: 'تهدید',
  opportunity: 'فرصت',
}
const TREATMENT_LABEL: Record<string, string> = {
  avoid: 'اجتناب',
  transfer: 'انتقال',
  reduce: 'کاهش',
  accept: 'پذیرش',
  share: 'تقسیم/اشتراک',
}
const RISK_LEVEL_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  unknown: 4,
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
function deltaDir(node: any): 'up' | 'down' | 'zero' | 'none' {
  const d = deltaValue(node)
  if (d == null) return 'none'
  if (d > 0) return 'up'
  if (d < 0) return 'down'
  return 'zero'
}
function deltaAbs(node: any) {
  const d = deltaValue(node)
  if (d == null || d === 0) return '—'
  return faNum(Math.abs(round1(d)))
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
function faDate(d?: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  if (!y || !m || !day) return faNum(Number(d))
  return `${faNum(Number(y))}/${faNum(Number(m))}/${faNum(Number(day))}`
}
function pctOf(part: number | null | undefined, total: number | null | undefined) {
  if (part == null || total == null || total === 0) return '—'
  return faNum(round1((part / total) * 100)) + '٪'
}
function pctWidth(part: number | null | undefined, total: number | null | undefined) {
  if (part == null || total == null || total === 0) return '0%'
  return Math.min(Math.round((part / total) * 100), 100) + '%'
}
// indicator data-completion of a node (0-100) or null when no counts
function dataPct(node: any) {
  const total = node?.indicatorCount
  const withData = node?.indicatorsWithData
  if (total == null || withData == null || total === 0) return null
  return round1((withData / total) * 100)
}

// ---------------------------------------------------------------------------
// risk register: flatten all capability-level risks with context
// ---------------------------------------------------------------------------
const riskRegister = computed(() => {
  const rows: any[] = []
  for (const s of capitalSections.value) {
    const c = s.data?.capital
    if (!c) continue
    for (const dom of c.domains ?? []) {
      for (const comp of dom.components ?? []) {
        for (const capab of comp.capabilities ?? []) {
          for (const r of capab.risks?.risks ?? []) {
            rows.push({
              ...r,
              capitalSlug: c.slug,
              capitalTitle: c.title,
              capitalType: c.capitalType,
              domainTitle: dom.title,
              capabilityTitle: capab.title,
            })
          }
        }
      }
    }
  }
  rows.sort((a, b) => {
    const lvl = (RISK_LEVEL_ORDER[a.level] ?? 9) - (RISK_LEVEL_ORDER[b.level] ?? 9)
    if (lvl !== 0) return lvl
    return (b.score ?? 0) - (a.score ?? 0)
  })
  return rows
})
const riskRegisterByCapital = computed(() => {
  const groups: any[] = []
  const map = new Map<string, any>()
  for (const r of riskRegister.value) {
    if (!map.has(r.capitalSlug)) {
      const g = {
        slug: r.capitalSlug,
        title: r.capitalTitle,
        capitalType: r.capitalType,
        total: 0,
        risks: [] as any[],
      }
      map.set(r.capitalSlug, g)
      groups.push(g)
    }
    const g = map.get(r.capitalSlug)
    g.total += 1
    g.risks.push(r)
  }
  return groups.sort((a, b) => b.total - a.total)
})

// ---------------------------------------------------------------------------
// report filter panel (period + comparison — same UX as the sustainability
// dashboard): the report is only fetched after the user applies these filters
// ---------------------------------------------------------------------------
const pad2 = (n: number) => String(n).padStart(2, '0')
const lastDayOfMonth = (year: number, month: number) => new Date(year, month, 0).getDate()
const currentYear = () => new Date().getFullYear()

const yearStripRef = ref<HTMLElement | null>(null)

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

function periodForYear(type: string, year: number): SelectedPeriod {
  const month = selectedPeriod.value ? Number(selectedPeriod.value.startDate.slice(5, 7)) : 1
  if (type === 'QUARTERLY') {
    const q = Math.floor((month - 1) / 3) + 1
    const fm = (q - 1) * 3 + 1
    const lm = q * 3
    return { type: 'QUARTERLY', startDate: `${year}-${pad2(fm)}-01`, endDate: `${year}-${pad2(lm)}-${pad2(lastDayOfMonth(year, lm))}` }
  }
  if (type === 'MONTHLY') {
    const m = Math.min(month, 12)
    return { type: 'MONTHLY', startDate: `${year}-${pad2(m)}-01`, endDate: `${year}-${pad2(m)}-${pad2(lastDayOfMonth(year, m))}` }
  }
  return { type: 'YEARLY', startDate: `${year}-01-01`, endDate: `${year}-12-31` }
}

function isQuickYearActive(year: number): boolean {
  const p = selectedPeriod.value
  return !!p && Number(p.startDate.slice(0, 4)) === year
}

function quickSelectYear(year: number) {
  selectedPeriod.value = periodForYear(selectedPeriod.value?.type ?? 'YEARLY', year)
}

function formatPeriodLabel(p: SelectedPeriod): string {
  const year = p.startDate.slice(0, 4)
  if (p.type === 'YEARLY') return `${PERIOD_TYPE_FA.YEARLY} ${year}`
  if (p.type === 'QUARTERLY') {
    const q = Math.floor((Number(p.startDate.slice(5, 7)) - 1) / 3) + 1
    return `فصل ${q} ${year}`
  }
  if (p.type === 'MONTHLY') {
    const month = Number(p.startDate.slice(5, 7))
    return `${PERIOD_TYPE_FA.MONTHLY} ${pad2(month)} ${year}`
  }
  return `${p.startDate} ← ${p.endDate}`
}

const selectedPeriodLabel = computed(() => (selectedPeriod.value ? formatPeriodLabel(selectedPeriod.value) : ''))
const comparePeriodLabel = computed(() => (comparePeriod.value ? formatPeriodLabel(comparePeriod.value) : ''))

const compareTypes = computed<string[]>(() => (selectedPeriod.value ? [selectedPeriod.value.type] : ['YEARLY']))
const comparisonTypeLabel = computed(() => PERIOD_TYPE_FA[compareTypes.value[0]] ?? compareTypes.value[0])

const prevComparePeriod = computed<SelectedPeriod | null>(() => {
  const p = selectedPeriod.value
  if (!p) return null
  const year = Number(p.startDate.slice(0, 4))
  const month = Number(p.startDate.slice(5, 7))
  if (p.type === 'YEARLY') {
    const y = year - 1
    return { type: 'YEARLY', startDate: `${y}-01-01`, endDate: `${y}-12-31` }
  }
  if (p.type === 'QUARTERLY') {
    const q = Math.floor((month - 1) / 3) + 1
    let y = year
    let pq = q - 1
    if (pq === 0) { pq = 4; y -= 1 }
    const fm = (pq - 1) * 3 + 1
    const lm = pq * 3
    return { type: 'QUARTERLY', startDate: `${y}-${pad2(fm)}-01`, endDate: `${y}-${pad2(lm)}-${pad2(lastDayOfMonth(y, lm))}` }
  }
  if (p.type === 'MONTHLY') {
    let y = year
    let m = month - 1
    if (m === 0) { m = 12; y -= 1 }
    return { type: 'MONTHLY', startDate: `${y}-${pad2(m)}-01`, endDate: `${y}-${pad2(m)}-${pad2(lastDayOfMonth(y, m))}` }
  }
  return null
})

const isComparingPrevious = computed(() => {
  const prev = prevComparePeriod.value
  return (
    !!prev &&
    !!comparePeriod.value &&
    comparePeriod.value.startDate === prev.startDate &&
    comparePeriod.value.endDate === prev.endDate
  )
})

function compareWithPrevious() {
  if (!prevComparePeriod.value) return
  comparePeriod.value = prevComparePeriod.value
  compareEnabled.value = true
}

const compareInvalid = computed(() => {
  if (!compareEnabled.value || !comparePeriod.value || !selectedPeriod.value) return false
  return (
    comparePeriod.value.startDate === selectedPeriod.value.startDate &&
    comparePeriod.value.endDate === selectedPeriod.value.endDate
  )
})

// if the main period granularity changes, drop the now-incompatible comparison
watch(
    () => selectedPeriod.value?.type,
    () => {
      if (!compareEnabled.value) return
      comparePeriod.value = null
    },
)

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

const canGenerate = computed(() => {
  if (!selectedPeriod.value) return false
  if (reportType.value === 'comparative') {
    if (!compareEnabled.value || !comparePeriod.value) return false
    if (compareInvalid.value) return false
  }
  return true
})

function buildReportParams(): Record<string, unknown> {
  const params: Record<string, unknown> = { reportType: reportType.value }
  if (selectedPeriod.value) {
    params.period_type = selectedPeriod.value.type
    params.date_from = selectedPeriod.value.startDate
    params.date_to = selectedPeriod.value.endDate
  }
  if (
    reportType.value === 'comparative' &&
    compareEnabled.value &&
    comparePeriod.value &&
    !compareInvalid.value
  ) {
    params.compare_period_type = comparePeriod.value.type
    params.compare_date_from = comparePeriod.value.startDate
    params.compare_date_to = comparePeriod.value.endDate
  }
  return params
}

// ---------------------------------------------------------------------------
// A4 pagination: split each section's content across exact-A4 pages
// ---------------------------------------------------------------------------
const MM_PX = 96 / 25.4
const A4_H_PX = Math.round(297 * MM_PX) // 1123 px @96dpi
const PAGE_TOP_PX = 15 * MM_PX // 56.7 px
const PAGE_BOTTOM_PX = 12 * MM_PX // 45.4 px
const PAGE_CONTENT_H = A4_H_PX - PAGE_TOP_PX - PAGE_BOTTOM_PX // ~1020.5 px

interface PageCtx {
  shell: HTMLElement
  pages: HTMLElement[]
  cur: HTMLElement
  remaining: number
  contentH: number
  tolerance: number
}
interface Host {
  el: HTMLElement
}

const ORPHAN_HEADINGS = ['page-header', 'strip-title', 'register-cap', 'domain-head', 'register-head']

function unitHeight(el: HTMLElement) {
  const cs = getComputedStyle(el)
  const mt = parseFloat(cs.marginTop) || 0
  const mb = parseFloat(cs.marginBottom) || 0
  return el.getBoundingClientRect().height + mt + mb
}

function isAtomic(el: HTMLElement) {
  if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'IMG', 'SVG', 'BUTTON', 'A', 'LI', 'TH', 'TD', 'SPAN'].includes(el.tagName)) return true
  if (el.children.length === 0) return true
  const cls = el.classList
  return (
    cls.contains('cover') ||
    cls.contains('page-header') ||
    cls.contains('register-cap') ||
    cls.contains('register-head') ||
    cls.contains('domain-head') ||
    cls.contains('cap-score-row') ||
    cls.contains('narrative-box') ||
    cls.contains('dist-card') ||
    cls.contains('kpi-grid') ||
    cls.contains('target-bar') ||
    cls.contains('strip-title') ||
    cls.contains('capab-row') ||
    cls.contains('cap-strip-row') ||
    cls.contains('comp-row') ||
    cls.contains('bar-row')
  )
}

function newPage(ctx: PageCtx) {
  const p = ctx.shell.cloneNode(false) as HTMLElement
  p.classList.remove('page-source')
  p.style.height = `${A4_H_PX}px`
  p.style.minHeight = `${A4_H_PX}px`
  p.style.overflow = 'hidden'
  ctx.pages.push(p)
  ctx.cur = p
  ctx.remaining = ctx.contentH
  // keep section headings with the content that follows them
  const prev = ctx.pages[ctx.pages.length - 2]
  const last = prev?.lastElementChild as HTMLElement | null
  if (last && ORPHAN_HEADINGS.some((c) => last.classList.contains(c))) {
    ctx.cur.appendChild(last)
    ctx.remaining = ctx.contentH - unitHeight(last)
  }
}

function splitTable(table: HTMLTableElement, host: Host, reopen: () => void, ctx: PageCtx) {
  const tbody = table.querySelector(':scope > tbody') as HTMLTableElement | null
  if (!tbody || tbody.children.length === 0) {
    // no splittable rows → move the table as a single block
    reopen()
    host.el.appendChild(table)
    ctx.remaining -= unitHeight(table)
    return
  }
  const thead = table.querySelector(':scope > thead')
  const rows = Array.from(tbody.children) as HTMLElement[]

  // open the first row-chunk in the current page
  if (unitHeight(rows[0]) > ctx.remaining + ctx.tolerance) reopen()

  const openChunk = () => {
    const chunk = table.cloneNode(false) as HTMLTableElement
    if (thead) chunk.appendChild(thead.cloneNode(true))
    chunk.appendChild(document.createElement('tbody'))
    host.el.appendChild(chunk)
    return chunk
  }
  let chunk = openChunk()
  for (const tr of rows) {
    const h = unitHeight(tr)
    const fresh = ctx.remaining >= ctx.contentH - 1
    if (h > ctx.remaining + ctx.tolerance && !fresh) {
      reopen()
      chunk = openChunk()
    }
    chunk.querySelector('tbody')!.appendChild(tr)
    ctx.remaining -= h
  }
}

function place(el: HTMLElement, host: Host, reopen: () => void, ctx: PageCtx) {
  const h = unitHeight(el)
  if (h <= ctx.remaining + ctx.tolerance) {
    host.el.appendChild(el)
    ctx.remaining -= h
    return
  }
  if (el.tagName === 'TABLE') {
    splitTable(el as HTMLTableElement, host, reopen, ctx)
    return
  }
  if (h <= ctx.contentH + ctx.tolerance) {
    // fits on a fresh page → move the whole block so it is never cut in half
    reopen()
    host.el.appendChild(el)
    ctx.remaining -= h
    return
  }
  if (el.children.length > 0 && !isAtomic(el)) {
    // taller than a page → flow its children through per-page copies of the
    // container so boxes/borders are preserved on every page
    const gap = parseFloat(getComputedStyle(el).rowGap) || 0
    const first = el.cloneNode(false) as HTMLElement
    host.el.appendChild(first)
    const chunk: Host = { el: first }
    const reopenChunk = () => {
      reopen()
      chunk.el = el.cloneNode(false) as HTMLElement
      host.el.appendChild(chunk.el)
    }
    const kids = Array.from(el.children) as HTMLElement[]
    kids.forEach((kid, idx) => {
      // account for the container's row-gap, which unitHeight() does not include
      if (idx > 0 && gap > 0) ctx.remaining -= gap
      place(kid, chunk, reopenChunk, ctx)
    })
    return
  }
  // atomic block taller than a full page → best-effort placement
  reopen()
  host.el.appendChild(el)
  ctx.remaining -= h
}

function buildPages() {
  // never rebuild the pagination while a PDF capture is in flight, otherwise
  // the captured page nodes would be detached and rasterized blank
  if (isGenerating.value) return
  const wrapper = document.getElementById('sustainability-report-wrapper')
  const source = document.getElementById('sustainability-report-source')
  if (!wrapper || !source) return
  wrapper.innerHTML = ''
  const sections = Array.from(source.querySelectorAll('.page-source')) as HTMLElement[]

  let pageNumber = 1
  for (const section of sections) {
    const isCover = section.classList.contains('page-cover')

    // work on a clone so the hidden source can be re-paginated later
    const working = section.cloneNode(true) as HTMLElement
    source.appendChild(working)

    const numEl = Array.from(working.children).find((c) =>
      c.classList.contains('page-num')
    ) as HTMLElement | undefined

    const firstPage = section.cloneNode(false) as HTMLElement
    firstPage.classList.remove('page-source')
    firstPage.style.height = `${A4_H_PX}px`
    firstPage.style.minHeight = `${A4_H_PX}px`
    firstPage.style.overflow = 'hidden'

    const ctx: PageCtx = {
      shell: section,
      pages: [firstPage],
      cur: firstPage,
      remaining: PAGE_CONTENT_H,
      contentH: PAGE_CONTENT_H,
      tolerance: 8,
    }
    const pageHost: Host = { el: firstPage }
    const reopenPage = () => {
      newPage(ctx)
      pageHost.el = ctx.cur
    }

    const kids = Array.from(working.children).filter(
      (c) => !c.classList.contains('page-num')
    ) as HTMLElement[]
    for (const kid of kids) place(kid, pageHost, reopenPage, ctx)

    source.removeChild(working)

    for (const p of ctx.pages) {
      if (!isCover && numEl) {
        const num = numEl.cloneNode(true) as HTMLElement
        num.textContent = `صفحه ${faNum(pageNumber)}`
        p.appendChild(num)
      }
      pageNumber += 1
      wrapper.appendChild(p)
    }
  }
}

// ---------------------------------------------------------------------------
// PDF export (same approach as the ESG report)
// ---------------------------------------------------------------------------
async function downloadPDF() {
  isGenerating.value = true
  progress.value = 0
  try {
    // Make sure the Vazirmatn web font is fully loaded before capturing,
    // otherwise html2canvas rasterizes with fallback-font metrics (text looks
    // mis-scaled and glyphs render as boxes in the exported PDF).
    try {
      await document.fonts.ready
      await Promise.all(
        Array.from(document.fonts).map((f) =>
          f.load().catch(() => undefined)
        )
      )
    } catch (e) {
      console.warn('Font preload skipped:', e)
    }

    const wrapper = document.getElementById('sustainability-report-wrapper')
    if (!wrapper) return
    const pages = wrapper.querySelectorAll('.page') as NodeListOf<HTMLElement>
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const A4_W = 210
    const A4_H = 297

    let firstPage = true
    for (let i = 0; i < pages.length; i++) {
      progress.value = Math.round(((i + 1) / pages.length) * 100)
      const page = pages[i]

      // Adaptive scale: render at 2x for crisp text, but scale down when the page
      // is very tall so the canvas never exceeds browser limits (html2canvas would
      // otherwise produce a blank/decorative capture for oversized elements).
      // scrollHeight is used so content that overflows the sheet (overflow:hidden)
      // is still measured and never dropped from the capture.
      const pageH = Math.max(page.scrollHeight, page.offsetHeight)
      const pageW = page.offsetWidth || page.scrollWidth
      const maxDim = Math.max(pageW, pageH)
      const scale = Math.max(0.4, Math.min(2, 12000 / maxDim))

      const canvas = await html2canvas(page, {
        scale,
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
          // Never clip content during the raster: if a sheet's content overflows
          // its box, let it grow to its natural height so every row is captured.
          doc.querySelectorAll('.page').forEach((el) => {
            const p = el as HTMLElement
            if (p.scrollHeight > p.clientHeight + 2) {
              p.style.height = 'auto'
              p.style.minHeight = '0'
              p.style.maxHeight = 'none'
              p.style.overflow = 'visible'
            }
          })
        },
      })

      // Slice the canvas into exact A4-height bands. Each band becomes one A4
      // PDF page (210 x 297 mm) and every band is kept, so no content is hidden.
      const pxPerMm = canvas.width / A4_W
      const sliceHpx = Math.round(A4_H * pxPerMm)
      const sliceCount = Math.max(1, Math.ceil(canvas.height / sliceHpx))
      // Skip sub-1%-of-A4 slivers (created by pixel rounding on sheets that are
      // exactly one A4 tall) — they contain no visible content, only padding.
      const minSlicePx = Math.max(20, Math.round(sliceHpx * 0.01))

      for (let s = 0; s < sliceCount; s++) {
        const yPx = s * sliceHpx
        const hPx = Math.min(sliceHpx, canvas.height - yPx)
        if (s > 0 && hPx < minSlicePx) continue

        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = hPx
        const ctx = sliceCanvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(canvas, 0, yPx, canvas.width, hPx, 0, 0, canvas.width, hPx)
        }
        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95)

        if (!firstPage) pdf.addPage()
        firstPage = false
        pdf.addImage(sliceData, 'JPEG', 0, 0, A4_W, hPx / pxPerMm)
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
  <!-- ======================= FILTER / SETUP ======================= -->
  <div v-if="!reportGenerated" dir="rtl" style="font-family: 'Vazirmatn', sans-serif" class="report-setup">
    <div class="setup-card">
      <div class="setup-head">
        <span class="setup-badge">
          <Lucide icon="FileText" class="h-5 w-5" />
        </span>
        <div>
          <div class="setup-title">گزارش پایداری</div>
          <div class="setup-sub">دوره گزارش‌دهی را انتخاب کنید و سپس گزارش را تولید کنید</div>
        </div>
      </div>

      <!-- report type -->
      <div class="setup-field">
        <div class="setup-label">
          <Lucide icon="Layers" class="h-3.5 w-3.5" />
          نوع گزارش
        </div>
        <div class="seg seg-wide">
          <button
              type="button"
              :class="{ active: reportType === 'baseline' }"
              @click="setReportType('baseline')"
          >گزارش مبنا</button>
          <button
              type="button"
              :class="{ active: reportType === 'comparative' }"
              @click="setReportType('comparative')"
          >گزارش مقایسه‌ای</button>
        </div>
        <p class="setup-hint">
          گزارش مبنا عملکرد دوره جاری و گزارش مقایسه‌ای عملکرد دو دوره را نمایش می‌دهد.
        </p>
      </div>

      <!-- period -->
      <div class="setup-field">
        <div class="setup-label">
          <Lucide icon="CalendarRange" class="h-3.5 w-3.5" />
          دوره گزارش‌دهی
        </div>
        <div class="mb-2 flex items-center gap-1">
          <button
              type="button"
              class="year-nav"
              title="سال قبل"
              @click="scrollYears(-1)"
          >
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
          <button
              type="button"
              class="year-nav"
              title="سال بعد"
              @click="scrollYears(1)"
          >
            <Lucide icon="ChevronLeft" class="h-3.5 w-3.5" />
          </button>
        </div>
        <PeriodSelectPanel
            v-model="selectedPeriod"
            :label="selectedPeriodLabel"
            placeholder="انتخاب دوره گزارش‌دهی"
        />
      </div>

      <!-- comparison -->
      <div class="setup-field">
        <div class="setup-label-row">
          <div class="setup-label">
            <Lucide icon="GitCompare" class="h-3.5 w-3.5" />
            دوره مقایسه
          </div>
          <button
              type="button"
              role="switch"
              :aria-checked="compareEnabled"
              class="toggle"
              :class="{ on: compareEnabled }"
              @click="compareEnabled = !compareEnabled"
          >
            <span class="toggle-knob" />
          </button>
        </div>

        <button
            type="button"
            class="compare-prev"
            :class="{ active: isComparingPrevious }"
            @click="compareWithPrevious"
        >
          <Lucide icon="ArrowLeftRight" class="h-3.5 w-3.5" />
          مقایسه با دوره قبل
        </button>

        <div v-if="!compareEnabled" class="setup-empty">
          {{
            reportType === 'comparative'
              ? 'برای گزارش مقایسه‌ای، مقایسه را فعال و دوره مقایسه را انتخاب کنید'
              : 'برای مقایسه دو دوره، مقایسه را فعال کنید'
          }}
        </div>
        <template v-else>
          <p class="setup-note">
            <Lucide icon="Lock" class="me-1 inline h-3 w-3" />
            مقایسه با دوره هم‌نوع ({{ comparisonTypeLabel }} ↔ {{ comparisonTypeLabel }}) انجام می‌شود
          </p>
          <PeriodSelectPanel
              v-model="comparePeriod"
              :label="comparePeriodLabel"
              placeholder="انتخاب دوره مقایسه"
              :types="compareTypes"
          />
          <p v-if="compareInvalid" class="setup-error">
            <Lucide icon="AlertTriangle" class="h-3 w-3 flex-none" />
            دوره مقایسه باید با دوره اصلی متفاوت باشد
          </p>
        </template>
      </div>

      <!-- summary + generate -->
      <div class="setup-summary">
        <div class="setup-summary-row">
          <span class="ss-label">دوره جاری</span>
          <span class="ss-value">{{ selectedPeriodLabel || '—' }}</span>
          <span v-if="selectedPeriod" class="ss-type">{{ PERIOD_TYPE_FA[selectedPeriod.type] ?? selectedPeriod.type }}</span>
        </div>
        <div v-if="compareEnabled && comparePeriod && !compareInvalid" class="setup-summary-row">
          <span class="ss-label">دوره مقایسه</span>
          <span class="ss-value">{{ comparePeriodLabel }}</span>
          <span class="ss-type">{{ PERIOD_TYPE_FA[comparePeriod.type] ?? comparePeriod.type }}</span>
        </div>
      </div>

      <button
          type="button"
          class="setup-generate"
          :disabled="!canGenerate"
          @click="generateReport"
      >
        <Lucide icon="Sparkles" class="h-4 w-4" />
        تولید گزارش
      </button>
      <p v-if="!selectedPeriod" class="setup-error center">ابتدا دوره گزارش‌دهی را انتخاب کنید</p>
      <p
          v-else-if="reportType === 'comparative' && (!compareEnabled || !comparePeriod)"
          class="setup-error center"
      >برای گزارش مقایسه‌ای، مقایسه را فعال و دوره مقایسه را انتخاب کنید</p>
    </div>
  </div>

  <!-- ======================= REPORT ======================= -->
  <template v-else>
    <div v-if="loading" class="py-12 text-center">{{ 'در حال دریافت گزارش…' }}</div>
    <div v-else-if="error" class="py-12 text-center text-red-600">
      {{ error }}
      <div class="mt-3 flex items-center justify-center gap-2">
        <button
            class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
            @click="loadReport"
        >تلاش مجدد</button>
        <button
            class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
            @click="backToSettings"
        >تغییر تنظیمات</button>
      </div>
    </div>
    <div v-else-if="!data" class="py-12 text-center text-slate-400">
      داده‌ای برای گزارش موجود نیست.
      <div class="mt-3">
        <button
            class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
            @click="backToSettings"
        >تغییر تنظیمات</button>
      </div>
    </div>

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
      <button class="download-btn secondary" :disabled="isGenerating" @click="backToSettings">
        <Lucide icon="Settings2" class="h-4 w-4" />
        <span>تنظیمات دوره</span>
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
    <!-- hidden layout source; buildPages() measures it and splits each section
         into exact-A4 pages inside #sustainability-report-wrapper -->
    <div class="report-source" id="sustainability-report-source" aria-hidden="true">
      <div
          v-for="(pg, i) in pageGroups"
          :key="pg.key"
          class="page page-source"
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
                <Lucide
                    :icon="capitalMeta(s.data.capital.capitalType).icon"
                    class="w-4 h-4"
                    :style="{ color: capitalMeta(s.data.capital.capitalType).color }"
                />
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
              <div class="kpi-value" style="color: rgb(var(--color-primary))">{{ fmtScore(summary?.avgScore) }}</div>
              <div class="kpi-sub">از ۱۰۰</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">تکمیل داده</div>
              <div class="kpi-value" style="color: rgb(var(--color-primary))">{{ fmtScore(summary?.dataCompletion) }}٪</div>
              <div class="kpi-sub">{{ faNum(summary?.indicatorsWithData) }} از {{ faNum(summary?.indicators) }} شاخص</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">حوزه‌ها</div>
              <div class="kpi-value">{{ faNum(summary?.domains) }}</div>
              <div class="kpi-sub">{{ faNum(summary?.components) }} جزء</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">قابلیت‌ها</div>
              <div class="kpi-value">{{ faNum(summary?.capabilities) }}</div>
              <div class="kpi-sub">شامل شاخص‌های کلیدی</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">شاخص‌های دارای داده</div>
              <div class="kpi-value">{{ faNum(summary?.indicatorsWithData) }}</div>
              <div class="kpi-sub">{{ pctOf(summary?.indicatorsWithData, summary?.indicators) }} از کل شاخص‌ها</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">اهداف محقق‌شده</div>
              <div class="kpi-value">{{ faNum(summary?.targetsMet) }}/{{ faNum(summary?.targetsTotal) }}</div>
              <div class="kpi-sub">{{ pctOf(summary?.targetsMet, summary?.targetsTotal) }} از اهداف بلوغ</div>
            </div>
          </div>

          <div class="target-bar">
            <div class="tb-head">
              <span class="tb-title">تحقق اهداف بلوغ</span>
              <span class="tb-num">{{ faNum(summary?.targetsMet) }} از {{ faNum(summary?.targetsTotal) }} · {{ pctOf(summary?.targetsMet, summary?.targetsTotal) }}</span>
            </div>
            <div class="tb-bg">
              <div
                  class="tb-fill"
                  :style="{ width: pctWidth(summary?.targetsMet, summary?.targetsTotal), background: theme.colors.light.primary }"
              />
            </div>
          </div>

          <div class="strip-title">امتیاز سرمایه‌ها</div>
          <div class="capital-strip">
            <div v-for="s in capitalSections" :key="s.key" class="cap-strip-row">
              <div class="csr-name">
                <span class="csr-emoji" :style="{ background: hexToRgba(capitalMeta(s.data.capital.capitalType).color, 0.14) }">
                  <Lucide
                      :icon="capitalMeta(s.data.capital.capitalType).icon"
                      class="w-3.5 h-3.5"
                      :style="{ color: capitalMeta(s.data.capital.capitalType).color }"
                  />
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
              <span v-if="dataPct(s.data.capital) != null" class="csr-compl" :title="`تکمیل داده: ${dataPct(s.data.capital)}٪`">
                {{ faNum(dataPct(s.data.capital)) }}٪
              </span>
              <span
                  v-if="deltaDir(s.data.capital) !== 'none'"
                  class="delta-badge"
                  :class="deltaDir(s.data.capital) === 'up' ? 'delta-up' : deltaDir(s.data.capital) === 'down' ? 'delta-down' : ''"
              >
                <Lucide v-if="deltaDir(s.data.capital) === 'up'" icon="ArrowUp" class="w-[10px] h-[10px]" />
                <Lucide v-else-if="deltaDir(s.data.capital) === 'down'" icon="ArrowDown" class="w-[10px] h-[10px]" />
                {{ deltaAbs(s.data.capital) }}
              </span>
            </div>
          </div>
        </template>

        <!-- ================= NARRATIVE (governance) ================= -->
        <template v-else-if="pg.type === 'narrative'">
          <div class="page-header">
            <div>
              <div class="page-section-title">{{ governance?.title }}</div>
              <div class="page-section-sub" dir="ltr">{{ governance?.titleEn }}</div>
            </div>
            <div class="header-meta">
              <div class="hm-label">دوره</div>
              <div class="hm-value">{{ periodLabel }}</div>
            </div>
          </div>
          <div class="narrative-page">
            <div class="quote-mark">“</div>
            <p class="narrative-long">{{ governance?.description }}</p>
          </div>
          <div class="gov-bands">
            <div class="gov-band">
              <Lucide icon="Target" class="w-5 h-5 gb-icon" :style="{ color: theme.colors.light.primary }" />
              <div>
                <div class="gb-title">راهبرد و نظارت</div>
                <div class="gb-text">شفافیت، پاسخگویی و نظارت مستمر بر موضوعات پایداری در سطح هیئت‌مدیره</div>
              </div>
            </div>
            <div class="gov-band">
              <Lucide icon="Scale" class="w-5 h-5 gb-icon" :style="{ color: theme.colors.light.primary }" />
              <div>
                <div class="gb-title">اخلاق و تطبیق</div>
                <div class="gb-text">رعایت الزامات قانونی، استانداردهای رفتاری و مدیریت مسئولانه ریسک</div>
              </div>
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
                >
                  <Lucide
                      :icon="capitalMeta(capitalsByKey[pg.key].capitalType).icon"
                      class="w-5 h-5"
                      :style="{ color: capitalMeta(capitalsByKey[pg.key].capitalType).color }"
                  />
                </div>
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
                  <span class="mat-dot" :style="{ background: capitalsByKey[pg.key].maturity.color }" />
                </div>
                <span
                    v-if="deltaDir(capitalsByKey[pg.key]) !== 'none'"
                    class="delta-badge"
                    :class="deltaDir(capitalsByKey[pg.key]) === 'up' ? 'delta-up' : deltaDir(capitalsByKey[pg.key]) === 'down' ? 'delta-down' : ''"
                >
                  <Lucide v-if="deltaDir(capitalsByKey[pg.key]) === 'up'" icon="ArrowUp" class="w-[10px] h-[10px]" />
                  <Lucide v-else-if="deltaDir(capitalsByKey[pg.key]) === 'down'" icon="ArrowDown" class="w-[10px] h-[10px]" />
                  {{ deltaAbs(capitalsByKey[pg.key]) }}
                </span>
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
                <div v-if="dataPct(capitalsByKey[pg.key]) != null" class="cq-item cq-compl">
                  <div class="cq-num" :style="{ color: theme.colors.light.primary }">{{ faNum(dataPct(capitalsByKey[pg.key])) }}٪</div>
                  <div class="cq-lbl">تکمیل داده</div>
                  <div class="cq-mini-bar">
                    <div
                        class="cq-mini-fill"
                        :style="{ width: Math.min(dataPct(capitalsByKey[pg.key]) ?? 0, 100) + '%' }"
                    />
                  </div>
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
                    <span class="mat-dot" :style="{ background: dom.maturity.color }" />
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
                      v-if="deltaDir(dom) !== 'none'"
                      class="delta-mini"
                      :class="deltaDir(dom) === 'up' ? 'delta-up' : deltaDir(dom) === 'down' ? 'delta-down' : ''"
                  >
                    <Lucide v-if="deltaDir(dom) === 'up'" icon="ArrowUp" class="w-[10px] h-[10px]" />
                    <Lucide v-else-if="deltaDir(dom) === 'down'" icon="ArrowDown" class="w-[10px] h-[10px]" />
                    {{ deltaAbs(dom) }}
                  </span>
                  </div>
                </div>

                <div v-if="dom.components?.length" class="components">
                  <div v-for="comp in dom.components" :key="comp.slug" class="comp-block">
                    <div class="comp-row">
                      <span class="comp-name">
                      <Lucide
                          icon="ChevronLeft"
                          class="w-3 h-3 flex-none"
                          :style="{ color: capitalMeta(capitalsByKey[pg.key].capitalType).color }"
                      />
                      <span class="comp-title">{{ comp.title }}</span>
                    </span>
                      <div class="mini-bar slim">
                        <div
                            class="mini-bar-fill"
                            :style="{ width: (comp.score ?? 0) + '%', background: capitalMeta(capitalsByKey[pg.key].capitalType).color }"
                        />
                      </div>
                      <span class="comp-score">{{ fmtScore(comp.score) }}</span>
                    <span v-if="deltaDir(comp) !== 'none'" class="delta-mini" :class="deltaDir(comp) === 'up' ? 'delta-up' : deltaDir(comp) === 'down' ? 'delta-down' : ''">
                      <Lucide v-if="deltaDir(comp) === 'up'" icon="ArrowUp" class="w-[10px] h-[10px]" />
                      <Lucide v-else-if="deltaDir(comp) === 'down'" icon="ArrowDown" class="w-[10px] h-[10px]" />
                      {{ deltaAbs(comp) }}
                    </span>
                    </div>
                    <div v-if="comp.capabilities?.length" class="capab-list">
                      <div v-for="capab in comp.capabilities" :key="capab.slug" class="capab-row">
                        <span class="capab-name">{{ capab.title }}</span>
                      <span v-if="capab.indicatorCount != null" class="capab-ind">
                        <span class="capab-ind-num">{{ faNum(capab.indicatorsWithData) }}/{{ faNum(capab.indicatorCount) }}</span>
                        <span v-if="dataPct(capab) != null" class="capab-ind-pct" :title="`تکمیل داده: ${dataPct(capab)}٪`">
                          {{ faNum(dataPct(capab)) }}٪
                        </span>
                      </span>
                      <span v-if="capab.meetsTarget" class="target-ok" title="مطابق هدف">
                        <Lucide icon="Check" class="w-3 h-3" />
                      </span>
                      <span v-if="capab.risks?.summary?.total" class="risk-chip">
                        <Lucide icon="ShieldAlert" class="w-3 h-3" />
                        {{ faNum(capab.risks.summary.total) }}
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
            <div class="narrative-box risk-desc">{{ riskSection?.description }}</div>

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
                  <span class="bar-count">{{ faNum(count) }} <span class="bar-pct">{{ pctOf(count, riskData.total) }}</span></span>
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
                  <span class="bar-count">{{ faNum(count) }} <span class="bar-pct">{{ pctOf(count, riskData.total) }}</span></span>
                </div>
              </div>
            </div>

            <div class="dist-card">
              <div class="dist-title">توزیع ریسک بر اساس سرمایه</div>
              <div v-for="item in capitalRisks" :key="item.slug" class="bar-row">
                <span class="bar-label">
                  <Lucide :icon="item.icon" class="w-3.5 h-3.5" :style="{ color: item.color }" />
                  {{ item.title }}
                </span>
                <div class="bar-bg">
                  <div
                      class="bar-fill"
                      :style="{ width: barPct(item.count, maxCount(capitalRisks.map((r) => r.count))), background: item.color }"
                  />
                </div>
                <span class="bar-count">{{ faNum(item.count) }} <span class="bar-pct">{{ pctOf(item.count, riskData.total) }}</span></span>
              </div>
            </div>

            <div class="risk-register">
              <div class="register-head">
                <div class="register-title">ثبت تفصیلی ریسک‌ها</div>
                <div class="register-total">{{ faNum(riskRegister.length) }} ریسک</div>
              </div>
              <div v-for="g in riskRegisterByCapital" :key="g.slug" class="register-group">
                <div class="register-cap">
                  <span class="csr-emoji" :style="{ background: hexToRgba(capitalMeta(g.capitalType).color, 0.14) }">
                    <Lucide
                        :icon="capitalMeta(g.capitalType).icon"
                        class="w-3.5 h-3.5"
                        :style="{ color: capitalMeta(g.capitalType).color }"
                    />
                  </span>
                  <span class="register-cap-title">{{ g.title }}</span>
                  <span class="register-cap-count">{{ faNum(g.total) }}</span>
                </div>
                <table class="register-table">
                  <thead>
                  <tr>
                    <th>عنوان ریسک</th>
                    <th>سطح</th>
                    <th>وضعیت</th>
                    <th>نوع</th>
                    <th>شدت</th>
                    <th>اثر × احتمال</th>
                    <th>راهبرد</th>
                    <th>مهلت</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="r in g.risks" :key="r.slug" class="reg-row">
                    <td class="reg-title">
                      <div class="reg-title-main">{{ r.title }}</div>
                      <div class="reg-title-sub">{{ r.domainTitle }} · {{ r.capabilityTitle }}</div>
                    </td>
                    <td>
                      <span
                          class="reg-level"
                          :style="{ background: hexToRgba(RISK_LEVEL_COLOR[r.level] ?? '#94a3b8', 0.14), color: RISK_LEVEL_COLOR[r.level] ?? '#64748b' }"
                      >{{ RISK_LEVEL_LABEL[r.level] ?? 'نامشخص' }}</span>
                    </td>
                    <td>
                      <span
                          class="reg-state"
                          :style="{ background: hexToRgba(RISK_STATE_COLOR[r.state] ?? '#94a3b8', 0.14), color: RISK_STATE_COLOR[r.state] ?? '#64748b' }"
                      >{{ RISK_STATE_LABEL[r.state] ?? r.state }}</span>
                    </td>
                    <td class="reg-type">{{ RISK_TYPE_LABEL[r.riskType] ?? (r.riskType ?? '—') }}</td>
                    <td class="reg-score">{{ faNum(r.score) }}</td>
                    <td class="reg-dim">{{ faNum(r.impact) }}×{{ faNum(r.likelihood) }}</td>
                    <td class="reg-treat">{{ TREATMENT_LABEL[r.treatmentStrategy] ?? '—' }}</td>
                    <td class="reg-deadline">{{ faDate(r.deadline) }}</td>
                  </tr>
                  </tbody>
                </table>
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
            <div class="narrative-box">{{ comparativeSection?.description }}</div>

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
                    <Lucide
                        :icon="capitalMeta(row.capitalType).icon"
                        class="w-3.5 h-3.5"
                        :style="{ color: capitalMeta(row.capitalType).color }"
                    />
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
                  <Lucide v-if="row.current - row.comparison > 0" icon="ArrowUp" class="w-[10px] h-[10px]" />
                  <Lucide v-else-if="row.current - row.comparison < 0" icon="ArrowDown" class="w-[10px] h-[10px]" />
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

    <!-- paginated A4 pages are built here by buildPages() -->
    <div class="report-wrapper" id="sustainability-report-wrapper"></div>
    </div>
  </template>
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
  padding: 10px 22px;
  background: rgba(255, 255, 255, 0.92);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
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
  white-space: nowrap;
}
.seg button.active {
  background: #fff;
  color: rgb(var(--color-primary));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-weight: 700;
}
.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgb(var(--color-primary));
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
.download-btn:hover:not(:disabled) { background: rgb(var(--color-primary-hover)); }
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
  background: rgb(var(--color-primary));
  border-radius: 3px;
  transition: width 0.3s;
}
.download-note { font-size: 11px; color: #8892a0; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }

/* ---------------- report setup (filter panel) ---------------- */
.report-setup {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 44px 16px;
}
.setup-card {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.05);
  padding: 24px 26px;
}
.setup-head {
  display: flex;
  align-items: center;
  gap: 13px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 20px;
}
.setup-badge {
  width: 42px;
  height: 42px;
  flex: none;
  border-radius: 10px;
  background: rgb(var(--color-primary-muted));
  color: rgb(var(--color-primary));
  display: flex;
  align-items: center;
  justify-content: center;
}
.setup-title { font-size: 17px; font-weight: 800; color: #0f172a; }
.setup-sub { font-size: 11.5px; color: #94a3b8; margin-top: 3px; }
.setup-field { margin-bottom: 20px; }
.setup-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }
.setup-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 9px;
}
.setup-label-row .setup-label { margin-bottom: 0; }
.setup-hint { font-size: 10.5px; color: #94a3b8; margin-top: 8px; line-height: 1.8; }
.seg.seg-wide { display: flex; width: 100%; }
.seg-wide button { flex: 1; }
.year-strip {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  padding: 2px 0;
  scrollbar-width: thin;
}
.year-chip {
  flex: none;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 4px 11px;
  font-size: 11px;
  color: #64748b;
  transition: all 0.15s;
}
.year-chip:hover { background: #f8fafc; }
.year-chip.active { border-color: rgb(var(--color-primary) / 0.4); background: rgb(var(--color-primary-muted)); color: rgb(var(--color-primary)); font-weight: 700; }
.year-nav {
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
.year-nav:hover { background: #f8fafc; color: #475569; }
.toggle {
  position: relative;
  display: inline-flex;
  height: 22px;
  width: 42px;
  flex: none;
  align-items: center;
  border-radius: 999px;
  background: #cbd5e1;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
.toggle.on { background: rgb(var(--color-primary)); }
.toggle-knob {
  position: absolute;
  right: 3px;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}
.toggle.on .toggle-knob { transform: translateX(-18px); }
.compare-prev {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 8px;
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.15s;
}
.compare-prev:hover { background: #f8fafc; }
.compare-prev.active { border-color: rgb(var(--color-primary) / 0.4); background: rgb(var(--color-primary-muted)); color: rgb(var(--color-primary)); font-weight: 700; }
.setup-empty {
  display: flex;
  min-height: 88px;
  align-items: center;
  justify-content: center;
  border: 1px dashed #dbe2e9;
  border-radius: 10px;
  padding: 12px;
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  line-height: 1.9;
}
.setup-note {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: rgb(var(--color-primary-muted));
  border: 1px solid rgb(var(--color-primary) / 0.3);
  padding: 7px 10px;
  font-size: 11px;
  color: rgb(var(--color-primary));
}
.setup-note svg { color: rgb(var(--color-primary)); }
.setup-error {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  font-size: 11px;
  color: #dc2626;
}
.setup-error.center { justify-content: center; margin-top: 10px; }
.setup-summary {
  margin-top: 4px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.setup-summary-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.ss-label { color: #94a3b8; font-size: 10.5px; min-width: 64px; }
.ss-value { font-weight: 700; color: #0f172a; }
.ss-type {
  margin-left: auto;
  border-radius: 999px;
  background: rgb(var(--color-primary-muted));
  color: rgb(var(--color-primary));
  font-size: 10px;
  font-weight: 700;
  padding: 2px 9px;
}
.setup-generate {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  border: none;
  border-radius: 10px;
  background: rgb(var(--color-primary));
  color: #fff;
  padding: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s, transform 0.1s;
  box-shadow: 0 8px 20px rgba(15, 118, 110, 0.25);
}
.setup-generate:hover:not(:disabled) { background: rgb(var(--color-primary-hover)); }
.setup-generate:active:not(:disabled) { transform: translateY(1px); }
.setup-generate:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
.download-btn.secondary {
  background: #fff;
  color: rgb(var(--color-primary));
  border: 1px solid #cbd5e1;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}
.download-btn.secondary:hover:not(:disabled) { background: #f8fafc; }

/* ---------------- wrapper + page ---------------- */
.report-wrapper {
  background: #eceff2;
  padding: 28px;
  min-height: 100vh;
}

/* hidden layout source used by buildPages() to measure each section's content */
.report-source {
  position: absolute;
  top: 0;
  left: -99999px;
  width: 210mm;
  visibility: hidden;
  pointer-events: none;
}
.report-source .page { margin: 0; }
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
  border-bottom: 2px solid rgb(var(--color-primary));
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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-right: 3px solid rgb(var(--color-primary));
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
  color: rgb(var(--color-primary));
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
.gov-band {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 14px 16px;
}
.gb-icon { flex-shrink: 0; }
.gb-title { font-size: 12.5px; font-weight: 700; color: #0F172A; }
.gb-text { font-size: 10.5px; color: #64748B; margin-top: 4px; line-height: 1.9; }

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
  border-top: 3px solid rgb(var(--color-primary));
  border-radius: 10px;
  padding: 12px 14px;
}
.kpi-label { font-size: 10.5px; color: #64748B; }
.kpi-value { font-size: 22px; font-weight: 800; color: #0F172A; margin-top: 6px; }
.kpi-sub { font-size: 9.5px; color: #94A3B8; margin-top: 4px; }

/* target achievement bar (exec summary) */
.target-bar {
  margin-top: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 16px;
}
.tb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.tb-title { font-size: 12px; font-weight: 700; color: #0F172A; }
.tb-num { font-size: 10.5px; font-weight: 700; color: rgb(var(--color-primary)); }
.tb-bg { height: 10px; background: #EEF2F6; border-radius: 6px; overflow: hidden; }
.tb-fill { height: 100%; border-radius: 6px; }

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
.csr-compl {
  font-size: 10px;
  font-weight: 700;
  color: rgb(var(--color-primary));
  background: rgb(var(--color-primary-muted));
  border: 1px solid rgb(var(--color-primary) / 0.3);
  border-radius: 999px;
  padding: 2px 9px;
  flex-shrink: 0;
}

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
.delta-up { background: rgb(var(--color-status-low) / 0.12); color: rgb(var(--color-status-low)); }
.delta-down { background: rgb(var(--color-status-critical) / 0.1); color: rgb(var(--color-status-critical)); }
.delta-mini {
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
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
.maturity-mini {
  font-size: 10px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.mat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

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
.cq-compl { min-width: 96px; }
.cq-mini-bar {
  height: 4px;
  background: #EEF2F6;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 5px;
}
.cq-mini-fill { height: 100%; background: rgb(var(--color-primary)); border-radius: 3px; }
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
.comp-name {
  font-size: 11px;
  font-weight: 600;
  color: #334155;
  width: 250px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.comp-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
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
.capab-ind {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 999px;
  padding: 1px 8px;
  flex-shrink: 0;
}
.capab-ind-num { font-size: 9px; font-weight: 700; color: #475569; }
.capab-ind-pct {
  font-size: 8.5px;
  font-weight: 700;
  color: rgb(var(--color-primary));
  background: rgb(var(--color-primary-muted));
  border-radius: 999px;
  padding: 0 5px;
}
.capab-score { font-weight: 700; color: #475569; width: 26px; text-align: center; }
.target-ok {
  color: #059669;
  font-weight: 800;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
}
.risk-chip {
  font-size: 9px;
  font-weight: 600;
  color: rgb(var(--color-status-critical));
  background: rgb(var(--color-status-critical) / 0.1);
  border-radius: 999px;
  padding: 1px 7px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
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
  border-top: 3px solid rgb(var(--color-primary));
  border-radius: 10px;
  padding: 14px;
  text-align: center;
  background: #fff;
}
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
.bar-label {
  width: 110px;
  font-size: 10.5px;
  color: #334155;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.bar-bg { flex: 1; height: 12px; background: #F1F5F9; border-radius: 6px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 6px; }
.bar-count { width: 64px; text-align: center; font-size: 11.5px; font-weight: 700; color: #0F172A; }
.bar-pct { font-size: 9px; color: #94A3B8; font-weight: 600; }
.risk-desc { margin-bottom: 14px; }

/* ---------------- risk register ---------------- */
.risk-register { margin-top: 12px; }
.register-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.register-title { font-size: 13px; font-weight: 800; color: #0F172A; }
.register-total {
  font-size: 10px;
  font-weight: 700;
  color: rgb(var(--color-status-critical));
  background: rgb(var(--color-status-critical) / 0.1);
  border: 1px solid rgb(var(--color-status-critical) / 0.3);
  border-radius: 999px;
  padding: 3px 12px;
}
.register-group {
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  margin-bottom: 14px;
  overflow: hidden;
}
.register-cap {
  display: flex;
  align-items: center;
  gap: 9px;
  background: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
  padding: 9px 14px;
}
.register-cap-title { font-size: 12px; font-weight: 800; color: #0F172A; }
.register-cap-count {
  font-size: 10px;
  font-weight: 700;
  color: #475569;
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 999px;
  padding: 1px 9px;
}
.register-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.register-table th {
  font-size: 9px;
  color: #64748B;
  font-weight: 600;
  text-align: right;
  background: #FCFDFE;
  border-bottom: 1px solid #E2E8F0;
  padding: 7px 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.register-table th:nth-child(1) { width: 33%; }
.register-table th:nth-child(2) { width: 10%; }
.register-table th:nth-child(3) { width: 10%; }
.register-table th:nth-child(4) { width: 8%; }
.register-table th:nth-child(5) { width: 7%; }
.register-table th:nth-child(6) { width: 8%; }
.register-table th:nth-child(7) { width: 12%; }
.register-table th:nth-child(8) { width: 12%; }
.register-table td {
  font-size: 9.5px;
  color: #334155;
  border-bottom: 1px solid #F1F5F9;
  padding: 7px 6px;
  vertical-align: middle;
  overflow-wrap: anywhere;
}
.register-table tr:last-child td { border-bottom: none; }
.reg-row:hover td { background: #FAFBFC; }
.reg-title { min-width: 0; width: auto; }
.reg-title-main {
  font-size: 10.5px;
  font-weight: 700;
  color: #0F172A;
  line-height: 1.6;
}
.reg-title-sub {
  font-size: 8.5px;
  color: #94A3B8;
  margin-top: 2px;
  line-height: 1.6;
}
.reg-level,
.reg-state {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  border-radius: 999px;
  padding: 2px 9px;
  white-space: nowrap;
}
.reg-type { font-size: 9.5px; color: #64748B; white-space: nowrap; }
.reg-score { font-size: 11px; font-weight: 800; color: #0F172A; white-space: nowrap; }
.reg-dim { font-size: 9.5px; color: #64748B; white-space: nowrap; }
.reg-treat { font-size: 9.5px; color: #475569; white-space: nowrap; }
.reg-deadline { font-size: 9.5px; color: #64748B; white-space: nowrap; }

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
.cs-arrow { font-size: 20px; color: rgb(var(--color-primary)); }
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
