import { computed, inject, onUnmounted, type Component, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteRecordNormalized } from 'vue-router';

export interface BreadcrumbSlotContent {
  component: Component;
  props?: Record<string, unknown>;
}

/**
 * Use from a page to render content at the end of the breadcrumb row (e.g. toolbar).
 * Call setContent(component, props) in onMounted and clear() in onUnmounted.
 */
export function useBreadcrumbSlot() {
  const breadcrumbExtraRef = inject<Ref<BreadcrumbSlotContent | null> | null>('breadcrumbExtra', null);

  function setContent(component: Component, props?: Record<string, unknown>) {
    if (breadcrumbExtraRef) {
      breadcrumbExtraRef.value = { component, props };
    } else {
      if (import.meta.env.DEV) {
        console.warn('[breadcrumb] Missing provider: call useBreadcrumbSlot() inside SideMenu layout context.');
      }
    }
  }

  function clear() {
    if (breadcrumbExtraRef) breadcrumbExtraRef.value = null;
  }

  onUnmounted(clear);

  return { setContent, clear };
}

export interface BreadcrumbItem {
  path: string;
  labelKey: string;
  isLast: boolean;
}

/** لینک‌های اضافه‌شده قبل از همین سگمنت نان (مثلاً «عملیات تطبیق» قبل از «تکلیف در حال اجرا») */
export type BreadcrumbPrefixItem = {
  routeName: string;
  labelKey: string;
};

/**
 * Returns breadcrumb items for the current route.
 * Uses route.matched and meta.breadcrumbLabel (i18n key) for each segment.
 * اگر `meta.breadcrumbPrefix` روی یک رکورد باشد، آن آیتم‌ها بلافاصله قبل از همان سگمنت درج می‌شوند.
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

    const out: BreadcrumbItem[] = [];

    matched.forEach((record) => {
      const prefix = record.meta?.breadcrumbPrefix as
        | BreadcrumbPrefixItem[]
        | undefined;
      if (Array.isArray(prefix)) {
        for (const p of prefix) {
          if (p?.routeName && p?.labelKey) {
            out.push({
              path: router.resolve({ name: p.routeName }).path,
              labelKey: p.labelKey,
              isLast: false,
            });
          }
        }
      }

      const labelKey =
        (record.meta?.breadcrumbLabel as string) ||
        (record.name as string)?.replace(/-/g, ' ') ||
        '';
      const path =
        record.name != null
          ? router.resolve({ name: record.name }).path
          : route.path;
      out.push({
        path,
        labelKey,
        isLast: false,
      });
    });

    if (out.length > 0) {
      const last = out[out.length - 1];
      out[out.length - 1] = { ...last, isLast: true };
    }
    return out;
  });

  return { items };
}
