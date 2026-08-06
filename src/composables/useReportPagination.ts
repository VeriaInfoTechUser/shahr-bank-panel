import { ref } from 'vue'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// ---------------------------------------------------------------------------
// Shared formatting helpers (used by the report pages)
// ---------------------------------------------------------------------------
export function faNum(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return '—'
  return Number(v).toLocaleString('fa-IR')
}
export function round1(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return 0
  return Math.round(n * 10) / 10
}
export function fmtScore(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return '—'
  return faNum(round1(v))
}
export function barPct(count: number, max: number) {
  return max > 0 ? Math.max(Math.round((count / max) * 100), 4) + '%' : '4%'
}
export function maxCount(values: number[]) {
  return Math.max(...values, 1)
}
export function pctWidth(part: number | null | undefined, total: number | null | undefined) {
  if (part == null || total == null || total === 0) return '0%'
  return Math.min(Math.round((part / total) * 100), 100) + '%'
}
export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
export function faDate(d?: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  if (!y || !m || !day) return faNum(Number(d))
  return `${faNum(Number(y))}/${faNum(Number(m))}/${faNum(Number(day))}`
}

// ---------------------------------------------------------------------------
// A4 pagination engine
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

const ORPHAN_HEADINGS = ['page-header', 'strip-title', 'register-cap', 'domain-head', 'register-head', 'report-title']

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
    cls.contains('bar-row') ||
    cls.contains('gauge-wrap') ||
    cls.contains('trend-chart') ||
    cls.contains('heat-grid') ||
    cls.contains('matrix-grid')
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

// ---------------------------------------------------------------------------
// Composable: buildPages + downloadPDF for a report root
// ---------------------------------------------------------------------------
export function useReportPagination(opts: {
  wrapperId: string
  sourceId: string
  fileName: () => string
}) {
  const isGenerating = ref(false)
  const progress = ref(0)

  function buildPages() {
    // never rebuild the pagination while a PDF capture is in flight, otherwise
    // the captured page nodes would be detached and rasterized blank
    if (isGenerating.value) return
    const wrapper = document.getElementById(opts.wrapperId)
    const source = document.getElementById(opts.sourceId)
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

  async function downloadPDF() {
    isGenerating.value = true
    progress.value = 0
    try {
      // Make sure the Vazirmatn web font is fully loaded before capturing,
      // otherwise html2canvas rasterizes with fallback-font metrics.
      try {
        await document.fonts.ready
        await Promise.all(
          Array.from(document.fonts).map((f) => f.load().catch(() => undefined))
        )
      } catch (e) {
        console.warn('Font preload skipped:', e)
      }

      const wrapper = document.getElementById(opts.wrapperId)
      if (!wrapper) return
      const pages = wrapper.querySelectorAll('.page') as NodeListOf<HTMLElement>
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const A4_W = 210
      const A4_H = 297

      let firstPage = true
      for (let i = 0; i < pages.length; i++) {
        progress.value = Math.round(((i + 1) / pages.length) * 100)
        const page = pages[i]

        // Adaptive scale: render at 2x for crisp text, but scale down when the
        // page is very tall so the canvas never exceeds browser limits.
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
            // Never clip content during the raster.
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

        // Slice the canvas into exact A4-height bands.
        const pxPerMm = canvas.width / A4_W
        const sliceHpx = Math.round(A4_H * pxPerMm)
        const sliceCount = Math.max(1, Math.ceil(canvas.height / sliceHpx))
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

      pdf.save(opts.fileName())
    } catch (e) {
      console.error('PDF generation failed:', e)
      alert('خطا در تولید PDF. لطفاً دوباره تلاش کنید.')
    } finally {
      isGenerating.value = false
      progress.value = 0
    }
  }

  return { isGenerating, progress, buildPages, downloadPDF }
}
