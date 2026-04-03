import { defineStore } from 'pinia';

/**
 * شناسهٔ تسک و شناسهٔ progress برای صفحهٔ «تکلیف در حال اجرا» بدون قرار دادن در URL.
 * قبل از `router.push` مقداردهی شود؛ صفحهٔ مقصد از همین استور می‌خواند.
 */
export const useComplianceDoingTaskNavigationStore = defineStore(
  'complianceDoingTaskNavigation',
  {
    state: () => ({
      taskId: null as number | null,
      progressId: null as number | null,
      /** بخش از لیست عملیات وقتی در مدل progress/detail نیست */
      navSectionLabel: null as string | null,
      /** حوزه/استاندارد از لیست عملیات */
      navDomainLabel: null as string | null,
    }),
    actions: {
      setDoingContext(
        taskId: number,
        progressId: number | null,
        options?: { sectionLabel?: string | null; domainLabel?: string | null }
      ) {
        this.taskId = taskId;
        this.progressId = progressId;
        this.navSectionLabel = options?.sectionLabel ?? null;
        this.navDomainLabel = options?.domainLabel ?? null;
      },
      clearDoingContext() {
        this.taskId = null;
        this.progressId = null;
        this.navSectionLabel = null;
        this.navDomainLabel = null;
      },
    },
  }
);
