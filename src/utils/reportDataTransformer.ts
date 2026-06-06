/**
 * Transform raw API list data into structured report format
 */

export interface ReportData {
  meta: {
    generated_at: string
    reporting_year: number
  }
  key_figures: Array<{
    code: string
    label: string
    value: number | string
    unit: string
    change?: number
    trend?: 'up' | 'down' | 'stable'
  }>
  environmental: Record<string, any[]>
  social: Record<string, any[]>
  governance: Record<string, any[]>
  narratives: {
    about_report?: string
    environmental?: string
    social?: string
    governance?: string
    report_conclusion?: string
  }
}

interface RawItem {
  type: 'domain' | 'control'
  source: string
  slug: string
  parent_slug?: string
  title: string
  summary?: string
  description?: string
  answer?: number | string | null
  answer_unit?: string
  answer_status?: string
  metric_code?: string
  kpi_code?: string
}

/**
 * Main transformer function
 */
export function transformListToReport(rawList: RawItem[]): ReportData {
  const environmental: Record<string, any[]> = {}
  const social: Record<string, any[]> = {}
  const governance: Record<string, any[]> = {}
  const keyFigures: any[] = []

  // Group items by source
  const bySource = {
    environmental: rawList.filter(item => item.source === 'environmental'),
    social: rawList.filter(item => item.source === 'social'),
    governance: rawList.filter(item => item.source === 'governance'),
  }

  // Process each source
  processSection(bySource.environmental, environmental, keyFigures)
  processSection(bySource.social, social, keyFigures)
  processSection(bySource.governance, governance, keyFigures)

  return {
    meta: {
      generated_at: new Date().toISOString(),
      reporting_year: 1405,
    },
    key_figures: keyFigures.slice(0, 9),
    environmental,
    social,
    governance,
    narratives: {
      about_report: 'گزارش پایداری سال ۱۴۰۵ بر اساس استانداردهای بین‌المللی GRI و SASB تهیه شده است.',
      environmental: 'سازمان در حوزه محیط‌زیست اقدامات معنادار انجام داده است.',
      social: 'در حوزه اجتماعی، سازمان به تنوع، سلامت و ایمنی کارکنان توجه ویژه دارد.',
      governance: 'ساختار حاکمیتی سازمان بر شفافیت و پاسخگویی استوار است.',
      report_conclusion: 'سازمان متعهد به توسعه پایدار و بهبود مستمر عملکرد ESG است.',
    },
  }
}

function processSection(items: RawItem[], section: Record<string, any[]>, keyFigures: any[]): void {
  const domains = items.filter(item => item.type === 'domain')
  const controls = items.filter(item => item.type === 'control')

  // Group controls by parent_slug (domain)
  const controlsByDomain: Record<string, RawItem[]> = {}
  controls.forEach(control => {
    const parent = control.parent_slug || 'general'
    if (!controlsByDomain[parent]) {
      controlsByDomain[parent] = []
    }
    controlsByDomain[parent].push(control)
  })

  // Populate section with grouped data
  Object.entries(controlsByDomain).forEach(([parentSlug, domainControls]) => {
    // Extract domain name (use parent_slug, transform snake_case to kebab-case)
    const domainKey = parentSlug.split('-')[0] || parentSlug

    if (!section[domainKey]) {
      section[domainKey] = []
    }

    domainControls.forEach(control => {
      if (control.answer !== null && control.answer !== undefined) {
        section[domainKey].push({
          id: control.slug,
          title: control.title,
          summary: control.summary,
          description: control.description,
          value: control.answer,
          unit: control.answer_unit,
          code: control.metric_code || control.kpi_code,
          status: control.answer_status,
        })

        // Add to key figures if it's a numeric value
        if (typeof control.answer === 'number' && keyFigures.length < 9) {
          keyFigures.push({
            code: control.metric_code || control.kpi_code || control.slug,
            label: control.summary || control.title,
            value: control.answer,
            unit: control.answer_unit || '',
          })
        }
      }
    })
  })
}
