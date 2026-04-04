import { defineStore } from 'pinia';

const STORAGE_KEY = 'risk-doing-task-nav';

type DoingNavState = {
  taskId: number | null;
  progressId: number | null;
  navSectionLabel: string | null;
  navDomainLabel: string | null;
  navAssignerLabel: string | null;
};

function parsePositiveInt(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function loadPersisted(): DoingNavState | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Record<string, unknown>;
    return {
      taskId: parsePositiveInt(o.taskId),
      progressId: parsePositiveInt(o.progressId),
      navSectionLabel:
        typeof o.navSectionLabel === 'string' ? o.navSectionLabel : null,
      navDomainLabel:
        typeof o.navDomainLabel === 'string' ? o.navDomainLabel : null,
      navAssignerLabel:
        typeof o.navAssignerLabel === 'string' ? o.navAssignerLabel : null,
    };
  } catch {
    return null;
  }
}

function persistState(s: DoingNavState) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota */
  }
}

function clearStorage() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * شناسهٔ تسک و شناسهٔ رکورد ریسک (progress) برای صفحهٔ «ریسک در حال اجرا» بدون قرار دادن در URL.
 */
export const useRiskDoingTaskNavigationStore = defineStore(
  'riskDoingTaskNavigation',
  {
    state: (): DoingNavState => {
      const saved = loadPersisted();
      if (saved) {
        return {
          taskId: saved.taskId,
          progressId: saved.progressId,
          navSectionLabel: saved.navSectionLabel,
          navDomainLabel: saved.navDomainLabel,
          navAssignerLabel: saved.navAssignerLabel,
        };
      }
      return {
        taskId: null,
        progressId: null,
        navSectionLabel: null,
        navDomainLabel: null,
        navAssignerLabel: null,
      };
    },
    actions: {
      setDoingContext(
        taskId: number,
        progressId: number | null,
        options?: {
          sectionLabel?: string | null;
          domainLabel?: string | null;
          assignerLabel?: string | null;
        }
      ) {
        this.taskId = taskId;
        this.progressId = progressId;
        this.navSectionLabel = options?.sectionLabel ?? null;
        this.navDomainLabel = options?.domainLabel ?? null;
        this.navAssignerLabel = options?.assignerLabel ?? null;
        persistState({
          taskId: this.taskId,
          progressId: this.progressId,
          navSectionLabel: this.navSectionLabel,
          navDomainLabel: this.navDomainLabel,
          navAssignerLabel: this.navAssignerLabel,
        });
      },
      clearDoingContext() {
        this.taskId = null;
        this.progressId = null;
        this.navSectionLabel = null;
        this.navDomainLabel = null;
        this.navAssignerLabel = null;
        clearStorage();
      },
    },
  }
);
