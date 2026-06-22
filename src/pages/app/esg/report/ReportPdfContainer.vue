<script setup lang="ts">
import { computed, ref } from 'vue'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  IconPlant2,
  IconUsers,
  IconBuildingBank,
  IconLeaf
} from '@tabler/icons-vue'

const props = defineProps<{ response: any }>()

const data = computed(() => props.response?.data || null)
const meta = computed(() => data.value?.meta || {})
const keyFigures = computed(() => data.value?.key_figures || [])
const narratives = computed(() => data.value?.narratives || {})
const envSections = computed(() => data.value?.environmental || {})
const socialSections = computed(() => data.value?.social || {})
const govSections = computed(() => data.value?.governance || {})

const isGenerating = ref(false)
const progress = ref(0)

function getKF(slug: string) {
  return keyFigures.value.find((x: any) => x.slug === slug) || {}
}
function fmt(v: number | string | undefined) {
  if (v === undefined || v === null) return '—'
  return typeof v === 'number' ? v.toLocaleString('fa-IR') : v
}
function pct(val: number, max: number) {
  if (!max) return '0%'
  return Math.round((val / max) * 100) + '%'
}
function getDomainEntries(section: 'environmental' | 'social' | 'governance') {
  const domains = narratives.value[section]?.domains || {}
  return Object.entries(domains) as [string, { title: string; body: string }][]
}

