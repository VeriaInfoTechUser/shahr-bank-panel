<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ response: any }>()

const data = computed(() => props.response?.data || null)
const meta = computed(() => data.value?.meta || {})
const keyFigures = computed(() => data.value?.key_figures || [])
const narratives = computed(() => data.value?.narratives || {})

function getKF(slug: string) {
  return keyFigures.value.find((x: any) => x.slug === slug) || {}
}
function fmt(v: number | string) {
  return typeof v === 'number' ? v.toLocaleString('fa-IR') : v
}
function pct(val: number, max: number) {
  return Math.round((val / max) * 100) + '%'
}

</script>

<template>
  <div v-if="data" class="report-wrapper" dir="rtl">

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
          تاریخ تولید: {{ meta.generated_at }} | GRI · ISSB · TCFD · CDP · SBTi
        </div>
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

      <div class="narrative-box">
        {{ narratives.about_report?.body }}
      </div>

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
          <div class="highlight-row env-bg">✓ کاهش ۱۲٪ کربن نسبت به دوره قبل</div>
          <div class="highlight-row env-bg">✓ صفر فوتی در محیط کار</div>
          <div class="highlight-row env-bg">✓ حضور ۹۷٪ هیئت‌مدیره</div>
        </div>
        <div>
          <div class="domain-title">نیازمند توجه</div>
          <div class="highlight-row warn-bg">△ انرژی تجدیدپذیر ۱۸٪ (هدف: ۳۰٪)</div>
          <div class="highlight-row warn-bg">△ بازیافت آب ۲۲٪</div>
          <div class="highlight-row warn-bg">△ درمان ریسک ۷۲٪</div>
        </div>
      </div>
      <div class="page-num">صفحه ۲</div>
    </div>

    <!-- PAGE 3: Energy -->
    <div class="page">
      <div class="page-header">
        <span class="section-pill pill-env">🌿 محیط‌زیست — انرژی</span>
        <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۲</div></div>
      </div>
      <div class="section-title">مدیریت انرژی و منابع</div>
      <div class="narrative-box env-border">
        {{ narratives.environmental?.domains?.['energy-resource-management']?.body?.substring(0, 300) }}...
      </div>
      <div class="kpi-grid three">
        <div class="kpi-card"><div class="kpi-label">مصرف کل برق</div><div class="kpi-value env">{{ fmt(getKF('total-electricity-consumption').answer_raw) }} <span class="kpi-unit">kWh</span></div></div>
        <div class="kpi-card"><div class="kpi-label">مصرف گاز طبیعی</div><div class="kpi-value env">{{ fmt(getKF('total-natural-gas-consumption').answer_raw) }} <span class="kpi-unit">m³</span></div></div>
        <div class="kpi-card"><div class="kpi-label">سوخت مایع</div><div class="kpi-value env">{{ fmt(getKF('total-liquid-fuel-diesel-consumption').answer_raw) }} <span class="kpi-unit">لیتر</span></div></div>
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
      <div class="page-num">صفحه ۳</div>
    </div>

    <!-- PAGE 4: GHG -->
    <div class="page">
      <div class="page-header">
        <span class="section-pill pill-env">🌿 محیط‌زیست — گازهای گلخانه‌ای</span>
        <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۳</div></div>
      </div>
      <div class="section-title">انتشار گازهای گلخانه‌ای (GHG)</div>
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
          <span class="ghg-pct">{{ Math.round(getKF('scope-1-ghg-emissions').answer_raw / getKF('total-ghg-emissions').answer_raw * 100) }}%</span>
        </div>
        <div class="ghg-bar-item">
          <span class="ghg-bar-label">Scope 2</span>
          <div class="ghg-bar-bg">
            <div class="ghg-bar-fill s2" :style="{width: pct(getKF('scope-2-ghg-emissions').answer_raw, getKF('total-ghg-emissions').answer_raw)}">
              {{ fmt(getKF('scope-2-ghg-emissions').answer_raw) }}
            </div>
          </div>
          <span class="ghg-pct">{{ Math.round(getKF('scope-2-ghg-emissions').answer_raw / getKF('total-ghg-emissions').answer_raw * 100) }}%</span>
        </div>
        <div class="ghg-bar-item">
          <span class="ghg-bar-label">Scope 3</span>
          <div class="ghg-bar-bg">
            <div class="ghg-bar-fill s3" :style="{width: pct(getKF('scope-3-ghg-emissions').answer_raw, getKF('total-ghg-emissions').answer_raw)}">
              {{ fmt(getKF('scope-3-ghg-emissions').answer_raw) }}
            </div>
          </div>
          <span class="ghg-pct">{{ Math.round(getKF('scope-3-ghg-emissions').answer_raw / getKF('total-ghg-emissions').answer_raw * 100) }}%</span>
        </div>
      </div>
      <div class="page-num">صفحه ۴</div>
    </div>

    <!-- PAGE 5: Water & Waste -->
    <div class="page">
      <div class="page-header">
        <span class="section-pill pill-env">🌿 محیط‌زیست — آب و پسماند</span>
        <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۴</div></div>
      </div>
      <div class="section-title">مدیریت آب و پسماند</div>
      <div class="two-col">
        <div>
          <div class="domain-title">آب</div>
          <div class="kpi-grid two">
            <div class="kpi-card"><div class="kpi-label">مصرف کل آب</div><div class="kpi-value env">{{ fmt(getKF('total-water-withdrawal-consumption').answer_raw) }} <span class="kpi-unit">m³</span></div></div>
            <div class="kpi-card"><div class="kpi-label">بازیافت آب</div><div class="kpi-value env">{{ getKF('recycled-reused-water-share').answer_raw }}%</div></div>
          </div>
          <div class="gauge-list">
            <div class="gauge-item"><div class="gauge-label">کاهش مصرف آب ({{ getKF('water-consumption-reduction-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill env" :style="{width: (getKF('water-consumption-reduction-rate').answer_raw * 10) + '%'}"></div></div></div>
            <div class="gauge-item"><div class="gauge-label">واحدهای در مناطق تنش آبی ({{ getKF('operations-in-water-stressed-areas-share').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill warn" :style="{width: getKF('operations-in-water-stressed-areas-share').answer_raw + '%'}"></div></div></div>
          </div>
        </div>
        <div>
          <div class="domain-title">پسماند</div>
          <div class="kpi-grid two">
            <div class="kpi-card"><div class="kpi-label">پسماند کل</div><div class="kpi-value env">{{ fmt(getKF('total-waste-generated').answer_raw) }} <span class="kpi-unit">تن</span></div></div>
            <div class="kpi-card"><div class="kpi-label">پسماند خطرناک</div><div class="kpi-value danger">{{ getKF('hazardous-waste-generated').answer_raw }} <span class="kpi-unit">تن</span></div></div>
          </div>
          <div class="waste-bar">
            <div class="waste-seg recycled" :style="{flex: getKF('recycled-reused-waste-share').answer_raw}">بازیافت {{ getKF('recycled-reused-waste-share').answer_raw }}٪</div>
            <div class="waste-seg landfill" :style="{flex: getKF('waste-sent-to-final-disposal-share').answer_raw}">دفن {{ getKF('waste-sent-to-final-disposal-share').answer_raw }}٪</div>
          </div>
        </div>
      </div>
      <div class="page-num">صفحه ۵</div>
    </div>

    <!-- PAGE 6: Workforce -->
    <div class="page">
      <div class="page-header">
        <span class="section-pill pill-soc">👥 اجتماعی — نیروی انسانی</span>
        <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۵</div></div>
      </div>
      <div class="section-title">ساختار و جمعیت‌شناسی نیروی انسانی</div>
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
            <div class="gauge-item"><div class="gauge-label">بالای ۵۰ سال ({{ getKF('employees-over-50-share').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill soc" style="background:#888;" :style="{width: getKF('employees-over-50-share').answer_raw + '%'}"></div></div></div>
          </div>
        </div>
        <div>
          <div class="domain-title">شرایط اشتغال</div>
          <div class="gauge-list">
            <div class="gauge-item"><div class="gauge-label">قرارداد دائمی ({{ getKF('permanent-long-term-employment-share').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill soc" :style="{width: getKF('permanent-long-term-employment-share').answer_raw + '%'}"></div></div></div>
            <div class="gauge-item"><div class="gauge-label">پوشش مزایا ({{ getKF('core-benefits-coverage-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill soc" :style="{width: getKF('core-benefits-coverage-rate').answer_raw + '%'}"></div></div></div>
          </div>
          <div class="domain-title" style="margin-top:12px">آموزش</div>
          <div class="kpi-grid two">
            <div class="kpi-card"><div class="kpi-label">کل ساعات آموزش</div><div class="kpi-value soc">{{ fmt(getKF('total-training-hours').answer_raw) }}</div></div>
            <div class="kpi-card"><div class="kpi-label">ساعت/نفر</div><div class="kpi-value soc">{{ getKF('average-training-hours-per-employee').answer_raw }}</div></div>
          </div>
        </div>
      </div>
      <div class="page-num">صفحه ۶</div>
    </div>

    <!-- PAGE 7: Health, Safety, Engagement -->
    <div class="page">
      <div class="page-header">
        <span class="section-pill pill-soc">👥 اجتماعی — سلامت و مشارکت</span>
        <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۶</div></div>
      </div>
      <div class="section-title">سلامت، ایمنی و مشارکت کارکنان</div>
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
        </div>
        <div>
          <div class="domain-title">مشارکت کارکنان</div>
          <div class="kpi-grid two">
            <div class="kpi-card"><div class="kpi-label">رضایت کارکنان</div><div class="kpi-value soc">{{ getKF('employee-engagement-score').answer_raw }}%</div></div>
            <div class="kpi-card"><div class="kpi-label">نگهداشت کلیدی</div><div class="kpi-value soc">{{ getKF('key-employee-retention-rate').answer_raw }}%</div></div>
          </div>
          <div class="gauge-list">
            <div class="gauge-item"><div class="gauge-label">ترک خدمت داوطلبانه ({{ getKF('voluntary-turnover-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill env" :style="{width: getKF('voluntary-turnover-rate').answer_raw + '%'}"></div></div></div>
            <div class="gauge-item"><div class="gauge-label">رضایت مشتری ({{ getKF('customer-satisfaction-score').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill soc" :style="{width: getKF('customer-satisfaction-score').answer_raw + '%'}"></div></div></div>
          </div>
        </div>
      </div>
      <div class="page-num">صفحه ۷</div>
    </div>

    <!-- PAGE 8: Governance -->
    <div class="page">
      <div class="page-header">
        <span class="section-pill pill-gov">🏛 حاکمیت — هیئت‌مدیره</span>
        <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۷</div></div>
      </div>
      <div class="section-title">ساختار حاکمیت شرکتی و مدیریت ریسک</div>
      <div class="two-col">
        <div>
          <div class="domain-title">هیئت‌مدیره</div>
          <div class="kpi-grid two">
            <div class="kpi-card"><div class="kpi-label">اعضا</div><div class="kpi-value gov">{{ getKF('board-members-count').answer_raw }} <span class="kpi-unit">نفر</span></div></div>
            <div class="kpi-card"><div class="kpi-label">کمیته‌های نظارتی</div><div class="kpi-value gov">{{ getKF('active-oversight-committees-count').answer_raw }}</div></div>
          </div>
          <div class="gauge-list">
            <div class="gauge-item"><div class="gauge-label">نرخ حضور ({{ getKF('board-meeting-attendance-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('board-meeting-attendance-rate').answer_raw + '%'}"></div></div></div>
            <div class="gauge-item"><div class="gauge-label">اعضای مستقل ({{ getKF('independent-board-members-share').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('independent-board-members-share').answer_raw + '%'}"></div></div></div>
            <div class="gauge-item"><div class="gauge-label">اعضای زن ({{ getKF('female-board-members-share').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill pink" :style="{width: getKF('female-board-members-share').answer_raw + '%'}"></div></div></div>
          </div>
        </div>
        <div>
          <div class="domain-title">مدیریت ریسک</div>
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
      <div class="page-num">صفحه ۸</div>
    </div>

    <!-- PAGE 9: Ethics & Compliance -->
    <div class="page">
      <div class="page-header">
        <span class="section-pill pill-gov">🏛 حاکمیت — اخلاق و انطباق</span>
        <div class="header-meta"><div class="hm-label">بخش</div><div class="hm-value">۸</div></div>
      </div>
      <div class="section-title">اخلاق، انطباق، امنیت و زنجیره تأمین</div>
      <div class="two-col">
        <div>
          <div class="domain-title">اخلاق سازمانی</div>
          <div class="gauge-list">
            <div class="gauge-item"><div class="gauge-label">آموزش اخلاق و ضد فساد ({{ getKF('ethics-anti-corruption-training-completion-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('ethics-anti-corruption-training-completion-rate').answer_raw + '%'}"></div></div></div>
          </div>
          <div class="kpi-grid two" style="margin-top:10px">
            <div class="kpi-card"><div class="kpi-label">گزارش‌های افشاگری</div><div class="kpi-value gov">{{ getKF('whistleblowing-reports-count').answer_raw }}</div></div>
            <div class="kpi-card"><div class="kpi-label">تخلفات اخلاقی</div><div class="kpi-value warn">{{ getKF('corruption-bribery-ethics-incidents-count').answer_raw }}</div></div>
          </div>
          <div class="domain-title" style="margin-top:12px">انطباق</div>
          <div class="gauge-list">
            <div class="gauge-item"><div class="gauge-label">الزامات با کنترل ({{ getKF('regulatory-requirements-with-defined-controls-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('regulatory-requirements-with-defined-controls-rate').answer_raw + '%'}"></div></div></div>
            <div class="gauge-item"><div class="gauge-label">آموزش انطباق کارکنان ({{ getKF('compliance-training-completion-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('compliance-training-completion-rate').answer_raw + '%'}"></div></div></div>
          </div>
        </div>
        <div>
          <div class="domain-title">امنیت سایبری</div>
          <div class="gauge-list">
            <div class="gauge-item"><div class="gauge-label">سامانه‌های ارزیابی‌شده ({{ getKF('critical-systems-security-assessment-coverage').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('critical-systems-security-assessment-coverage').answer_raw + '%'}"></div></div></div>
            <div class="gauge-item"><div class="gauge-label">رفع آسیب‌پذیری ({{ getKF('high-risk-vulnerability-remediation-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('high-risk-vulnerability-remediation-rate').answer_raw + '%'}"></div></div></div>
          </div>
          <div class="kpi-grid two" style="margin-top:10px">
            <div class="kpi-card"><div class="kpi-label">رخدادهای سایبری</div><div class="kpi-value warn">{{ getKF('cybersecurity-incidents-count').answer_raw }}</div></div>
            <div class="kpi-card"><div class="kpi-label">نقض داده</div><div class="kpi-value warn">{{ getKF('data-privacy-breach-incidents-count').answer_raw }}</div></div>
          </div>
          <div class="domain-title" style="margin-top:12px">زنجیره تأمین</div>
          <div class="gauge-list">
            <div class="gauge-item"><div class="gauge-label">پذیرش منشور ESG ({{ getKF('supplier-code-of-conduct-acceptance-rate').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill gov" :style="{width: getKF('supplier-code-of-conduct-acceptance-rate').answer_raw + '%'}"></div></div></div>
            <div class="gauge-item"><div class="gauge-label">تأمین‌کنندگان ارزیابی‌شده ({{ getKF('key-suppliers-esg-assessment-coverage').answer_raw }}٪)</div><div class="gauge-bar-bg"><div class="gauge-bar-fill warn" :style="{width: getKF('key-suppliers-esg-assessment-coverage').answer_raw + '%'}"></div></div></div>
          </div>
        </div>
      </div>
      <div class="page-num">صفحه ۹</div>
    </div>

    <!-- PAGE 10: Conclusion -->
    <div class="page page-with-footer">
      <div class="page-header">
        <div><div class="page-section-title">نتیجه‌گیری و توصیه‌ها</div></div>
        <div class="header-meta"><div class="hm-label">صفحه</div><div class="hm-value">۱۰</div></div>
      </div>
      <div class="conclusion-box">
        <h3>{{ narratives.report_conclusion?.title }}</h3>
        <p>{{ narratives.report_conclusion?.body }}</p>
      </div>
      <div class="two-col" style="margin-top:16px">
        <div>
          <div class="domain-title">اقدامات اولویت‌دار</div>
          <div class="priority-list">
            <div class="priority-item">⬆ افزایش سهم انرژی تجدیدپذیر از ۱۸٪ به ۳۰٪</div>
            <div class="priority-item">⬆ بهبود نرخ بازیافت آب از ۲۲٪ به ۴۰٪</div>
            <div class="priority-item">⬆ ارتقاء اجرای برنامه‌های درمان ریسک به ۹۰٪</div>
            <div class="priority-item">⬆ کاهش شکاف پرداختی جنسیتی زیر ۳٪</div>
            <div class="priority-item">⬆ ارزیابی ۱۰۰٪ تأمین‌کنندگان از نظر ESG</div>
          </div>
        </div>
        <div>
          <div class="domain-title">دستاوردهای محقق‌شده</div>
          <div class="achieved-list">
            <div class="achieved-item">✓ صفر فوتی کاری</div>
            <div class="achieved-item">✓ کاهش ۱۲٪ انتشار کربن</div>
            <div class="achieved-item">✓ آموزش ایمنی ۹۲٪ کارکنان</div>
            <div class="achieved-item">✓ بازیافت ۶۴٪ پسماند</div>
            <div class="achieved-item">✓ نگهداشت ۹۳٪ کارکنان کلیدی</div>
          </div>
        </div>
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
</template>

<style scoped>
@media print {
  .report-wrapper { background: none; padding: 0; }
  .page { box-shadow: none; margin: 0; page-break-after: always; }
}
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700&display=swap');
*{box-sizing:border-box}
.report-wrapper{background:#f0f0f0;padding:24px;min-height:100vh;font-family:'Vazirmatn',sans-serif;direction:rtl}
.page{background:#fff;width:794px;margin:0 auto 24px;padding:40px 48px;position:relative;box-shadow:0 2px 12px rgba(0,0,0,0.08);border-radius:4px}
.page-with-footer{padding-bottom:60px}
.page-footer-bar{position:absolute;bottom:0;left:0;right:0;background:#0F6E56;padding:10px 48px;display:flex;justify-content:space-between;border-radius:0 0 4px 4px}
.page-footer-bar span{font-size:10px;color:#9FE1CB}
.cover-center{text-align:center;padding-top:40px}
.cover-logo{width:72px;height:72px;background:#0F6E56;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}
.report-title{font-size:28px;font-weight:700;color:#0F6E56;margin-bottom:6px}
.report-subtitle{font-size:14px;color:#5F5E5A;margin-bottom:4px}
.report-year{font-size:13px;color:#1D9E75;font-weight:500;margin-bottom:24px}
.cover-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:0 auto 20px;max-width:480px}
.cover-stat{background:#E1F5EE;border-radius:8px;padding:16px;text-align:center}
.cover-stat .num{font-size:26px;font-weight:700;color:#0F6E56}
.cover-stat .lbl{font-size:12px;color:#0F6E56;margin-top:4px}
.section-boxes{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.section-box{border:0.5px solid #e5e5e5;border-radius:8px;padding:14px;text-align:center}
.section-box.env{border-top:3px solid #1D9E75}
.section-box.soc{border-top:3px solid #185FA5}
.section-box.gov{border-top:3px solid #534AB7}
.sb-label{font-size:11px;color:#888;margin-bottom:4px}
.sb-num{font-size:20px;font-weight:700}
.section-box.env .sb-num{color:#0F6E56}
.section-box.soc .sb-num{color:#185FA5}
.section-box.gov .sb-num{color:#534AB7}
.sb-sub{font-size:10px;color:#aaa}
.cover-footer-note{font-size:11px;color:#aaa;margin-top:20px}
.page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #1D9E75}
.page-section-title{font-size:18px;font-weight:700;color:#0F6E56}
.page-section-sub{font-size:11px;color:#888;margin-top:2px}
.header-meta{text-align:left}
.hm-label{font-size:10px;color:#aaa;margin-bottom:2px}
.hm-value{font-size:13px;font-weight:500;color:#2C2C2A}
.section-title{font-size:16px;font-weight:700;color:#2C2C2A;padding-bottom:8px;border-bottom:0.5px solid #e5e5e5;margin-bottom:12px}
.section-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:500}
.pill-env{background:#E1F5EE;color:#085041}
.pill-soc{background:#E6F1FB;color:#0C447C}
.pill-gov{background:#EEEDFE;color:#3C3489}
.narrative-box{background:#f9fafb;border-radius:8px;padding:12px 14px;font-size:11px;color:#5F5E5A;line-height:1.7;margin-bottom:16px;border-right:3px solid #1D9E75}
.narrative-box.env-border{border-right-color:#1D9E75}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.kpi-grid{display:grid;gap:10px;margin-bottom:12px}
.kpi-grid.three{grid-template-columns:repeat(3,1fr)}
.kpi-grid.two{grid-template-columns:repeat(2,1fr)}
.kpi-card{border:0.5px solid #e5e5e5;border-radius:8px;padding:10px 12px}
.kpi-label{font-size:10px;color:#888;margin-bottom:4px;line-height:1.3}
.kpi-value{font-size:18px;font-weight:700;color:#2C2C2A}
.kpi-value.env{color:#1D9E75}
.kpi-value.soc{color:#185FA5}
.kpi-value.gov{color:#534AB7}
.kpi-value.warn{color:#BA7517}
.kpi-value.danger{color:#A32D2D}
.kpi-unit{font-size:10px;color:#888;font-weight:400;margin-right:3px}
.domain-title{font-size:12px;font-weight:500;color:#444;margin:12px 0 8px;display:flex;align-items:center;gap:6px}
.domain-title::before{content:'';display:block;width:3px;height:12px;background:#1D9E75;border-radius:2px;flex-shrink:0}
.gauge-list{display:flex;flex-direction:column;gap:8px}
.gauge-item{border:0.5px solid #e5e5e5;border-radius:6px;padding:8px 10px}
.gauge-label{font-size:10px;color:#888;margin-bottom:5px}
.gauge-bar-bg{background:#f0f0f0;border-radius:4px;height:8px;overflow:hidden}
.gauge-bar-fill{height:100%;border-radius:4px;transition:width 0.5s}
.gauge-bar-fill.env{background:#1D9E75}
.gauge-bar-fill.soc{background:#185FA5}
.gauge-bar-fill.gov{background:#534AB7}
.gauge-bar-fill.warn{background:#BA7517}
.gauge-bar-fill.pink{background:#D4537E}
.ghg-bar-list{display:flex;flex-direction:column;gap:10px;margin:10px 0 16px}
.ghg-bar-item{display:flex;align-items:center;gap:8px;font-size:11px}
.ghg-bar-label{width:70px;color:#5F5E5A;flex-shrink:0;text-align:right}
.ghg-bar-bg{flex:1;background:#f0f0f0;border-radius:4px;height:18px;overflow:hidden}
.ghg-bar-fill{height:100%;border-radius:4px;display:flex;align-items:center;justify-content:flex-end;padding-right:6px;font-size:10px;color:#fff;font-weight:500}
.ghg-bar-fill.s1{background:#1D9E75}
.ghg-bar-fill.s2{background:#378ADD}
.ghg-bar-fill.s3{background:#D4537E}
.ghg-pct{font-size:10px;color:#888;width:30px;text-align:left;flex-shrink:0}
.waste-bar{display:flex;height:28px;border-radius:4px;overflow:hidden;gap:2px;margin:10px 0}
.waste-seg{display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;color:#fff}
.waste-seg.recycled{background:#1D9E75}
.waste-seg.landfill{background:#D4537E}
.highlight-row{padding:7px 10px;border-radius:4px;font-size:11px;margin-bottom:6px;border-right:3px solid transparent}
.highlight-row.env-bg{background:#E1F5EE;color:#085041;border-right-color:#1D9E75}
.highlight-row.warn-bg{background:#FAEEDA;color:#854F0B;border-right-color:#BA7517}
.priority-list,.achieved-list{display:flex;flex-direction:column;gap:0}
.priority-item{padding:6px 0;border-bottom:0.5px solid #f0f0f0;font-size:11px;color:#854F0B}
.achieved-item{padding:6px 0;border-bottom:0.5px solid #f0f0f0;font-size:11px;color:#0F6E56;font-weight:500}
.conclusion-box{background:#E1F5EE;border-radius:12px;padding:16px 20px;margin-bottom:16px}
.conclusion-box h3{font-size:14px;font-weight:700;color:#0F6E56;margin-bottom:8px}
.conclusion-box p{font-size:11px;color:#085041;line-height:1.7}
.report-end-note{font-size:10px;color:#aaa;text-align:center;margin-top:20px;padding-top:12px;border-top:0.5px solid #e5e5e5}
.page-num{position:absolute;bottom:20px;left:48px;font-size:10px;color:#bbb}
</style>