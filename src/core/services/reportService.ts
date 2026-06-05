import { ApiClient } from '../api/apiClient';

// ============================================================================
// Type Definitions
// ============================================================================

export interface MetaData {
  generated_at: string;
  reporting_year: number | string;
}

export interface KeyFigure {
  code: string;
  label: string;
  value: number;
  unit: string;
  change?: number; // Optional percentage change
  trend?: 'up' | 'down' | 'stable';
}

export interface ControlData {
  climate?: string | number;
  ghg?: string | number;
  energy?: string | number;
  water?: string | number;
  waste?: string | number;
}

export interface EnvironmentalSection {
  climate?: string | number;
  ghg?: string | number;
  energy?: string | number;
  water?: string | number;
  waste?: string | number;
}

export interface SocialSection {
  workforce?: string | number;
  dei?: string | number;
  health_safety?: string | number;
}

export interface GovernanceSection {
  board?: string | number;
  ethics?: string | number;
  compliance?: string | number;
}

export interface NarrativeSection {
  about_report?: string;
  environmental?: string;
  social?: string;
  governance?: string;
  report_conclusion?: string;
}

export interface ReportData {
  meta: MetaData;
  key_figures: KeyFigure[];
  environmental: EnvironmentalSection;
  social: SocialSection;
  governance: GovernanceSection;
  narratives: NarrativeSection;
}

export interface CachedReport {
  data: ReportData;
  timestamp: number;
}

// ============================================================================
// Cache Configuration
// ============================================================================

const CACHE_KEY = 'esg_report_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day in milliseconds

// ============================================================================
// Error Classes
// ============================================================================

export class ReportServiceError extends Error {
  constructor(
    public code: string,
    public message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ReportServiceError';
  }
}

// ============================================================================
// Report Service
// ============================================================================

class ReportService {
  private apiClient: ApiClient;
  private apiEndpoint = '/api/content/report';

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Fetch ESG report from API with caching support
   * @param forceRefresh - Skip cache and fetch fresh data
   * @returns Promise<ReportData>
   * @throws ReportServiceError on network or validation errors
   */
  async fetchReport(forceRefresh = false): Promise<ReportData> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedReport = this.getFromCache();
        if (cachedReport) {
          return cachedReport;
        }
      }

      // Fetch from API
      const response = await this.apiClient.post<ReportData>(this.apiEndpoint);

      // Validate response structure
      this.validateReportData(response);

      // Cache the successful response
      this.saveToCache(response);

      return response;
    } catch (error) {
      if (error instanceof ReportServiceError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof Error) {
        if (error.message.includes('Network') || error.message.includes('ECONNREFUSED')) {
          throw new ReportServiceError(
            'NETWORK_ERROR',
            'Failed to connect to report API. Please check your internet connection.',
            error
          );
        }

        // Try to return cached data on network error
        const cachedReport = this.getFromCache();
        if (cachedReport) {
          console.warn('Using cached report due to network error:', error.message);
          return cachedReport;
        }

        throw new ReportServiceError(
          'FETCH_ERROR',
          `Failed to fetch report: ${error.message}`,
          error
        );
      }

      throw new ReportServiceError(
        'UNKNOWN_ERROR',
        'An unknown error occurred while fetching the report',
        error
      );
    }
  }

  /**
   * Validate report data structure
   * @throws ReportServiceError if validation fails
   */
  private validateReportData(data: unknown): asserts data is ReportData {
    if (!data || typeof data !== 'object') {
      throw new ReportServiceError(
        'INVALID_FORMAT',
        'Report data is not a valid object'
      );
    }

    const report = data as Record<string, unknown>;

    // Validate required top-level fields
    if (!report.meta || typeof report.meta !== 'object') {
      throw new ReportServiceError(
        'MISSING_META',
        'Report is missing required "meta" field'
      );
    }

    // Validate meta structure
    const meta = report.meta as Record<string, unknown>;
    if (!meta.generated_at || !meta.reporting_year) {
      throw new ReportServiceError(
        'INVALID_META',
        'Meta data missing required fields: generated_at, reporting_year'
      );
    }

    // Validate key_figures
    if (!Array.isArray(report.key_figures)) {
      throw new ReportServiceError(
        'INVALID_KEY_FIGURES',
        'key_figures must be an array'
      );
    }

    // Validate main sections exist
    const requiredSections = ['environmental', 'social', 'governance', 'narratives'];
    for (const section of requiredSections) {
      if (!(section in report)) {
        throw new ReportServiceError(
          'MISSING_SECTION',
          `Report is missing required section: ${section}`
        );
      }
    }

    // Validate narratives structure
    if (typeof report.narratives !== 'object') {
      throw new ReportServiceError(
        'INVALID_NARRATIVES',
        'Narratives must be a valid object'
      );
    }
  }

  /**
   * Get report from localStorage cache
   * @returns Cached ReportData or null if expired/missing
   */
  private getFromCache(): ReportData | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        return null;
      }

      const cachedReport: CachedReport = JSON.parse(cached);
      const now = Date.now();
      const age = now - cachedReport.timestamp;

      // Check if cache has expired
      if (age > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return cachedReport.data;
    } catch (error) {
      // If cache is corrupted, remove it
      console.warn('Failed to parse cached report, clearing cache:', error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }

  /**
   * Save report to localStorage cache
   */
  private saveToCache(data: ReportData): void {
    try {
      const cachedReport: CachedReport = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachedReport));
    } catch (error) {
      // Storage quota exceeded or other localStorage error
      console.warn('Failed to cache report:', error);
    }
  }

  /**
   * Clear the cached report
   */
  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear report cache:', error);
    }
  }

  /**
   * Get cache age in milliseconds
   * @returns Cache age in ms, or -1 if no cache exists
   */
  getCacheAge(): number {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        return -1;
      }

      const cachedReport: CachedReport = JSON.parse(cached);
      return Date.now() - cachedReport.timestamp;
    } catch {
      return -1;
    }
  }

  /**
   * Check if cache exists and is valid
   */
  isCacheValid(): boolean {
    const age = this.getCacheAge();
    return age >= 0 && age < CACHE_TTL;
  }

  /**
   * Get cache TTL in milliseconds
   */
  getCacheTTL(): number {
    return CACHE_TTL;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const reportService = new ReportService();

export default reportService;
