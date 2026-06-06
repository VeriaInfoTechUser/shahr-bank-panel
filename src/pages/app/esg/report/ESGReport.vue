<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-emerald-700 to-teal-700 text-white py-12">
      <div class="max-w-7xl mx-auto px-6 text-center">
        <h1 class="text-5xl font-bold mb-3">گزارش پایداری ESG</h1>
        <p class="text-xl opacity-90">{{ data.reporting_period }}</p>
        <p class="mt-2">آخرین به‌روزرسانی: {{ data.last_updated }}</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-10">
      <!-- Executive Summary -->
      <div class="bg-white rounded-2xl shadow-xl p-8 mb-12">
        <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <span class="text-emerald-600">📊</span> خلاصه اجرایی
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="text-5xl font-bold text-emerald-600">{{ data.total_kpis }}</div>
            <div class="text-gray-600 mt-2">کل KPIها</div>
          </div>
          <div class="text-center">
            <div class="text-5xl font-bold text-teal-600">{{ overallCompletion }}%</div>
            <div class="text-gray-600 mt-2">درصد تکمیل</div>
          </div>
          <div class="text-center">
            <div class="text-5xl font-bold text-amber-600">{{ overallScore }}</div>
            <div class="text-gray-600 mt-2">امتیاز کلی</div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex gap-2 mb-8 border-b">
        <button v-for="tab in tabs" :key="tab"
                @click="activeTab = tab"
                :class="[
                  'px-6 py-3 rounded-t-xl font-medium transition-all',
                  activeTab === tab
                    ? 'bg-white shadow text-emerald-700 border-b-4 border-emerald-600'
                    : 'text-gray-600 hover:text-gray-800'
                ]">
          {{ tab === 'governance' ? 'حاکمیت' : tab === 'social' ? 'اجتماعی' : 'زیست‌محیطی' }}
        </button>
      </div>

      <!-- GOVERNANCE -->
      <section v-if="activeTab === 'governance'">
        <SectionHeader title="حاکمیت شرکتی (Governance)" icon="🏛️" />
        <SummaryCard :summary="data.governance.summary" />
        <RadarChart :data="data.governance.charts.radar_data" />
        <DomainList :domains="data.governance.domains" />
      </section>

      <!-- SOCIAL -->
      <section v-if="activeTab === 'social'">
        <SectionHeader title="مسئولیت اجتماعی (Social)" icon="👥" />
        <SummaryCard :summary="data.social.summary" />
        <RadarChart :data="data.social.charts.radar_data || []" />
        <DomainList :domains="data.social.domains" />
      </section>

      <!-- ENVIRONMENTAL -->
      <section v-if="activeTab === 'environmental'">
        <SectionHeader title="مسئولیت زیست‌محیطی (Environmental)" icon="🌍" />
        <SummaryCard :summary="data.environmental.summary" />
        <RadarChart :data="data.environmental.charts.radar_data || []" />
        <DomainList :domains="data.environmental.domains" />
      </section>

      <!-- Footer Note -->
      <div class="mt-16 text-center text-gray-500 text-sm">
        این گزارش به صورت خودکار از داده‌های سامانه ESG تولید شده است.
      </div>
    </div>

    <!-- PDF Export Button -->
    <div class="fixed bottom-8 right-8">
      <button @click="exportToPDF"
              class="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl shadow-2xl font-semibold text-lg transition-all">
        <span>📄</span>
        دانلود گزارش PDF
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import RadarChart from './RadarChart.vue'
import html2pdf from 'html2pdf.js'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {    BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer,  BarChart, TitleComponent, TooltipComponent, LegendComponent])

const props = defineProps({
  reportData: { type: Object, required: true }
})

const data = computed(() => props.reportData.data)
const activeTab = ref('governance')

const tabs = ['governance', 'social', 'environmental']

const overallCompletion = computed(() => {
  const total = data.value.governance.summary.completion +
      data.value.social.summary.completion +
      data.value.environmental.summary.completion
  return Math.round(total / 3)
})

