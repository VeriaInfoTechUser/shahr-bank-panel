import { ref, watch } from 'vue';

export interface UseTableSearchOptions {
  /** Debounce delay in ms before calling onSearch */
  debounceMs?: number;
  initialValue?: string;
  /** Called with search value after debounce (e.g. emit('search', value)) */
  onSearch?: (value: string) => void;
}

export interface UseTableSearchReturn {
  /** Bind to search input (v-model:search). When this changes, onSearch is called after debounce. */
  search: ReturnType<typeof ref<string>>;
}

/**
 * Composable for table search with debounce.
 * When `search` ref changes, `onSearch` is invoked after debounceMs (default 400).
 * Use in BaseTable: pass onSearch: (v) => emit('search', v), then bind search to input.
 */
export function useTableSearch(
  options: UseTableSearchOptions = {}
): UseTableSearchReturn {
  const { debounceMs = 400, initialValue = '', onSearch } = options;

  const search = ref(initialValue);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  if (onSearch) {
    watch(search, (value) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        onSearch(value);
        debounceTimer = null;
      }, debounceMs);
    });
  }

  return { search };
}
