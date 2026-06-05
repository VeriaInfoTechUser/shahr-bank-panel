<template>
  <div class="report-conclusion">
    <!-- Conclusion Narrative Section -->
    <div v-if="narrative" class="conclusion-section">
      <h2 class="conclusion-title">{{ narrative.title }}</h2>
      <div class="conclusion-body">{{ narrative.body }}</div>
    </div>

    <!-- Export Actions Section -->
    <div class="export-section">
      <h3 class="section-title">{{ t('esg.report.export_options') }}</h3>
      <div class="export-buttons-grid">
        <!-- Download PDF -->
        <button class="export-button pdf-button" @click="exportPDF" :disabled="isExporting">
          <span class="button-icon">📄</span>
          <span class="button-text">{{ t('esg.report.download_pdf') }}</span>
          <span v-if="isExporting && exportingFormat === 'pdf'" class="spinner"></span>
        </button>

        <!-- Download Excel -->
        <button class="export-button excel-button" @click="exportExcel" :disabled="isExporting">
          <span class="button-icon">📊</span>
          <span class="button-text">{{ t('esg.report.download_excel') }}</span>
          <span v-if="isExporting && exportingFormat === 'excel'" class="spinner"></span>
        </button>

        <!-- Print Report -->
        <button class="export-button print-button" @click="printReport">
          <span class="button-icon">🖨️</span>
          <span class="button-text">{{ t('esg.report.print_report') }}</span>
        </button>

        <!-- Share Link -->
        <button class="export-button share-button" @click="shareLink">
          <span class="button-icon">🔗</span>
          <span class="button-text">{{ shareButtonText }}</span>
        </button>
      </div>
    </div>

    <!-- Export Status Message -->
    <transition name="fade">
      <div v-if="exportMessage" :class="['export-message', exportMessageType]">
        {{ exportMessage }}
      </div>
    </transition>

    <!-- Contact & Feedback Section -->
    <div class="contact-section">
      <h3 class="section-title">{{ t('esg.report.contact_feedback') }}</h3>
      <div class="contact-content">
        <div class="contact-info">
          <div class="info-item">
            <span class="info-icon">📧</span>
            <div class="info-text">
              <div class="info-label">{{ t('esg.report.email') }}</div>
              <div class="info-value">{{ contactInfo.email || 'contact@organization.com' }}</div>
            </div>
          </div>
          <div class="info-item">
            <span class="info-icon">🌐</span>
            <div class="info-text">
              <div class="info-label">{{ t('esg.report.website') }}</div>
              <div class="info-value">{{ contactInfo.website || 'www.organization.com' }}</div>
            </div>
          </div>
          <div class="info-item">
            <span class="info-icon">📞</span>
            <div class="info-text">
              <div class="info-label">{{ t('esg.report.phone') }}</div>
              <div class="info-value">{{ contactInfo.phone || '+1 (000) 000-0000' }}</div>
            </div>
          </div>
        </div>

        <form class="feedback-form" @submit.prevent="submitFeedback">
          <div class="form-group">
            <label class="form-label">{{ t('esg.report.feedback_message') }}</label>
            <textarea 
              v-model="feedbackForm.message" 
              class="form-input textarea"
              :placeholder="t('esg.report.feedback_placeholder')"
              rows="4"
            ></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('esg.report.feedback_email') }}</label>
            <input 
              v-model="feedbackForm.email" 
              type="email" 
              class="form-input"
              :placeholder="t('esg.report.your_email')"
            />
          </div>
          <button type="submit" class="submit-button">
            {{ t('esg.report.send_feedback') }}
          </button>
        </form>
      </div>
    </div>

    <!-- Report Metadata -->
    <div class="metadata-section">
      <h3 class="section-title">{{ t('esg.report.report_info') }}</h3>
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="metadata-label">{{ t('esg.report.generated_at') }}:</span>
          <span class="metadata-value">{{ formattedGeneratedDate }}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">{{ t('esg.report.reporting_year') }}:</span>
          <span class="metadata-value">{{ reportData?.meta?.reporting_year || '-' }}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">{{ t('esg.report.organization') }}:</span>
          <span class="metadata-value">{{ organizationName || 'Organization Name' }}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">{{ t('esg.report.total_controls') }}:</span>
          <span class="metadata-value">{{ totalControls }}</span>
        </div>
      </div>
    </div>

    <!-- Hidden elements for export -->
    <div ref="pdfContentRef" class="pdf-export-content" style="display: none;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