const overallScore = computed(() => {
  const total = data.value.governance.summary.avg_score +
      data.value.social.summary.avg_score +
      data.value.environmental.summary.avg_score
  return Math.round(total / 3)
})

// Export to PDF
const exportToPDF = async () => {
  const element = document.getElementById('esg-report-content') || document.body
  try {
    const { default: html2pdf } = await import('html2pdf.js')
    const clone = element.cloneNode(true) as HTMLElement
    clone.setAttribute('data-esg-pdf-clone', '1')
    clone.style.position = 'absolute'
    clone.style.left = '-9999px'
    clone.style.top = '0'
    try { clone.style.width = (element as HTMLElement).getBoundingClientRect().width + 'px' } catch (err) {}
    clone.style.visibility = 'hidden'
    document.body.appendChild(clone)

    // Convert canvases to images using original canvas content
    const originalCanvases = Array.from((element as HTMLElement).querySelectorAll('canvas')) as HTMLCanvasElement[]
    const cloneCanvases = Array.from(clone.querySelectorAll('canvas')) as HTMLCanvasElement[]
    for (let i = 0; i < cloneCanvases.length; i++) {
      const cc = cloneCanvases[i]
      const oc = originalCanvases[i]
      try {
        let dataURL = ''
        if (oc && oc.toDataURL) dataURL = oc.toDataURL('image/png')
        else if (cc && cc.toDataURL) dataURL = cc.toDataURL('image/png')
        if (dataURL) {
          const img = document.createElement('img')
          img.src = dataURL
          img.style.width = cc.style.width || cc.width + 'px'
          img.style.height = cc.style.height || cc.height + 'px'
          cc.parentNode?.replaceChild(img, cc)
        }
      } catch (err) { console.warn('Canvas->img failed', err) }
    }

    // Sanitize styles to avoid unsupported color functions (e.g., oklch) and complex backgrounds
    const all = Array.from(clone.querySelectorAll('*')) as HTMLElement[]
    all.forEach((elem) => {
      try {
        const style = window.getComputedStyle(elem as Element)
        const bg = style.backgroundColor
        const unsafeColor = (s: string | null) => !s || s.includes('oklch') || s.includes('oklab') || s.includes('color(')
        if (bg && !unsafeColor(bg) && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          elem.style.backgroundColor = bg
        } else if (elem === clone || elem.tagName.toLowerCase() === 'body') {
          elem.style.backgroundColor = '#ffffff'
        }
        const fg = style.color
        if (fg && !unsafeColor(fg)) elem.style.color = fg
        elem.style.backgroundImage = 'none'
        elem.style.boxShadow = 'none'
        elem.style.filter = 'none'
        if (style.borderColor && style.borderColor !== 'transparent') elem.style.borderColor = style.borderColor
      } catch (err) {}
    })

    const opt = {
      margin: [15, 15, 15, 15],
      filename: `ESG-Report-${data.value.reporting_period}.pdf`,
      image: { type: 'jpeg', quality: 0.97 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    }

    const worker = html2pdf().set(opt).from(clone)
    worker.toPdf().get('pdf').then((pdf) => {
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
      const existing = document.querySelector('[data-esg-pdf-clone="1"]')
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing)
    }).catch((err) => {
      console.error(err)
      const existing = document.querySelector('[data-esg-pdf-clone="1"]')
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing)
      throw err
    })
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
      }
      pdf.save(opt.filename)
    })
  } catch (err) {
    console.error('PDF export error:', err)
    alert('PDF export failed')
  }
}
</script>

<style scoped>
/* Custom styles for better print */
@media print {
  .fixed, .no-print { display: none !important; }
  .page-break { page-break-before: always; break-before: page; }
  .pdf-page { page-break-after: auto; break-after: auto; }
  html, body { background: #fff !important; color: #000 !important; -webkit-print-color-adjust: exact; }
  .max-w-7xl { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 auto !important; }
  .h-96 { height: 360px !important; } /* ensure charts fit */
  .bg-gradient-to-r, .bg-emerald-600 { background: transparent !important; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; }
  th { background: #f3f4f6; }
}
</style>