async function downloadPDF() {
  isGenerating.value = true
  progress.value = 0

  try {
    // Dynamically load html2canvas and jsPDF from CDN
    // await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
    // await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')


    const pages = document.querySelectorAll('.page') as NodeListOf<HTMLElement>
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

      // If content is taller than A4, scale to fit
      if (imgH <= A4_H) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH)
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, A4_H)
      }
    }

    pdf.save(`گزارش-پایداری-ESG-${meta.value.reporting_year}.pdf`)
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
  <div v-if="data" dir="rtl" style="font-family:'Vazirmatn',sans-serif">

    <!-- DOWNLOAD BUTTON -->
    <div class="download-bar">
      <button class="download-btn" :disabled="isGenerating" @click="downloadPDF">
        <svg v-if="!isGenerating" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <svg v-else class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <span v-if="!isGenerating">دانلود PDF گزارش</span>
        <span v-else>در حال تولید PDF... {{ progress }}%</span>
      </button>
      <div v-if="isGenerating" class="progress-bar-wrap">
        <div class="progress-bar-fill" :style="{width: progress + '%'}"></div>
      </div>
      <span class="download-note">گزارش پایداری ESG {{ meta.reporting_year }} — {{ meta.answered_controls }} شاخص</span>
    </div>

    <div class="report-wrapper">

      <!-- PAGE 1: Cover -->
      <div class="page page-with-footer">
        <div class="cover-center">
          <div class="cover-logo">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="16" stroke="#9FE1CB" stroke-width="2"/>
              <path d="M10 20l5-6 5 4 6-8" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="report-title">گزارش پایداری ESG</h1>
          <p class="report-subtitle">Environmental · Social · Governance</p>
          <p class="report-year">سال گزارش‌دهی {{ meta.reporting_year }}</p>

          <div class="cover-stats">
            <div class="cover-stat">
              <div class="num">{{ meta.answered_controls }}</div>
              <div class="lbl">شاخص پاسخ‌داده‌شده</div>
            </div>
            <div class="cover-stat">
              <div class="num">{{ meta.total_domains }}</div>
              <div class="lbl">حوزه ESG</div>
            </div>
            <div class="cover-stat">
              <div class="num">{{ meta.total_controls }}</div>
              <div class="lbl">کل شاخص‌ها</div>
            </div>
            <div class="cover-stat">
              <div class="num">99%</div>
              <div class="lbl">پوشش داده</div>
            </div>
          </div>

          <div class="section-boxes">
            <div class="section-box env">
              <div class="sb-label">محیط‌زیست</div>
              <div class="sb-num">{{ meta.sections?.environmental?.answered_controls }}</div>
              <div class="sb-sub">{{ meta.sections?.environmental?.domains }} حوزه</div>
            </div>
            <div class="section-box soc">
              <div class="sb-label">اجتماعی</div>
              <div class="sb-num">{{ meta.sections?.social?.answered_controls }}</div>
              <div class="sb-sub">{{ meta.sections?.social?.domains }} حوزه</div>
            </div>
            <div class="section-box gov">
              <div class="sb-label">حاکمیت</div>
              <div class="sb-num">{{ meta.sections?.governance?.answered_controls }}</div>
              <div class="sb-sub">{{ meta.sections?.governance?.domains }} حوزه</div>
            </div>
          </div>

          <div class="cover-footer-note">
            تاریخ تولید: {{ meta.generated_at }}<br>
            {{ meta.note }}
          </div>
          <div class="frameworks-row">GRI · ISSB · TCFD · CDP · EcoVadis · SBTi</div>
        </div>
        <div class="page-footer-bar">
          <span>محرمانه — جهت استفاده داخلی</span>
          <span>گزارش پایداری {{ meta.reporting_year }}</span>
        </div>
      </div>

      <!-- PAGE 2: Executive Summary -->
      <div class="page">
        <div class="page-header">
          <div>
            <div class="page-section-title">خلاصه اجرایی</div>
            <div class="page-section-sub">نگاهی کلی به عملکرد ESG در سال {{ meta.reporting_year }}</div>
          </div>
          <div class="header-meta">
            <div class="hm-label">پوشش داده</div>
            <div class="hm-value">99%</div>
          </div>
        </div>

        <div class="narrative-box">{{ narratives.about_report?.body }}</div>

        <div class="kpi-grid three">
          <div class="kpi-card"><div class="kpi-label">کل انتشار گازهای گلخانه‌ای</div><div class="kpi-value env">{{ fmt(getKF('total-ghg-emissions').answer_raw) }} <span class="kpi-unit">tCO₂e</span></div></div>
          <div class="kpi-card"><div class="kpi-label">کاهش انتشار کربن</div><div class="kpi-value env">{{ getKF('carbon-emissions-reduction-rate').answer_raw }}%</div></div>
          <div class="kpi-card"><div class="kpi-label">کاهش مصرف انرژی</div><div class="kpi-value env">{{ getKF('energy-consumption-reduction-rate').answer_raw }}%</div></div>
          <div class="kpi-card"><div class="kpi-label">تعداد کارکنان</div><div class="kpi-value soc">{{ fmt(getKF('total-employees-count').answer_raw) }}</div></div>
          <div class="kpi-card"><div class="kpi-label">رضایت کارکنان</div><div class="kpi-value soc">{{ getKF('employee-engagement-score').answer_raw }}%</div></div>
          <div class="kpi-card"><div class="kpi-label">حضور هیئت‌مدیره</div><div class="kpi-value gov">{{ getKF('board-meeting-attendance-rate').answer_raw }}%</div></div>
        </div>

        <div class="two-col" style="margin-top:16px">
          <div>
            <div class="domain-title">نقاط قوت</div>
            <div class="highlight-row env-bg">✓ کاهش {{ getKF('carbon-emissions-reduction-rate').answer_raw }}٪ کربن نسبت به دوره قبل</div>
            <div class="highlight-row env-bg">✓ {{ getKF('work-related-fatalities-count').answer_raw === 0 ? 'صفر' : getKF('work-related-fatalities-count').answer_raw }} فوتی در محیط کار</div>
            <div class="highlight-row env-bg">✓ حضور {{ getKF('board-meeting-attendance-rate').answer_raw }}٪ هیئت‌مدیره</div>
            <div class="highlight-row env-bg">✓ نگهداشت {{ getKF('key-employee-retention-rate').answer_raw }}٪ کارکنان کلیدی</div>
          </div>
          <div>
            <div class="domain-title">نیازمند توجه</div>
            <div class="highlight-row warn-bg">△ انرژی تجدیدپذیر {{ getKF('renewable-energy-share').answer_raw }}٪</div>
            <div class="highlight-row warn-bg">△ بازیافت آب {{ getKF('recycled-reused-water-share').answer_raw }}٪</div>
            <div class="highlight-row warn-bg">△ درمان ریسک {{ getKF('risk-treatment-plan-completion-rate').answer_raw }}٪</div>
            <div class="highlight-row warn-bg">△ ارزیابی تأمین‌کنندگان {{ getKF('key-suppliers-esg-assessment-coverage').answer_raw }}٪</div>
          </div>
        </div>
        <div class="page-num">صفحه ۲</div>
      </div>

      <!-- PAGE 3: Environmental Intro + All Env Domains -->
      <div class="page">
        <div class="page-header">
          <span class="section-pill pill-env"> <IconPlant2 :size="16" stroke-width="2" />  محیط‌زیست — مقدمه</span>
          <div class="header-meta"><div class="hm-label">حوزه‌ها</div><div class="hm-value">{{ meta.sections?.environmental?.domains }}</div></div>
        </div>
        <div class="narrative-box env-border">{{ narratives.environmental?.intro }}</div>
        <div class="domain-grid">
          <div v-for="([slug, domain]) in getDomainEntries('environmental')" :key="slug" class="domain-card env-domain">
            <div class="dc-title">{{ domain.title }}</div>
            <div class="dc-body">{{ domain.body }}</div>
          </div>
        </div>
        <div class="page-num">صفحه ۳</div>
      </div>

      <!-- PAGE 4: Energy -->
      <div class="page">
        <div class="page-header">
          <span class="section-pill pill-env"> <IconPlant2 :size="16" stroke-width="2" /> محیط‌زیست — انرژی</span>
          <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۲</div></div>
        </div>
        <div class="section-title">مدیریت انرژی و منابع</div>
        <div class="narrative-box env-border">{{ narratives.environmental?.domains?.['energy-resource-management']?.body }}</div>
        <div class="kpi-grid three">
          <div class="kpi-card"><div class="kpi-label">مصرف کل برق</div><div class="kpi-value env">{{ fmt(getKF('total-electricity-consumption').answer_raw) }} <span class="kpi-unit">kWh</span></div></div>
          <div class="kpi-card"><div class="kpi-label">مصرف گاز طبیعی</div><div class="kpi-value env">{{ fmt(getKF('total-natural-gas-consumption').answer_raw) }} <span class="kpi-unit">m³</span></div></div>
          <div class="kpi-card"><div class="kpi-label">سوخت مایع</div><div class="kpi-value env">{{ fmt(getKF('total-liquid-fuel-diesel-consumption').answer_raw) }} <span class="kpi-unit">لیتر</span></div></div>
          <div class="kpi-card"><div class="kpi-label">مصرف به ازای هر کارمند</div><div class="kpi-value env">{{ fmt(getKF('energy-consumption-per-employee').answer_raw) }} <span class="kpi-unit">kWh/نفر</span></div></div>
          <div class="kpi-card"><div class="kpi-label">انرژی تجدیدپذیر</div><div class="kpi-value env">{{ getKF('renewable-energy-share').answer_raw }}%</div></div>
          <div class="kpi-card"><div class="kpi-label">کاهش مصرف انرژی</div><div class="kpi-value env">{{ getKF('energy-consumption-reduction-rate').answer_raw }}%</div></div>
        </div>
        <div class="gauge-list">
          <div class="gauge-item">
            <div class="gauge-label">انرژی تجدیدپذیر ({{ getKF('renewable-energy-share').answer_raw }}٪)</div>
            <div class="gauge-bar-bg"><div class="gauge-bar-fill env" :style="{width: getKF('renewable-energy-share').answer_raw + '%'}"></div></div>
          </div>
          <div class="gauge-item">
            <div class="gauge-label">کاهش مصرف انرژی ({{ getKF('energy-consumption-reduction-rate').answer_raw }}٪)</div>
            <div class="gauge-bar-bg"><div class="gauge-bar-fill env" :style="{width: (getKF('energy-consumption-reduction-rate').answer_raw * 10) + '%'}"></div></div>
          </div>
        </div>
        <!-- Energy section items -->
        <div class="section-items-table" v-if="envSections.energy?.length">
          <div class="sit-header">
            <span>شاخص</span><span>پاسخ</span><span>کد متریک</span>
          </div>
          <div v-for="item in envSections.energy" :key="item.id" class="sit-row">
            <span>{{ item.summary || item.title }}</span>
            <span class="sit-val">{{ item.answer }} <small>{{ item.answer_unit }}</small></span>
            <span class="sit-code">{{ item.metric_code }}</span>
          </div>
        </div>
        <div class="page-num">صفحه ۴</div>
      </div>

      <!-- PAGE 5: GHG -->
      <div class="page">
        <div class="page-header">
          <span class="section-pill pill-env"> <IconPlant2 :size="16" stroke-width="2" /> محیط‌زیست — گازهای گلخانه‌ای</span>
          <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۳</div></div>
        </div>
        <div class="section-title">انتشار گازهای گلخانه‌ای (GHG)</div>
        <div class="narrative-box env-border">{{ narratives.environmental?.domains?.['greenhouse-gas-emissions']?.body }}</div>
        <div class="kpi-grid three">
          <div class="kpi-card"><div class="kpi-label">مجموع انتشار</div><div class="kpi-value env">{{ fmt(getKF('total-ghg-emissions').answer_raw) }} <span class="kpi-unit">tCO₂e</span></div></div>
          <div class="kpi-card"><div class="kpi-label">کاهش کربن</div><div class="kpi-value env">{{ getKF('carbon-emissions-reduction-rate').answer_raw }}%</div></div>
          <div class="kpi-card"><div class="kpi-label">شدت کربن</div><div class="kpi-value env">{{ getKF('carbon-emissions-intensity').answer_raw }} <span class="kpi-unit">tCO₂e/واحد</span></div></div>
        </div>
        <div class="domain-title">تفکیک Scope های انتشار</div>
        <div class="ghg-bar-list">
          <div class="ghg-bar-item">
            <span class="ghg-bar-label">Scope 1</span>
            <div class="ghg-bar-bg">
              <div class="ghg-bar-fill s1" :style="{width: pct(getKF('scope-1-ghg-emissions').answer_raw, getKF('total-ghg-emissions').answer_raw)}">
                {{ fmt(getKF('scope-1-ghg-emissions').answer_raw) }}
              </div>
            </div>
            <span class="ghg-pct">{{ pct(getKF('scope-1-ghg-emissions').answer_raw, getKF('total-ghg-emissions').answer_raw) }}</span>
          </div>
          <div class="ghg-bar-item">
            <span class="ghg-bar-label">Scope 2</span>
            <div class="ghg-bar-bg">
              <div class="ghg-bar-fill s2" :style="{width: pct(getKF('scope-2-ghg-emissions').answer_raw, getKF('total-ghg-emissions').answer_raw)}">
                {{ fmt(getKF('scope-2-ghg-emissions').answer_raw) }}
              </div>
            </div>
            <span class="ghg-pct">{{ pct(getKF('scope-2-ghg-emissions').answer_raw, getKF('total-ghg-emissions').answer_raw) }}</span>
          </div>
          <div class="ghg-bar-item">
            <span class="ghg-bar-label">Scope 3</span>
            <div class="ghg-bar-bg">
              <div class="ghg-bar-fill s3" :style="{width: pct(getKF('scope-3-ghg-emissions').answer_raw, getKF('total-ghg-emissions').answer_raw)}">
                {{ fmt(getKF('scope-3-ghg-emissions').answer_raw) }}
              </div>
            </div>
            <span class="ghg-pct">{{ pct(getKF('scope-3-ghg-emissions').answer_raw, getKF('total-ghg-emissions').answer_raw) }}</span>
          </div>
        </div>
        <!-- GHG items table -->
        <div class="section-items-table" v-if="envSections.ghg?.length">
          <div class="sit-header"><span>شاخص</span><span>پاسخ</span><span>کد</span></div>
          <div v-for="item in envSections.ghg" :key="item.id" class="sit-row">
            <span>{{ item.summary || item.title }}</span>
            <span class="sit-val">{{ item.answer }} <small>{{ item.answer_unit }}</small></span>
            <span class="sit-code">{{ item.metric_code }}</span>
          </div>
        </div>
        <div class="page-num">صفحه ۵</div>
      </div>

      <!-- PAGE 6: Water & Waste -->
      <div class="page">
        <div class="page-header">
          <span class="section-pill pill-env"> <IconPlant2 :size="16" stroke-width="2" /> محیط‌زیست — آب و پسماند</span>
          <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۴</div></div>
        </div>
        <div class="section-title">مدیریت آب و پسماند</div>
        <div class="two-col">
          <div>
            <div class="domain-title">آب — {{ narratives.environmental?.domains?.['water-management']?.title }}</div>
            <div class="narrative-box env-border" style="font-size:10px">{{ narratives.environmental?.domains?.['water-management']?.body }}</div>
            <div class="kpi-grid two">
              <div class="kpi-card"><div class="kpi-label">مصرف کل آب</div><div class="kpi-value env">{{ fmt(getKF('total-water-withdrawal-consumption').answer_raw) }} <span class="kpi-unit">m³</span></div></div>
              <div class="kpi-card"><div class="kpi-label">بازیافت آب</div><div class="kpi-value env">{{ getKF('recycled-reused-water-share').answer_raw }}%</div></div>
            </div>
            <div class="gauge-list">
              <div class="gauge-item"><div class="gauge-label">کاهش مصرف آب ({{ getKF('water-consumption-reduction-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill env" :style="{width: (getKF('water-consumption-reduction-rate').answer_raw * 10) + '%'}"></div></div></div>
              <div class="gauge-item"><div class="gauge-label">عملیات در مناطق تنش آبی ({{ getKF('operations-in-water-stressed-areas-share').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill warn" :style="{width: getKF('operations-in-water-stressed-areas-share').answer_raw + '%'}"></div></div></div>
            </div>
            <!-- Water section items -->
            <div class="section-items-table" style="margin-top:8px" v-if="envSections.water?.length">
              <div class="sit-header"><span>شاخص</span><span>پاسخ</span></div>
              <div v-for="item in envSections.water" :key="item.id" class="sit-row">
                <span>{{ item.summary || item.title }}</span>
                <span class="sit-val">{{ item.answer }} <small>{{ item.answer_unit }}</small></span>
              </div>
            </div>
          </div>
          <div>
            <div class="domain-title">پسماند — {{ narratives.environmental?.domains?.['waste-management-circular-economy']?.title }}</div>
            <div class="narrative-box env-border" style="font-size:10px">{{ narratives.environmental?.domains?.['waste-management-circular-economy']?.body }}</div>
            <div class="kpi-grid two">
              <div class="kpi-card"><div class="kpi-label">پسماند کل</div><div class="kpi-value env">{{ fmt(getKF('total-waste-generated').answer_raw) }} <span class="kpi-unit">تن</span></div></div>
              <div class="kpi-card"><div class="kpi-label">پسماند خطرناک</div><div class="kpi-value danger">{{ getKF('hazardous-waste-generated').answer_raw }} <span class="kpi-unit">تن</span></div></div>
            </div>
            <div class="waste-bar">
              <div class="waste-seg recycled" :style="{flex: getKF('recycled-reused-waste-share').answer_raw}">بازیافت {{ getKF('recycled-reused-waste-share').answer_raw }}٪</div>
              <div class="waste-seg landfill" :style="{flex: getKF('waste-sent-to-final-disposal-share').answer_raw}">دفن {{ getKF('waste-sent-to-final-disposal-share').answer_raw }}٪</div>
            </div>
            <!-- Waste section items -->
            <div class="section-items-table" style="margin-top:8px" v-if="envSections.waste?.length">
              <div class="sit-header"><span>شاخص</span><span>پاسخ</span></div>
              <div v-for="item in envSections.waste" :key="item.id" class="sit-row">
                <span>{{ item.summary || item.title }}</span>
                <span class="sit-val">{{ item.answer }} <small>{{ item.answer_unit }}</small></span>
              </div>
            </div>
          </div>
        </div>
        <div class="page-num">صفحه ۶</div>
      </div>

      <!-- PAGE 7: Climate & Other Env Domains -->
      <div class="page">
        <div class="page-header">
          <span class="section-pill pill-env"> <IconPlant2 :size="16" stroke-width="2" /> محیط‌زیست — اقلیم و سایر</span>
          <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۵</div></div>
        </div>
        <div class="two-col">
          <div>
            <div class="domain-title">{{ narratives.environmental?.domains?.['climate-change-strategy']?.title }}</div>
            <div class="narrative-box env-border" style="font-size:10px">{{ narratives.environmental?.domains?.['climate-change-strategy']?.body }}</div>
            <!-- Climate items -->
            <div class="section-items-table" v-if="envSections.climate?.length">
              <div class="sit-header"><span>شاخص</span><span>پاسخ</span></div>
              <div v-for="item in envSections.climate" :key="item.id" class="sit-row">
                <span>{{ item.summary || item.title }}</span>
                <span class="sit-val">{{ item.answer }} <small>{{ item.answer_unit }}</small></span>
              </div>
            </div>
          </div>
          <div>
            <div class="domain-title">{{ narratives.environmental?.domains?.['environmental-compliance-permitting']?.title }}</div>
            <div class="narrative-box env-border" style="font-size:10px">{{ narratives.environmental?.domains?.['environmental-compliance-permitting']?.body }}</div>
            <div class="domain-title" style="margin-top:12px">{{ narratives.environmental?.domains?.['pollution-environmental-impact']?.title }}</div>
            <div class="narrative-box env-border" style="font-size:10px">{{ narratives.environmental?.domains?.['pollution-environmental-impact']?.body }}</div>
            <div class="domain-title" style="margin-top:12px">{{ narratives.environmental?.domains?.['biodiversity-ecosystem-impact']?.title }}</div>
            <div class="narrative-box env-border" style="font-size:10px">{{ narratives.environmental?.domains?.['biodiversity-ecosystem-impact']?.body }}</div>
          </div>
        </div>
        <div class="domain-title">{{ narratives.environmental?.domains?.['resource-efficiency-material-use']?.title }}</div>
        <div class="narrative-box env-border" style="font-size:10px">{{ narratives.environmental?.domains?.['resource-efficiency-material-use']?.body }}</div>
        <div class="page-num">صفحه ۷</div>
      </div>

      <!-- PAGE 8: Social Intro + Domains -->
      <div class="page">
        <div class="page-header">
          <span class="section-pill pill-soc"> <IconUsers :size="16" stroke-width="2" /> اجتماعی — مقدمه</span>
          <div class="header-meta"><div class="hm-label">حوزه‌ها</div><div class="hm-value">{{ meta.sections?.social?.domains }}</div></div>
        </div>
        <div class="narrative-box soc-border">{{ narratives.social?.intro }}</div>
        <div class="domain-grid">
          <div v-for="([slug, domain]) in getDomainEntries('social')" :key="slug" class="domain-card soc-domain">
            <div class="dc-title">{{ domain.title }}</div>
            <div class="dc-body">{{ domain.body }}</div>
          </div>
        </div>
        <div class="page-num">صفحه ۸</div>
      </div>

      <!-- PAGE 9: Workforce -->
      <div class="page">
        <div class="page-header">
          <span class="section-pill pill-soc"> <IconUsers :size="16" stroke-width="2" /> اجتماعی — نیروی انسانی</span>
          <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۶</div></div>
        </div>
        <div class="section-title">ساختار و جمعیت‌شناسی نیروی انسانی</div>
        <div class="narrative-box soc-border">{{ narratives.social?.domains?.['workforce-structure-demographics']?.body }}</div>
        <div class="kpi-grid three">
          <div class="kpi-card"><div class="kpi-label">تعداد کل کارکنان</div><div class="kpi-value soc">{{ fmt(getKF('total-employees-count').answer_raw) }} <span class="kpi-unit">نفر</span></div></div>
          <div class="kpi-card"><div class="kpi-label">سهم زنان</div><div class="kpi-value soc">{{ getKF('female-employees-share').answer_raw }}%</div></div>
          <div class="kpi-card"><div class="kpi-label">مدیران زن</div><div class="kpi-value soc">{{ getKF('female-managers-share').answer_raw }}%</div></div>
        </div>
        <div class="two-col">
          <div>
            <div class="domain-title">توزیع سنی</div>
            <div class="gauge-list">
              <div class="gauge-item"><div class="gauge-label">زیر ۳۰ سال ({{ getKF('employees-under-30-share').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill soc" :style="{width: getKF('employees-under-30-share').answer_raw + '%'}"></div></div></div>
              <div class="gauge-item"><div class="gauge-label">۳۰ تا ۵۰ سال ({{ getKF('employees-age-30-to-50-share').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill soc" :style="{width: getKF('employees-age-30-to-50-share').answer_raw + '%'}"></div></div></div>
              <div class="gauge-item"><div class="gauge-label">بالای ۵۰ سال ({{ getKF('employees-over-50-share').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill" style="background:#888" :style="{width: getKF('employees-over-50-share').answer_raw + '%'}"></div></div></div>
            </div>
            <div class="domain-title" style="margin-top:10px">تنوع و شمول (DEI)</div>
            <div class="narrative-box soc-border" style="font-size:10px">{{ narratives.social?.domains?.['diversity-equity-inclusion']?.body }}</div>
          </div>
          <div>
            <div class="domain-title">شرایط اشتغال</div>
            <div class="gauge-list">
              <div class="gauge-item"><div class="gauge-label">قرارداد دائمی ({{ getKF('permanent-long-term-employment-share').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill soc" :style="{width: getKF('permanent-long-term-employment-share').answer_raw + '%'}"></div></div></div>
              <div class="gauge-item"><div class="gauge-label">پوشش مزایا ({{ getKF('core-benefits-coverage-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill soc" :style="{width: getKF('core-benefits-coverage-rate').answer_raw + '%'}"></div></div></div>
            </div>
            <div class="domain-title" style="margin-top:10px">آموزش و توسعه</div>
            <div class="kpi-grid two">
              <div class="kpi-card"><div class="kpi-label">کل ساعات آموزش</div><div class="kpi-value soc">{{ fmt(getKF('total-training-hours').answer_raw) }}</div></div>
              <div class="kpi-card"><div class="kpi-label">ساعت/نفر</div><div class="kpi-value soc">{{ getKF('average-training-hours-per-employee').answer_raw }}</div></div>
            </div>
            <div class="narrative-box soc-border" style="font-size:10px;margin-top:8px">{{ narratives.social?.domains?.['learning-development']?.body }}</div>
          </div>
        </div>
        <!-- DEI items -->
        <div class="section-items-table" v-if="socialSections.dei?.length">
          <div class="sit-header"><span>شاخص</span><span>پاسخ</span><span>کد</span></div>
          <div v-for="item in socialSections.dei" :key="item.id" class="sit-row">
            <span>{{ item.summary || item.title }}</span>
            <span class="sit-val">{{ item.answer }} <small>{{ item.answer_unit }}</small></span>
            <span class="sit-code">{{ item.metric_code }}</span>
          </div>
        </div>
        <div class="page-num">صفحه ۹</div>
      </div>

      <!-- PAGE 10: Health, Safety, Engagement -->
      <div class="page">
        <div class="page-header">
          <span class="section-pill pill-soc"> <IconUsers :size="16" stroke-width="2" /> اجتماعی — سلامت و مشارکت</span>
          <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۷</div></div>
        </div>
        <div class="section-title">سلامت، ایمنی و مشارکت کارکنان</div>
        <div class="narrative-box soc-border">{{ narratives.social?.domains?.['health-safety-wellbeing']?.body }}</div>
        <div class="two-col">
          <div>
            <div class="domain-title">سلامت و ایمنی</div>
            <div class="kpi-grid two">
              <div class="kpi-card" style="border-top:2px solid #1D9E75"><div class="kpi-label">فوتی کاری</div><div class="kpi-value" style="color:#0F6E56;font-size:22px">{{ getKF('work-related-fatalities-count').answer_raw }}</div></div>
              <div class="kpi-card"><div class="kpi-label">حوادث با از دست دادن زمان</div><div class="kpi-value warn">{{ getKF('lost-time-incidents-count').answer_raw }}</div></div>
            </div>
            <div class="gauge-list">
              <div class="gauge-item"><div class="gauge-label">آموزش ایمنی ({{ getKF('health-safety-training-completion-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill env" :style="{width: getKF('health-safety-training-completion-rate').answer_raw + '%'}"></div></div></div>
              <div class="gauge-item"><div class="gauge-label">نرخ غیبت ناشی از آسیب ({{ getKF('work-related-absence-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill warn" :style="{width: (getKF('work-related-absence-rate').answer_raw * 10) + '%'}"></div></div></div>
            </div>
            <!-- Health Safety items -->
            <div class="section-items-table" v-if="socialSections.health_safety?.length">
              <div class="sit-header"><span>شاخص</span><span>پاسخ</span></div>
              <div v-for="item in socialSections.health_safety" :key="item.id" class="sit-row">
                <span>{{ item.summary || item.title }}</span>
                <span class="sit-val">{{ item.answer }} <small>{{ item.answer_unit }}</small></span>
              </div>
            </div>
          </div>
          <div>
            <div class="domain-title">مشارکت و نگهداشت کارکنان</div>
            <div class="narrative-box soc-border" style="font-size:10px">{{ narratives.social?.domains?.['employee-engagement-retention']?.body }}</div>
            <div class="kpi-grid two">
              <div class="kpi-card"><div class="kpi-label">رضایت کارکنان</div><div class="kpi-value soc">{{ getKF('employee-engagement-score').answer_raw }}%</div></div>
              <div class="kpi-card"><div class="kpi-label">نگهداشت کلیدی</div><div class="kpi-value soc">{{ getKF('key-employee-retention-rate').answer_raw }}%</div></div>
            </div>
            <div class="gauge-list">
              <div class="gauge-item"><div class="gauge-label">ترک خدمت داوطلبانه ({{ getKF('voluntary-turnover-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill env" :style="{width: getKF('voluntary-turnover-rate').answer_raw + '%'}"></div></div></div>
              <div class="gauge-item"><div class="gauge-label">رضایت مشتری ({{ getKF('customer-satisfaction-score').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill soc" :style="{width: getKF('customer-satisfaction-score').answer_raw + '%'}"></div></div></div>
            </div>
            <div class="domain-title" style="margin-top:10px">مسئولیت در برابر مشتری</div>
            <div class="narrative-box soc-border" style="font-size:10px">{{ narratives.social?.domains?.['customer-responsibility-product-safety']?.body }}</div>
          </div>
        </div>
        <div class="page-num">صفحه ۱۰</div>
      </div>

      <!-- PAGE 11: Social Community & Human Rights -->
      <div class="page">
        <div class="page-header">
          <span class="section-pill pill-soc"> <IconUsers :size="16" stroke-width="2" /> اجتماعی — جامعه و حقوق بشر</span>
          <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۸</div></div>
        </div>
        <div class="two-col">
          <div>
            <div class="domain-title">{{ narratives.social?.domains?.['community-impact']?.title }}</div>
            <div class="narrative-box soc-border">{{ narratives.social?.domains?.['community-impact']?.body }}</div>
            <div class="domain-title" style="margin-top:10px">{{ narratives.social?.domains?.['human-rights-labor-practices']?.title }}</div>
            <div class="narrative-box soc-border">{{ narratives.social?.domains?.['human-rights-labor-practices']?.body }}</div>
          </div>
          <div>
            <div class="domain-title">{{ narratives.social?.domains?.['labor-relations-industrial-relations']?.title }}</div>
            <div class="narrative-box soc-border">{{ narratives.social?.domains?.['labor-relations-industrial-relations']?.body }}</div>
            <div class="domain-title" style="margin-top:10px">{{ narratives.social?.domains?.['talent-attraction-workforce-planning']?.title }}</div>
            <div class="narrative-box soc-border">{{ narratives.social?.domains?.['talent-attraction-workforce-planning']?.body }}</div>
            <div class="domain-title" style="margin-top:10px">{{ narratives.social?.domains?.['employment-conditions']?.title }}</div>
            <div class="narrative-box soc-border">{{ narratives.social?.domains?.['employment-conditions']?.body }}</div>
          </div>
        </div>
        <div class="page-num">صفحه ۱۱</div>
      </div>

      <!-- PAGE 12: Governance Intro + All Domains -->
      <div class="page">
        <div class="page-header">
          <span class="section-pill pill-gov"> <IconBuildingBank :size="16" stroke-width="2" /> حاکمیت — مقدمه</span>
          <div class="header-meta"><div class="hm-label">حوزه‌ها</div><div class="hm-value">{{ meta.sections?.governance?.domains }}</div></div>
        </div>
        <div class="narrative-box gov-border">{{ narratives.governance?.intro }}</div>
        <div class="domain-grid">
          <div v-for="([slug, domain]) in getDomainEntries('governance')" :key="slug" class="domain-card gov-domain">
            <div class="dc-title">{{ domain.title }}</div>
            <div class="dc-body">{{ domain.body }}</div>
          </div>
        </div>
        <div class="page-num">صفحه ۱۲</div>
      </div>

      <!-- PAGE 13: Governance Board & Risk -->
      <div class="page">
        <div class="page-header">
          <span class="section-pill pill-gov"> <IconBuildingBank :size="16" stroke-width="2" /> حاکمیت — هیئت‌مدیره و ریسک</span>
          <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۹</div></div>
        </div>
        <div class="section-title">ساختار حاکمیت شرکتی و مدیریت ریسک</div>
        <div class="narrative-box gov-border">{{ narratives.governance?.domains?.['corporate-governance-structure']?.body }}</div>
        <div class="two-col">
          <div>
            <div class="domain-title">هیئت‌مدیره</div>
            <div class="kpi-grid two">
              <div class="kpi-card"><div class="kpi-label">اعضا</div><div class="kpi-value gov">{{ getKF('board-members-count').answer_raw }} <span class="kpi-unit">نفر</span></div></div>
              <div class="kpi-card"><div class="kpi-label">کمیته‌های نظارتی</div><div class="kpi-value gov">{{ getKF('active-oversight-committees-count').answer_raw }}</div></div>
              <div class="kpi-card"><div class="kpi-label">جلسات با دستور ESG</div><div class="kpi-value gov">{{ getKF('board-meetings-with-esg-agenda-count').answer_raw }}</div></div>
            </div>
            <div class="gauge-list">
              <div class="gauge-item"><div class="gauge-label">نرخ حضور ({{ getKF('board-meeting-attendance-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('board-meeting-attendance-rate').answer_raw + '%'}"></div></div></div>
              <div class="gauge-item"><div class="gauge-label">اعضای مستقل ({{ getKF('independent-board-members-share').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('independent-board-members-share').answer_raw + '%'}"></div></div></div>
              <div class="gauge-item"><div class="gauge-label">اعضای زن ({{ getKF('female-board-members-share').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill pink" :style="{width: getKF('female-board-members-share').answer_raw + '%'}"></div></div></div>
            </div>
          </div>
          <div>
            <div class="domain-title">مدیریت ریسک</div>
            <div class="narrative-box gov-border" style="font-size:10px">{{ narratives.governance?.domains?.['risk-management']?.body }}</div>
            <div class="kpi-grid two">
              <div class="kpi-card"><div class="kpi-label">ریسک‌های شناسایی‌شده</div><div class="kpi-value gov">{{ getKF('identified-enterprise-esg-risks-count').answer_raw }}</div></div>
              <div class="kpi-card"><div class="kpi-label">ریسک بالا/بحرانی</div><div class="kpi-value warn">{{ getKF('high-critical-risks-share').answer_raw }}%</div></div>
            </div>
            <div class="gauge-list">
              <div class="gauge-item"><div class="gauge-label">پوشش ارزیابی ریسک ({{ getKF('risk-assessment-coverage-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('risk-assessment-coverage-rate').answer_raw + '%'}"></div></div></div>
              <div class="gauge-item"><div class="gauge-label">برنامه‌های درمان ریسک ({{ getKF('risk-treatment-plan-completion-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill warn" :style="{width: getKF('risk-treatment-plan-completion-rate').answer_raw + '%'}"></div></div></div>
            </div>
            <div class="kpi-card" style="margin-top:10px"><div class="kpi-label">جلسات بازبینی ریسک</div><div class="kpi-value gov">{{ getKF('formal-risk-review-meetings-count').answer_raw }} <span class="kpi-unit">جلسه</span></div></div>
          </div>
        </div>
        <!-- Board items table -->
        <div class="section-items-table" v-if="govSections.board?.length">
          <div class="sit-header"><span>شاخص</span><span>پاسخ</span><span>کد</span></div>
          <div v-for="item in govSections.board" :key="item.id" class="sit-row">
            <span>{{ item.summary || item.title }}</span>
            <span class="sit-val">{{ item.answer }} <small>{{ item.answer_unit }}</small></span>
            <span class="sit-code">{{ item.metric_code }}</span>
          </div>
        </div>
        <div class="page-num">صفحه ۱۳</div>
      </div>

      <!-- PAGE 14: Ethics & Compliance -->
      <div class="page">
        <div class="page-header">
          <span class="section-pill pill-gov"> <IconBuildingBank :size="16" stroke-width="2" /> حاکمیت — اخلاق و تطبیق</span>
          <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۱۰</div></div>
        </div>
        <div class="section-title">اخلاق، تطبیق، امنیت و زنجیره تأمین</div>
        <div class="two-col">
          <div>
            <div class="domain-title">{{ narratives.governance?.domains?.['ethics-integrity']?.title }}</div>
            <div class="narrative-box gov-border" style="font-size:10px">{{ narratives.governance?.domains?.['ethics-integrity']?.body }}</div>
            <div class="gauge-list" style="margin-top:8px">
              <div class="gauge-item"><div class="gauge-label">آموزش اخلاق و ضد فساد ({{ getKF('ethics-anti-corruption-training-completion-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('ethics-anti-corruption-training-completion-rate').answer_raw + '%'}"></div></div></div>
            </div>
            <div class="kpi-grid two" style="margin-top:10px">
              <div class="kpi-card"><div class="kpi-label">گزارش‌های افشاگری</div><div class="kpi-value gov">{{ getKF('whistleblowing-reports-count').answer_raw }}</div></div>
              <div class="kpi-card"><div class="kpi-label">تخلفات اخلاقی</div><div class="kpi-value warn">{{ getKF('corruption-bribery-ethics-incidents-count').answer_raw }}</div></div>
            </div>
            <div class="domain-title" style="margin-top:12px">{{ narratives.governance?.domains?.['compliance-management']?.title }}</div>
            <div class="narrative-box gov-border" style="font-size:10px">{{ narratives.governance?.domains?.['compliance-management']?.body }}</div>
            <div class="gauge-list">
              <div class="gauge-item"><div class="gauge-label">الزامات با کنترل ({{ getKF('regulatory-requirements-with-defined-controls-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('regulatory-requirements-with-defined-controls-rate').answer_raw + '%'}"></div></div></div>
              <div class="gauge-item"><div class="gauge-label">آموزش تطبیق ({{ getKF('compliance-training-completion-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('compliance-training-completion-rate').answer_raw + '%'}"></div></div></div>
            </div>
          </div>
          <div>
            <div class="domain-title">{{ narratives.governance?.domains?.['data-privacy-cybersecurity']?.title }}</div>
            <div class="narrative-box gov-border" style="font-size:10px">{{ narratives.governance?.domains?.['data-privacy-cybersecurity']?.body }}</div>
            <div class="gauge-list">
              <div class="gauge-item"><div class="gauge-label">سامانه‌های ارزیابی‌شده ({{ getKF('critical-systems-security-assessment-coverage').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('critical-systems-security-assessment-coverage').answer_raw + '%'}"></div></div></div>
              <div class="gauge-item"><div class="gauge-label">رفع آسیب‌پذیری ({{ getKF('high-risk-vulnerability-remediation-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('high-risk-vulnerability-remediation-rate').answer_raw + '%'}"></div></div></div>
            </div>
            <div class="kpi-grid two" style="margin-top:10px">
              <div class="kpi-card"><div class="kpi-label">رخدادهای سایبری</div><div class="kpi-value warn">{{ getKF('cybersecurity-incidents-count').answer_raw }}</div></div>
              <div class="kpi-card"><div class="kpi-label">نقض داده</div><div class="kpi-value warn">{{ getKF('data-privacy-breach-incidents-count').answer_raw }}</div></div>
            </div>
            <div class="domain-title" style="margin-top:12px">{{ narratives.governance?.domains?.['supply-chain-governance']?.title }}</div>
            <div class="narrative-box gov-border" style="font-size:10px">{{ narratives.governance?.domains?.['supply-chain-governance']?.body }}</div>
            <div class="gauge-list">
              <div class="gauge-item"><div class="gauge-label">پذیرش منشور ESG ({{ getKF('supplier-code-of-conduct-acceptance-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('supplier-code-of-conduct-acceptance-rate').answer_raw + '%'}"></div></div></div>
              <div class="gauge-item"><div class="gauge-label">تأمین‌کنندگان ارزیابی‌شده ({{ getKF('key-suppliers-esg-assessment-coverage').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill warn" :style="{width: getKF('key-suppliers-esg-assessment-coverage').answer_raw + '%'}"></div></div></div>
            </div>
          </div>
        </div>
        <div class="page-num">صفحه ۱۴</div>
      </div>

      <!-- PAGE 15: Governance - Financial, Internal Audit, ESG Reporting, AML -->
      <div class="page">
        <div class="page-header">
          <span class="section-pill pill-gov"> <IconBuildingBank :size="16" stroke-width="2" /> حاکمیت — شفافیت و کنترل</span>
          <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۱۱</div></div>
        </div>
        <div class="two-col">
          <div>
            <div class="domain-title">{{ narratives.governance?.domains?.['financial-tax-transparency']?.title }}</div>
            <div class="narrative-box gov-border">{{ narratives.governance?.domains?.['financial-tax-transparency']?.body }}</div>
            <div class="domain-title" style="margin-top:10px">{{ narratives.governance?.domains?.['internal-audit-control-systems']?.title }}</div>
            <div class="narrative-box gov-border">{{ narratives.governance?.domains?.['internal-audit-control-systems']?.body }}</div>
          </div>
          <div>
            <div class="domain-title">{{ narratives.governance?.domains?.['esg-governance-reporting']?.title }}</div>
            <div class="narrative-box gov-border">{{ narratives.governance?.domains?.['esg-governance-reporting']?.body }}</div>
            <div class="domain-title" style="margin-top:10px">{{ narratives.governance?.domains?.['anti-money-laundering-financial-crime']?.title }}</div>
            <div class="narrative-box gov-border">{{ narratives.governance?.domains?.['anti-money-laundering-financial-crime']?.body }}</div>
            <div class="domain-title" style="margin-top:10px">{{ narratives.governance?.domains?.['regulatory-legal-compliance-risk']?.title }}</div>
            <div class="narrative-box gov-border">{{ narratives.governance?.domains?.['regulatory-legal-compliance-risk']?.body }}</div>
            <div class="domain-title" style="margin-top:10px">{{ narratives.governance?.domains?.['esg-data-governance-data-quality']?.title }}</div>
            <div class="narrative-box gov-border">{{ narratives.governance?.domains?.['esg-data-governance-data-quality']?.body }}</div>
          </div>
        </div>
        <div class="page-num">صفحه ۱۵</div>
      </div>

      <!-- PAGE 16: Conclusion -->
      <div class="page page-with-footer">
        <div class="page-header">
          <div><div class="page-section-title">نتیجه‌گیری و توصیه‌ها</div></div>
          <div class="header-meta"><div class="hm-label">صفحه</div><div class="hm-value">۱۶</div></div>
        </div>
        <div class="conclusion-box">
          <h3>{{ narratives.report_conclusion?.title }}</h3>
          <p>{{ narratives.report_conclusion?.body }}</p>
        </div>
        <div class="two-col" style="margin-top:16px">
          <div>
            <div class="domain-title">اقدامات اولویت‌دار</div>
            <div class="priority-list">
              <div class="priority-item">⬆ افزایش سهم انرژی تجدیدپذیر از {{ getKF('renewable-energy-share').answer_raw }}٪ به ۳۰٪</div>
              <div class="priority-item">⬆ بهبود نرخ بازیافت آب از {{ getKF('recycled-reused-water-share').answer_raw }}٪ به ۴۰٪</div>
              <div class="priority-item">⬆ ارتقاء اجرای برنامه‌های درمان ریسک به ۹۰٪</div>
              <div class="priority-item">⬆ کاهش شکاف پرداختی جنسیتی زیر ۳٪</div>
              <div class="priority-item">⬆ ارزیابی ۱۰۰٪ تأمین‌کنندگان از نظر ESG</div>
            </div>
          </div>
          <div>
            <div class="domain-title">دستاوردهای محقق‌شده</div>
            <div class="achieved-list">
              <div class="achieved-item">✓ صفر فوتی کاری</div>
              <div class="achieved-item">✓ کاهش {{ getKF('carbon-emissions-reduction-rate').answer_raw }}٪ انتشار کربن</div>
              <div class="achieved-item">✓ آموزش ایمنی {{ getKF('health-safety-training-completion-rate').answer_raw }}٪ کارکنان</div>
              <div class="achieved-item">✓ بازیافت {{ getKF('recycled-reused-waste-share').answer_raw }}٪ پسماند</div>
              <div class="achieved-item">✓ نگهداشت {{ getKF('key-employee-retention-rate').answer_raw }}٪ کارکنان کلیدی</div>
              <div class="achieved-item">✓ پوشش {{ meta.answered_controls }}/{{ meta.total_controls }} شاخص (۹۹٪)</div>
            </div>
          </div>
        </div>
        <!-- Summary KPI grid -->
        <div class="kpi-grid three" style="margin-top:16px">
          <div class="kpi-card"><div class="kpi-label">کل شاخص‌های پاسخ‌شده</div><div class="kpi-value gov">{{ meta.answered_controls }}/{{ meta.total_controls }}</div></div>
          <div class="kpi-card"><div class="kpi-label">حوزه‌های بررسی‌شده</div><div class="kpi-value gov">{{ meta.total_domains }}</div></div>
          <div class="kpi-card"><div class="kpi-label">سال گزارش‌دهی</div><div class="kpi-value gov">{{ meta.reporting_year }}</div></div>
        </div>
        <div class="report-end-note">
          چارچوب‌های پشتیبانی: GRI · ISSB · TCFD · CDP · EcoVadis · SBTi &nbsp;|&nbsp; تاریخ: {{ meta.generated_at }}
        </div>
        <div class="page-footer-bar">
          <span>محرمانه — جهت استفاده داخلی</span>
          <span>© گزارش پایداری {{ meta.reporting_year }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700&display=swap');
@media print {
  .download-bar { display: none; }
  .report-wrapper { background: none; padding: 0; }
  .page { box-shadow: none; margin: 0; page-break-after: always; }
}
* { box-sizing: border-box; }

/* Download bar */
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #0F6E56;
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
  max-width: 200px;
  height: 6px;
  background: #e5e5e5;
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: #1D9E75;
  border-radius: 3px;
  transition: width 0.3s;
}
.download-note { font-size: 11px; color: #888; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }

/* Report wrapper */
.report-wrapper {
  background: #f0f0f0;
  padding: 24px;
  min-height: 100vh;
  font-family: 'Vazirmatn', sans-serif;
  direction: rtl;
}

/* A4 page: 794px wide × 1123px tall at 96dpi */
.page {
  background: #fff;
  width: 794px;
  min-height: 1123px;
  margin: 0 auto 24px;
  padding: 48px 52px;
  position: relative;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border-radius: 4px;
  overflow: hidden;
}
.page-with-footer { padding-bottom: 64px; }
.page-footer-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #0F6E56;
  padding: 10px 52px;
  display: flex;
  justify-content: space-between;
  border-radius: 0 0 4px 4px;
}
.page-footer-bar span { font-size: 10px; color: #9FE1CB; }

/* Cover */
.cover-center { text-align: center; padding-top: 60px; }
.cover-logo {
  width: 72px; height: 72px;
  background: #0F6E56; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.report-title { font-size: 28px; font-weight: 700; color: #0F6E56; margin-bottom: 6px; }
.report-subtitle { font-size: 14px; color: #5F5E5A; margin-bottom: 4px; }
.report-year { font-size: 13px; color: #1D9E75; font-weight: 500; margin-bottom: 28px; }
.cover-stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 12px; margin: 0 auto 24px; max-width: 580px;
}
.cover-stat { background: #E1F5EE; border-radius: 8px; padding: 14px; text-align: center; }
.cover-stat .num { font-size: 24px; font-weight: 700; color: #0F6E56; }
.cover-stat .lbl { font-size: 11px; color: #0F6E56; margin-top: 4px; }
.section-boxes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
.section-box { border: 0.5px solid #e5e5e5; border-radius: 8px; padding: 14px; text-align: center; }
.section-box.env { border-top: 3px solid #1D9E75; }
.section-box.soc { border-top: 3px solid #185FA5; }
.section-box.gov { border-top: 3px solid #534AB7; }
.sb-label { font-size: 11px; color: #888; margin-bottom: 4px; }
.sb-num { font-size: 20px; font-weight: 700; }
.section-box.env .sb-num { color: #0F6E56; }
.section-box.soc .sb-num { color: #185FA5; }
.section-box.gov .sb-num { color: #534AB7; }
.sb-sub { font-size: 10px; color: #aaa; }
.cover-footer-note { font-size: 11px; color: #aaa; margin-top: 20px; line-height: 1.7; }
.frameworks-row {
  margin-top: 12px; font-size: 12px; color: #1D9E75;
  font-weight: 500; letter-spacing: 0.5px;
}

/* Page header */
.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #1D9E75;
}
.page-section-title { font-size: 18px; font-weight: 700; color: #0F6E56; }
.page-section-sub { font-size: 11px; color: #888; margin-top: 2px; }
.header-meta { text-align: left; }
.hm-label { font-size: 10px; color: #aaa; margin-bottom: 2px; }
.hm-value { font-size: 13px; font-weight: 500; color: #2C2C2A; }
.section-title {
  font-size: 16px; font-weight: 700; color: #2C2C2A;
  padding-bottom: 8px; border-bottom: 0.5px solid #e5e5e5; margin-bottom: 12px;
}
.section-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;
}
.pill-env { background: #E1F5EE; color: #085041; }
.pill-soc { background: #E6F1FB; color: #0C447C; }
.pill-gov { background: #EEEDFE; color: #3C3489; }

/* Narratives */
.narrative-box {
  background: #f9fafb; border-radius: 8px;
  padding: 12px 14px; font-size: 11px; color: #5F5E5A;
  line-height: 1.8; margin-bottom: 16px;
  border-right: 3px solid #1D9E75;
}
.narrative-box.env-border { border-right-color: #1D9E75; }
.narrative-box.soc-border { border-right-color: #185FA5; }
.narrative-box.gov-border { border-right-color: #534AB7; }

/* Layout */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

/* KPI */
.kpi-grid { display: grid; gap: 10px; margin-bottom: 12px; }
.kpi-grid.three { grid-template-columns: repeat(3, 1fr); }
.kpi-grid.two { grid-template-columns: repeat(2, 1fr); }
.kpi-card { border: 0.5px solid #e5e5e5; border-radius: 8px; padding: 10px 12px; }
.kpi-label { font-size: 10px; color: #888; margin-bottom: 4px; line-height: 1.3; }
.kpi-value { font-size: 18px; font-weight: 700; color: #2C2C2A; }
.kpi-value.env { color: #1D9E75; }
.kpi-value.soc { color: #185FA5; }
.kpi-value.gov { color: #534AB7; }
.kpi-value.warn { color: #BA7517; }
.kpi-value.danger { color: #A32D2D; }
.kpi-unit { font-size: 10px; color: #888; font-weight: 400; margin-right: 3px; }

/* Domain title */
.domain-title {
  font-size: 12px; font-weight: 500; color: #444;
  margin: 12px 0 8px;
  display: flex; align-items: center; gap: 6px;
}
.domain-title::before {
  content: ''; display: block;
  width: 3px; height: 12px; background: #1D9E75;
  border-radius: 2px; flex-shrink: 0;
}

/* Domain cards grid */
.domain-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  margin-top: 12px;
}
.domain-card {
  border: 0.5px solid #e5e5e5; border-radius: 8px;
  padding: 10px 12px; break-inside: avoid;
}
.env-domain { border-top: 2px solid #1D9E75; }
.soc-domain { border-top: 2px solid #185FA5; }
.gov-domain { border-top: 2px solid #534AB7; }
.dc-title { font-size: 11px; font-weight: 600; color: #2C2C2A; margin-bottom: 5px; }
.dc-body { font-size: 9.5px; color: #666; line-height: 1.7; }

/* Gauge bars */
.gauge-list { display: flex; flex-direction: column; gap: 8px; }
.gauge-item { border: 0.5px solid #e5e5e5; border-radius: 6px; padding: 8px 10px; }
.gauge-label { font-size: 10px; color: #888; margin-bottom: 5px; }
.gauge-bar-bg { background: #f0f0f0; border-radius: 4px; height: 8px; overflow: hidden; }
.gauge-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
.gauge-bar-fill.env { background: #1D9E75; }
.gauge-bar-fill.soc { background: #185FA5; }
.gauge-bar-fill.gov { background: #534AB7; }
.gauge-bar-fill.warn { background: #BA7517; }
.gauge-bar-fill.pink { background: #D4537E; }

/* GHG bars */
.ghg-bar-list { display: flex; flex-direction: column; gap: 10px; margin: 10px 0 16px; }
.ghg-bar-item { display: flex; align-items: center; gap: 8px; font-size: 11px; }
.ghg-bar-label { width: 70px; color: #5F5E5A; flex-shrink: 0; text-align: right; }
.ghg-bar-bg { flex: 1; background: #f0f0f0; border-radius: 4px; height: 18px; overflow: hidden; }
.ghg-bar-fill {
  height: 100%; border-radius: 4px;
  display: flex; align-items: center; justify-content: flex-end;
  padding-right: 6px; font-size: 10px; color: #fff; font-weight: 500;
}
.ghg-bar-fill.s1 { background: #1D9E75; }
.ghg-bar-fill.s2 { background: #378ADD; }
.ghg-bar-fill.s3 { background: #D4537E; }
.ghg-pct { font-size: 10px; color: #888; width: 35px; text-align: left; flex-shrink: 0; }

/* Waste bar */
.waste-bar { display: flex; height: 28px; border-radius: 4px; overflow: hidden; gap: 2px; margin: 10px 0; }
.waste-seg { display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 500; color: #fff; }
.waste-seg.recycled { background: #1D9E75; }
.waste-seg.landfill { background: #D4537E; }

/* Section items table */
.section-items-table { margin-top: 12px; border: 0.5px solid #e5e5e5; border-radius: 6px; overflow: hidden; font-size: 10px; }
.sit-header {
  display: grid; grid-template-columns: 1fr auto auto;
  gap: 8px; background: #f5f5f5; padding: 6px 10px;
  font-weight: 600; color: #555;
}
.sit-row {
  display: grid; grid-template-columns: 1fr auto auto;
  gap: 8px; padding: 5px 10px;
  border-top: 0.5px solid #f0f0f0; color: #444;
}
.sit-row:nth-child(even) { background: #fafafa; }
.sit-val { color: #0F6E56; font-weight: 500; white-space: nowrap; }
.sit-code { color: #aaa; font-size: 9px; white-space: nowrap; }

/* Highlights */
.highlight-row {
  padding: 7px 10px; border-radius: 4px;
  font-size: 11px; margin-bottom: 6px; border-right: 3px solid transparent;
}
.highlight-row.env-bg { background: #E1F5EE; color: #085041; border-right-color: #1D9E75; }
.highlight-row.warn-bg { background: #FAEEDA; color: #854F0B; border-right-color: #BA7517; }

/* Priority / achieved lists */
.priority-list, .achieved-list { display: flex; flex-direction: column; gap: 0; }
.priority-item { padding: 6px 0; border-bottom: 0.5px solid #f0f0f0; font-size: 11px; color: #854F0B; }
.achieved-item { padding: 6px 0; border-bottom: 0.5px solid #f0f0f0; font-size: 11px; color: #0F6E56; font-weight: 500; }

/* Conclusion */
.conclusion-box { background: #E1F5EE; border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; }
.conclusion-box h3 { font-size: 14px; font-weight: 700; color: #0F6E56; margin-bottom: 8px; }
.conclusion-box p { font-size: 11px; color: #085041; line-height: 1.7; }

.report-end-note {
  font-size: 10px; color: #aaa; text-align: center;
  margin-top: 20px; padding-top: 12px; border-top: 0.5px solid #e5e5e5;
}
.page-num { position: absolute; bottom: 20px; left: 52px; font-size: 10px; color: #bbb; }
</style>