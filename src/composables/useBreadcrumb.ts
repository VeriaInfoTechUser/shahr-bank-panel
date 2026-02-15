import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteRecordNormalized } from 'vue-router';

export interface BreadcrumbItem {
  path: string;
  labelKey: string;
  isLast: boolean;
}

/**
 * Returns breadcrumb items for the current route.
 * Uses route.matched and meta.breadcrumbLabel (i18n key) for each segment.
 */
export function useBreadcrumb() {
  const route = useRoute();
  const router = useRouter();

  const items = computed<BreadcrumbItem[]>(() => {
    const matched = route.matched.filter(
      (r): r is RouteRecordNormalized & { name: string } =>
        r.name != null && r.meta?.breadcrumb !== false
    );
    if (matched.length === 0) return [];

    return matched.map((record, index) => {
      const labelKey =
        (record.meta?.breadcrumbLabel as string) ||
        (record.name as string)?.replace(/-/g, ' ') ||
        '';
      const path =
        record.name != null
          ? router.resolve({ name: record.name }).path
          : route.path;
      return {
        path,
        labelKey,
        isLast: index === matched.length - 1,
      };
    });
  });

  return { items };
}
