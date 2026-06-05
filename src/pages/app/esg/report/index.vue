<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { esgRepo } from '@/core/repositories/esgRepo'
import { transformReportData, type TransformedReportData } from '@/utils/esgDataTransformer'

import PillarSummary from './PillarSummary.vue'
import SectionHeader from './SectionHeader.vue'
import DomainList from './DomainList.vue'

const reportData = ref<TransformedReportData | null>(null)
const isLoading = ref(true)
const isExporting = ref(false)

onMounted(async () => {
  try {
    const response = await esgRepo.report({})
    const actualData = response?.data || response
    reportData.value = transformReportData(actualData)
  } catch (error) {
    console.error('Failed to fetch report:', error)
  } finally {
    isLoading.value = false
  }
})

/* =========================
   SCORE
========================= */
const overallScore = computed(() => {
  if (!reportData.value) return 0

  const scores = [
    reportData.value.environmental.summary?.avg_score,
    reportData.value.social.summary?.avg_score,
    reportData.value.governance.summary?.avg_score,
  ].filter((v) => v != null && v > 0)

  if (!scores.length) return 0
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
})

const scoreLabel = computed(() => {
  const s = overallScore.value

  if (s >= 85) return { text: 'Excellent', color: '#059669' }
  if (s >= 70) return { text: 'Good', color: '#2563eb' }
  if (s >= 55) return { text: 'Medium', color: '#d97706' }
  return { text: 'Needs Improvement', color: '#dc2626' }
})

/* =========================
   PILLARS
========================= */
const pillarData = computed(() => {
  if (!reportData.value) return { env: null, soc: null, gov: null }

  return {
    env: {
      icon: 'leaf',
      title: 'Environmental',
      summary: reportData.value.environmental.summary,
    },
    soc: {
      icon: 'users',
      title: 'Social',
      summary: reportData.value.social.summary,
    },
    gov: {
      icon: 'building',
      title: 'Governance',
      summary: reportData.value.governance.summary,
    },
  }
})

/* =========================
   TOTAL
========================= */
const totalDomains = computed(() => {
  if (!reportData.value) return 0

  return (
      (reportData.value.environmental.domains?.length || 0) +
      (reportData.value.social.domains?.length || 0) +
      (reportData.value.governance.domains?.length || 0)
  )
})