interface ReportData {
  meta?: {
    generated_at: string
    reporting_year: number
  }
  key_figures?: any[]
  environmental?: Record<string, any>
  social?: Record<string, any>
  governance?: Record<string, any>
  narratives?: Record<string, any>
}

interface Props {
  narrative?: {
    title: string
    body: string
  }
  reportData?: ReportData
  organizationName?: string
  contactInfo?: {
    email?: string
    website?: string
    phone?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  organizationName: 'Organization Name',
  contactInfo: () => ({
    email: 'contact@organization.com',
    website: 'www.organization.com',
    phone: '+1 (000) 000-0000',
  }),
})

const { t, locale } = useI18n()

// Export state
const isExporting = ref(false)
const exportingFormat = ref<'pdf' | 'excel' | null>(null)
const exportMessage = ref('')
const exportMessageType = ref<'success' | 'error' | 'info'>('success')
const shareButtonText = ref(t('esg.report.share_link'))
const pdfContentRef = ref<HTMLElement | null>(null)

// Feedback form state
const feedbackForm = ref({
  message: '',
  email: '',
})

// Computed properties
const formattedGeneratedDate = computed(() => {
  if (!props.reportData?.meta?.generated_at) return '-'
  const date = new Date(props.reportData.meta.generated_at)
  return new Intl.DateTimeFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
})

const totalControls = computed(() => {
  let count = 0
  if (props.reportData?.environmental) {
    Object.values(props.reportData.environmental).forEach(section => {
      if (section?.controls?.length) count += section.controls.length
    })
  }
  if (props.reportData?.social) {
    Object.values(props.reportData.social).forEach(section => {
      if (section?.controls?.length) count += section.controls.length
    })
  }
  if (props.reportData?.governance) {
    Object.values(props.reportData.governance).forEach(section => {
      if (section?.controls?.length) count += section.controls.length
    })
  }
  return count
})

