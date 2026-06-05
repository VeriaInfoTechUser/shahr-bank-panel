/**
 * Transform API response into report format
 * Handles the actual API structure with nested domain objects
 */

export interface TransformedControl {
  id: number
  slug: string
  title: string
  code?: string
  description?: string
  value?: number | string
  unit?: string
  status?: 'answered' | 'pending'
  summary?: string
}

export interface TransformedDomain {
  id: number
  slug: string
  title: string
  description?: string
  code?: string
  order?: number
  kpis: TransformedControl[]
  avg_score?: number
}

export interface TransformedSummary {
  avg_score: number
  completion: number
  answered: number
  total_kpis: number
}

export interface TransformedSection {
  domains: TransformedDomain[]
  summary?: TransformedSummary
}

export interface TransformedReportData {
  meta: {
    reporting_period?: string
    reporting_year?: number
  }
  environmental: TransformedSection
  social: TransformedSection
  governance: TransformedSection
}

/**
 * Main transformer function
 */
export function transformReportData(apiResponse: any): TransformedReportData {
  console.log('🔍 [TRANSFORMER] Input response:', apiResponse)
  console.log('🔍 [TRANSFORMER] Input keys:', Object.keys(apiResponse || {}))

  const meta = apiResponse?.meta || {}
  console.log('📋 [TRANSFORMER] Meta:', meta)

  // Parse environmental section
  const envData = apiResponse?.environmental || {}
  console.log('🌍 [TRANSFORMER] Environmental keys:', Object.keys(envData))
  const environmental = parseSection(envData, 'environmental')
  console.log('🌍 [TRANSFORMER] Environmental domains:', environmental.domains.length)

  // Parse social section
  const socData = apiResponse?.social || {}
  console.log('👥 [TRANSFORMER] Social keys:', Object.keys(socData))
  const social = parseSection(socData, 'social')
  console.log('👥 [TRANSFORMER] Social domains:', social.domains.length)

  // Parse governance section
  const govData = apiResponse?.governance || {}
  console.log('🏢 [TRANSFORMER] Governance keys:', Object.keys(govData))
  const governance = parseSection(govData, 'governance')
  console.log('🏢 [TRANSFORMER] Governance domains:', governance.domains.length)

  const result: TransformedReportData = {
    meta: {
      reporting_period: meta.generated_at || 'سال ۱۴۰۵',
      reporting_year: meta.reporting_year || new Date().getFullYear(),
    },
    environmental,
    social,
    governance,
  }

  console.log('✅ [TRANSFORMER] Final Result:', result)

  return result
}

/**
 * Parse a section with nested domain objects
 * e.g., { climate: [...], ghg: [...], water: [...] }
 */
function parseSection(sectionData: any, sectionName: string): TransformedSection {
  const domains: TransformedDomain[] = []

  if (!sectionData || typeof sectionData !== 'object') {
    console.log(`⚠️ [PARSER] ${sectionName} is empty or invalid`)
    return {
      domains: [],
      summary: {
        avg_score: 0,
        completion: 0,
        answered: 0,
        total_kpis: 0,
      },
    }
  }

  let totalKpis = 0
  let answeredKpis = 0

  // Each key in sectionData is a domain
  Object.entries(sectionData).forEach(([domainKey, domainItems]: [string, any]) => {
    if (!Array.isArray(domainItems) || domainItems.length === 0) {
      console.log(`  ⏭️ [PARSER] Skipping ${domainKey} (not array or empty)`)
      return
    }

    console.log(`  📦 [PARSER] Processing ${domainKey} with ${domainItems.length} items`)

    const kpis: TransformedControl[] = domainItems.map((item: any, idx: number) => {
      const isAnswered = item.answer !== null && item.answer !== undefined

      if (isAnswered) answeredKpis++
      totalKpis++

      return {
        id: item.id || idx,
        slug: item.slug || `${domainKey}-${idx}`,
        title: item.title || item.summary || '',
        code: item.metric_code || item.kpi_code || '',
        description: item.description || '',
        value: item.answer,
        unit: item.answer_unit || '',
        status: item.answer_status || 'pending',
        summary: item.summary || '',
      }
    })

    // Calculate domain score (average of numeric answers)
    const numericValues = kpis
      .filter((k) => typeof k.value === 'number')
      .map((k) => k.value as number)
    const avgScore = numericValues.length > 0 ? Math.round(numericValues.reduce((a, b) => a + b, 0) / numericValues.length) : 0

    domains.push({
      id: domainItems[0]?.id || 0,
      slug: domainKey,
      title: capitalizeFirst(domainKey),
      description: '',
      code: `${sectionName.toUpperCase()}-${domainKey.toUpperCase()}`,
      order: domains.length,
      kpis,
      avg_score: avgScore,
    })
  })

  console.log(`✅ [PARSER] ${sectionName} parsed: ${domains.length} domains, ${totalKpis} KPIs`)

  const completion = totalKpis > 0 ? Math.round((answeredKpis / totalKpis) * 100) : 0
  const avgScore = domains.length > 0 ? Math.round(domains.reduce((sum, d) => sum + (d.avg_score || 0), 0) / domains.length) : 0

  return {
    domains,
    summary: {
      avg_score: avgScore,
      completion,
      answered: answeredKpis,
      total_kpis: totalKpis,
    },
  }
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