/* =========================
   EXPORT PDF
========================= */
async function exportPDF() {
  isExporting.value = true

  try {
    const { default: html2pdf } = await import('html2pdf.js')
    const el = document.getElementById('esg-pdf-root')
    if (!el) throw new Error('PDF root not found')

    const clone = el.cloneNode(true) as HTMLElement

    // Convert canvases and svgs for reliable PDF rendering
    const canvases = Array.from(clone.querySelectorAll('canvas')) as HTMLCanvasElement[]
    for (const canvas of canvases) {
      try {
        const dataURL = canvas.toDataURL('image/png')
        const img = document.createElement('img')
        img.src = dataURL
        img.style.width = canvas.style.width || canvas.width + 'px'
        img.style.height = canvas.style.height || canvas.height + 'px'
        canvas.parentNode?.replaceChild(img, canvas)
      } catch (err) {
        console.warn('Canvas to image failed during PDF export', err)
      }
    }

    const svgs = Array.from(clone.querySelectorAll('svg'))
    for (const svg of svgs) {
      try {
        const xml = new XMLSerializer().serializeToString(svg)
        const svg64 = btoa(unescape(encodeURIComponent(xml)))
        const img = document.createElement('img')
        img.src = 'data:image/svg+xml;base64,' + svg64
        img.style.width = (svg as HTMLElement).style.width || '100%'
        img.style.height = (svg as HTMLElement).style.height || 'auto'
        svg.parentNode?.replaceChild(img, svg)
      } catch (err) {
        // ignore
      }
    }

    const all = clone.querySelectorAll('*')
    all.forEach((elem) => {
      const el = elem as HTMLElement
      const style = window.getComputedStyle(elem as Element)

      if (style.backgroundColor.includes('oklch')) el.style.backgroundColor = '#fff'
      if (style.color.includes('oklch')) el.style.color = '#0f172a'
    })

    const opt = {
      margin: [12, 12],
      filename: `ESG-Report-${reportData.value?.meta.reporting_period || 'report'}.pdf`,
      image: { type: 'jpeg', quality: 0.97 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    }

    // Generate PDF and add page numbers
    const worker = html2pdf().set(opt).from(clone)
    worker.toPdf().get('pdf').then((pdf: any) => {
      const totalPages = pdf.internal.getNumberOfPages()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.setFontSize(9)
      pdf.setTextColor(100)
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
      }
      pdf.save(opt.filename)
    })
  } catch (e) {
    console.error(e)
    alert('PDF export failed')
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div dir="rtl" class="min-h-screen bg-slate-100 font-sans">

    <!-- ================= LOADING ================= -->
    <div v-if="isLoading" class="h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="w-10 h-10 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-slate-600">Loading report...</p>
      </div>
    </div>

    <!-- ================= ERROR ================= -->
    <div v-else-if="!reportData" class="p-10">
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-700 font-medium">Failed to load report</p>
      </div>
    </div>

    <!-- ================= CONTENT ================= -->
    <template v-else>

      <!-- TOP BAR -->
      <div class="sticky top-0 z-50 bg-white border-b">
        <div class="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div>
            <div class="text-xs text-slate-500">ESG Report</div>
            <div class="font-semibold text-slate-900">
              {{ reportData.meta.reporting_period }}
            </div>
          </div>

          <button
              @click="exportPDF"
              :disabled="isExporting"
              class="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {{ isExporting ? 'Exporting...' : 'Download PDF' }}
          </button>
        </div>
      </div>

      <!-- MAIN -->
      <div id="esg-pdf-root" class="bg-white">

        <!-- HEADER -->
        <div class="max-w-7xl mx-auto px-6 py-10 border-b">
          <h1 class="text-3xl font-bold text-slate-900">
            ESG Sustainability Dashboard
          </h1>

          <p class="text-slate-500 mt-1">
            {{ reportData.meta.reporting_period }}
          </p>

          <!-- SCORE -->
          <div class="mt-8 bg-slate-50 border rounded-xl p-6 flex justify-between items-center">
            <div>
              <div class="text-sm text-slate-500">Overall Score</div>
              <div class="text-4xl font-bold text-slate-900">
                {{ overallScore }}
              </div>
            </div>

            <div
                class="px-4 py-2 rounded-full text-sm font-medium"
                :style="`color:${scoreLabel.color}; background:${scoreLabel.color}15`"
            >
              {{ scoreLabel.text }}
            </div>
          </div>

          <!-- PILLARS -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
            <PillarSummary v-if="pillarData.env" :pillar="pillarData.env" />
            <PillarSummary v-if="pillarData.soc" :pillar="pillarData.soc" />
            <PillarSummary v-if="pillarData.gov" :pillar="pillarData.gov" />
          </div>
        </div>

        <!-- EMPTY STATE -->
        <div v-if="totalDomains === 0" class="p-10 text-center">
          <div class="text-slate-500">No ESG data available</div>
        </div>

        <!-- ENV -->
        <section v-else class="max-w-7xl mx-auto px-6 py-10 border-b">
          <SectionHeader title="Environmental" icon="leaf" />
          <DomainList :domains="reportData.environmental.domains" />
        </section>

        <!-- SOCIAL -->
        <section class="max-w-7xl mx-auto px-6 py-10 border-b">
          <SectionHeader title="Social" icon="users" />
          <DomainList :domains="reportData.social.domains" />
        </section>

        <!-- GOVERNANCE -->
        <section class="max-w-7xl mx-auto px-6 py-10 border-b">
          <SectionHeader title="Governance" icon="building" />
          <DomainList :domains="reportData.governance.domains" />
        </section>

        <!-- FOOTER -->
        <footer class="max-w-7xl mx-auto px-6 py-10 text-center text-slate-500 text-sm">
          ESG Report • {{ new Date().toLocaleDateString('fa-IR') }}
        </footer>

      </div>
    </template>
  </div>
</template>