// Export PDF
const exportPDF = async () => {
  isExporting.value = true
  exportingFormat.value = 'pdf'
  
  try {
    // Dynamically import html2pdf to avoid build errors if not installed
    const { html2pdf } = await import('html2pdf.js')
    
    const element = document.body
    // Use a clone to modify styles safely
    const clone = element.cloneNode(true) as HTMLElement

    // Convert canvases to images
    const canvases = Array.from(clone.querySelectorAll('canvas'))
    for (const canvas of canvases) {
      try {
        const dataURL = (canvas as HTMLCanvasElement).toDataURL('image/png')
        const img = document.createElement('img')
        img.src = dataURL
        img.style.width = (canvas as HTMLCanvasElement).style.width || (canvas as HTMLCanvasElement).width + 'px'
        img.style.height = (canvas as HTMLCanvasElement).style.height || (canvas as HTMLCanvasElement).height + 'px'
        canvas.parentNode?.replaceChild(img, canvas)
      } catch (err) { console.warn('Canvas conversion failed', err) }
    }

    // Sanitize styles
    const all = Array.from(clone.querySelectorAll('*')) as HTMLElement[]
    all.forEach((elem) => {
      try {
        const style = window.getComputedStyle(elem as Element)
        const bg = style.backgroundColor
        const unsafeColor = (s: string | null) => !s || s.includes('oklch') || s.includes('oklab') || s.includes('color(')
        if (bg && !unsafeColor(bg) && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') elem.style.backgroundColor = bg
        else if (elem === clone || elem.tagName.toLowerCase() === 'body') elem.style.backgroundColor = '#ffffff'
        const fg = style.color
        if (fg && !unsafeColor(fg)) elem.style.color = fg
        elem.style.backgroundImage = 'none'
        elem.style.boxShadow = 'none'
        elem.style.filter = 'none'
        if (style.borderColor && style.borderColor !== 'transparent') elem.style.borderColor = style.borderColor
      } catch (err) {}
    })

    const opt = {
      margin: 10,
      filename: `ESG-Report-${props.reportData?.meta?.reporting_year || 'Report'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }

    html2pdf().set(opt).from(clone).save()
    
    exportMessage.value = t('esg.report.pdf_export_success')
    exportMessageType.value = 'success'
    setTimeout(() => { exportMessage.value = '' }, 3000)
  } catch (error) {
    console.error('PDF export error:', error)
    exportMessage.value = t('esg.report.pdf_export_error')
    exportMessageType.value = 'error'
    setTimeout(() => { exportMessage.value = '' }, 3000)
  } finally {
    isExporting.value = false
    exportingFormat.value = null
  }
}

// Export Excel
const exportExcel = async () => {
  isExporting.value = true
  exportingFormat.value = 'excel'
  
  try {
    // Dynamically import xlsx to avoid build errors if not installed
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    
    // Sheet 1: Key Figures
    if (props.reportData?.key_figures) {
      const kfData = props.reportData.key_figures.map((kf: any) => ({
        'Title': kf.title,
        'Value': kf.value,
        'Unit': kf.unit,
        'Category': kf.category,
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kfData), 'Key Figures')
    }
    
    // Sheet 2: Environmental
    const envControls: any[] = []
    if (props.reportData?.environmental) {
      Object.entries(props.reportData.environmental).forEach(([section, data]: [string, any]) => {
        if (data?.controls) {
          data.controls.forEach((control: any) => {
            envControls.push({
              'Section': section,
              'Title': control.title,
              'Answer': control.answer,
              'Unit': control.unit,
              'Metric Code': control.metric_code,
            })
          })
        }
      })
    }
    if (envControls.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(envControls), 'Environmental')
    }
    
    // Sheet 3: Social
    const socialControls: any[] = []
    if (props.reportData?.social) {
      Object.entries(props.reportData.social).forEach(([section, data]: [string, any]) => {
        if (data?.controls) {
          data.controls.forEach((control: any) => {
            socialControls.push({
              'Section': section,
              'Title': control.title,
              'Answer': control.answer,
              'Unit': control.unit,
              'Metric Code': control.metric_code,
            })
          })
        }
      })
    }
    if (socialControls.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(socialControls), 'Social')
    }
    
    // Sheet 4: Governance
    const govControls: any[] = []
    if (props.reportData?.governance) {
      Object.entries(props.reportData.governance).forEach(([section, data]: [string, any]) => {
        if (data?.controls) {
          data.controls.forEach((control: any) => {
            govControls.push({
              'Section': section,
              'Title': control.title,
              'Answer': control.answer,
              'Unit': control.unit,
              'Metric Code': control.metric_code,
            })
          })
        }
      })
    }
    if (govControls.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(govControls), 'Governance')
    }
    
    // Sheet 5: All Controls Summary
    const allControls: any[] = [...envControls, ...socialControls, ...govControls]
    if (allControls.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allControls), 'All Controls')
    }
    
    // Add metadata sheet
    const metadataSheet = [
      { 'Property': 'Organization', 'Value': props.organizationName },
      { 'Property': 'Reporting Year', 'Value': props.reportData?.meta?.reporting_year },
      { 'Property': 'Generated Date', 'Value': props.reportData?.meta?.generated_at },
      { 'Property': 'Total Controls', 'Value': totalControls.value },
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metadataSheet), 'Metadata')
    
    XLSX.writeFile(wb, `ESG-Report-${props.reportData?.meta?.reporting_year || 'Report'}.xlsx`)
    
    exportMessage.value = t('esg.report.excel_export_success')
    exportMessageType.value = 'success'
    setTimeout(() => { exportMessage.value = '' }, 3000)
  } catch (error) {
    console.error('Excel export error:', error)
    exportMessage.value = t('esg.report.excel_export_error')
    exportMessageType.value = 'error'
    setTimeout(() => { exportMessage.value = '' }, 3000)
  } finally {
    isExporting.value = false
    exportingFormat.value = null
  }
}

// Print Report
const printReport = () => {
  window.print()
}

// Share Link
const shareLink = () => {
  const currentUrl = window.location.href
  navigator.clipboard.writeText(currentUrl).then(() => {
    shareButtonText.value = t('esg.report.link_copied')
    setTimeout(() => {
      shareButtonText.value = t('esg.report.share_link')
    }, 2000)
  }).catch(() => {
    exportMessage.value = t('esg.report.share_error')
    exportMessageType.value = 'error'
    setTimeout(() => { exportMessage.value = '' }, 3000)
  })
}

// Submit Feedback
const submitFeedback = async () => {
  if (!feedbackForm.value.message.trim()) {
    exportMessage.value = t('esg.report.feedback_required')
    exportMessageType.value = 'error'
    setTimeout(() => { exportMessage.value = '' }, 3000)
    return
  }

  try {
    // Here you would typically send the feedback to an API
    // For now, we'll just show a success message
    exportMessage.value = t('esg.report.feedback_sent_success')
    exportMessageType.value = 'success'
    feedbackForm.value.message = ''
    feedbackForm.value.email = ''
    setTimeout(() => { exportMessage.value = '' }, 3000)
  } catch (error) {
    exportMessage.value = t('esg.report.feedback_error')
    exportMessageType.value = 'error'
    setTimeout(() => { exportMessage.value = '' }, 3000)
  }
}

// Lifecycle
onMounted(() => {
  // Ensure the component is ready for export
})
</script>

<style scoped lang="scss">
.report-conclusion {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

// Conclusion Section
.conclusion-section {
  padding: 2rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #dbeafe 100%);
  border-radius: 0.75rem;
  border-left: 4px solid #0891b2;

  [dir='rtl'] & {
    border-left: none;
    border-right: 4px solid #0891b2;
  }

  .conclusion-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #0f766e;
    margin: 0 0 1rem 0;
  }

  .conclusion-body {
    font-size: 1rem;
    line-height: 1.8;
    color: #0f766e;
    word-break: break-word;
  }
}

// Export Section
.export-section {
  padding: 2rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1.5rem 0;
  }
}

.export-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.export-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border: 2px solid;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  [dir='rtl'] & {
    flex-direction: row-reverse;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .button-icon {
    font-size: 1.25rem;
  }

  .button-text {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid currentColor;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 0.8s linear infinite;
  }

  &.pdf-button {
    background: #fef3c7;
    border-color: #f59e0b;
    color: #92400e;

    &:hover:not(:disabled) {
      background: #fde68a;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }
  }

  &.excel-button {
    background: #dcfce7;
    border-color: #10b981;
    color: #065f46;

    &:hover:not(:disabled) {
      background: #bbf7d0;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
  }

  &.print-button {
    background: #dbeafe;
    border-color: #2563eb;
    color: #1e40af;

    &:hover:not(:disabled) {
      background: #bfdbfe;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
  }

  &.share-button {
    background: #fce7f3;
    border-color: #ec4899;
    color: #831843;

    &:hover:not(:disabled) {
      background: #fbcfe8;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
    }
  }
}

// Export Message
.export-message {
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
  font-weight: 500;
  animation: slideDown 0.3s ease;

  &.success {
    background: #dcfce7;
    color: #065f46;
    border-left: 4px solid #10b981;

    [dir='rtl'] & {
      border-left: none;
      border-right: 4px solid #10b981;
    }
  }

  &.error {
    background: #fee2e2;
    color: #7f1d1d;
    border-left: 4px solid #ef4444;

    [dir='rtl'] & {
      border-left: none;
      border-right: 4px solid #ef4444;
    }
  }

  &.info {
    background: #dbeafe;
    color: #1e40af;
    border-left: 4px solid #2563eb;

    [dir='rtl'] & {
      border-left: none;
      border-right: 4px solid #2563eb;
    }
  }
}

// Contact & Feedback Section
.contact-section {
  padding: 2rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1.5rem 0;
  }
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border-left: 3px solid #0891b2;

  [dir='rtl'] & {
    flex-direction: row-reverse;
    border-left: none;
    border-right: 3px solid #0891b2;
  }

  .info-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .info-text {
    flex: 1;

    .info-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .info-value {
      font-size: 1rem;
      font-weight: 500;
      color: #1f2937;
      word-break: break-word;
    }
  }
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .form-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #374151;
  }

  .form-input {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.95rem;
    font-family: inherit;
    transition: all 0.3s ease;

    [dir='rtl'] & {
      direction: rtl;
      text-align: right;
    }

    &:focus {
      outline: none;
      border-color: #0891b2;
      box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
    }

    &.textarea {
      resize: vertical;
      min-height: 100px;
    }
  }
}

.submit-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

// Metadata Section
.metadata-section {
  padding: 2rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1.5rem 0;
  }
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.metadata-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  border-left: 3px solid #0891b2;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  [dir='rtl'] & {
    border-left: none;
    border-right: 3px solid #0891b2;
  }

  .metadata-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #6b7280;
  }

  .metadata-value {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }
}

// PDF Export Content (hidden)
.pdf-export-content {
  direction: rtl;
  unicode-bidi: bidi-override;
}

// Animations
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Print Styles
@media print {
  .report-conclusion {
    padding: 0;
    gap: 2rem;
  }

  .export-section,
  .contact-section {
    display: none;
  }

  .conclusion-section {
    page-break-after: always;
  }
}

// Responsive
@media (max-width: 768px) {
  .report-conclusion {
    padding: 1rem;
    gap: 1.5rem;
  }

  .conclusion-section {
    padding: 1.5rem;

    .conclusion-title {
      font-size: 1.5rem;
    }

    .conclusion-body {
      font-size: 0.9rem;
    }
  }

  .export-section,
  .contact-section,
  .metadata-section {
    padding: 1.5rem;

    .section-title {
      font-size: 1.1rem;
    }
  }
}
</style>
