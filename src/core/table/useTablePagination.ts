import { ref, type Ref } from 'vue';

export interface UseTablePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  initialTotal?: number;
}

export interface UseTablePaginationReturn {
  page: Ref<number>;
  limit: Ref<number>;
  total: Ref<number>;
  setPage: (p: number) => void;
  setLimit: (l: number) => void;
  setTotal: (t: number) => void;
  /** Reset to first page and optional new limit */
  reset: (newLimit?: number) => void;
}

/**
 * Composable for server-side table pagination state.
 * Emits no events; parent binds these refs to BaseTable and listens to @update:page / @update:limit.
 */
export function useTablePagination(
  options: UseTablePaginationOptions = {}
): UseTablePaginationReturn {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialTotal = 0,
  } = options;

  const page = ref(initialPage);
  const limit = ref(initialLimit);
  const total = ref(initialTotal);

  function setPage(p: number) {
    page.value = Math.max(1, p);
  }

  function setLimit(l: number) {
    limit.value = Math.max(1, l);
  }

  function setTotal(t: number) {
    total.value = Math.max(0, t);
  }

  function reset(newLimit?: number) {
    page.value = 1;
    if (newLimit !== undefined) limit.value = newLimit;
  }

  return {
    page,
    limit,
    total,
    setPage,
    setLimit,
    setTotal,
    reset,
  };
}
