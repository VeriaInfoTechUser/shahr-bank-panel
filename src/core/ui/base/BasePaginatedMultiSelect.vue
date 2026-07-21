<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useField } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import { watchDebounced } from '@vueuse/core';
import Lucide from '@/base-components/Lucide';

interface FetchResult {
  list: { value: unknown; label: string }[];
  count: number;
}

const props = withDefaults(
  defineProps<{
    name: string;
    label?: string;
    fetchFn: (params: { page: number; limit: number; search?: string }) => Promise<FetchResult>;
    limit?: number;
    search?: boolean;
    searchPlaceholder?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    compactLabel?: boolean;
  }>(),
  {
    limit: 25,
    search: false,
    required: false,
    disabled: false,
    compactLabel: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
  (e: 'change', value: unknown): void;
}>();

const { t } = useI18n();
const { value, errorMessage, handleBlur, handleChange } = useField<string[]>(props.name);

// ── State ───────────────────────────────────────────────────────────────────
const isOpen = ref(false);
const loading = ref(false);
const options = ref<{ value: unknown; label: string }[]>([]);
const page = ref(1);
const totalCount = ref(0);
const searchText = ref('');

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / props.limit)));
const hasPrev = computed(() => page.value > 1);
const hasNext = computed(() => page.value < totalPages.value);

const selectedItems = computed(() => {
  const selected = value.value ?? [];
  return options.value.filter(o => selected.includes(String(o.value)));
});

const selectedCount = computed(() => (value.value ?? []).length);

const displayLabels = computed(() => {
  if (selectedItems.value.length <= 2) {
    return selectedItems.value.map(o => o.label);
  }
  return [selectedItems.value[0].label, `+${selectedItems.value.length - 1}`];
});

const resolvedSearchPlaceholder = computed(() =>
  props.searchPlaceholder ?? t('general.select-filter-placeholder')
);

// ── Fetch ───────────────────────────────────────────────────────────────────
async function loadPage(p: number) {
  loading.value = true;
  try {
    const params: { page: number; limit: number; title?: string } = { page: p, limit: props.limit };
    if (props.search && searchText.value.trim()) {
      params.title = searchText.value.trim();
    }
    const res = await props.fetchFn(params);
    options.value = res.list ?? [];
    totalCount.value = res.count ?? 0;
    page.value = p;
  } catch {
    options.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
}

function goNext() {
  if (hasNext.value) loadPage(page.value + 1);
}

function goPrev() {
  if (hasPrev.value) loadPage(page.value - 1);
}

function toggleItem(val: unknown) {
  const strVal = String(val);
  const current = [...(value.value ?? [])];
  const idx = current.indexOf(strVal);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(strVal);
  }
  handleChange(current);
  emit('update:modelValue', current);
  emit('change', current);
}

function isSelected(val: unknown): boolean {
  return (value.value ?? []).includes(String(val));
}

function clearAll() {
  handleChange([]);
  emit('update:modelValue', []);
  emit('change', []);
}

function removeItem(val: unknown, e: MouseEvent) {
  e.stopPropagation();
  const strVal = String(val);
  const current = (value.value ?? []).filter(v => v !== strVal);
  handleChange(current);
  emit('update:modelValue', current);
  emit('change', current);
}

// ── Search debounce ─────────────────────────────────────────────────────────
watchDebounced(
  () => searchText.value,
  () => {
    if (isOpen.value) loadPage(1);
  },
  { debounce: 400 }
);

// ── Position ────────────────────────────────────────────────────────────────
const triggerRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const posStyle = ref<Record<string, string>>({});

function calcPosition() {
  if (!triggerRef.value) return;
  const r = triggerRef.value.getBoundingClientRect();
  posStyle.value = {
    position: 'fixed',
    zIndex: '9999',
    left: `${r.left}px`,
    top: `${r.bottom + 2}px`,
    width: `${r.width}px`,
  };
}

function toggle() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchText.value = '';
    loadPage(1);
    nextTick(() => {
      calcPosition();
      const el = searchInputRef.value;
      if (el) {
        el.focus({ preventScroll: true });
      }
    });
  }
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node;
  if (panelRef.value?.contains(target) || triggerRef.value?.contains(target)) {
    return;
  }
  isOpen.value = false;
}

function onPanelMouseDown(e: MouseEvent) {
  e.stopPropagation();
}

function onScroll() {
  if (isOpen.value) calcPosition();
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside);
  window.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', onScroll);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside);
  window.removeEventListener('scroll', onScroll, true);
  window.removeEventListener('resize', onScroll);
});

const labelTextClass = computed(() =>
  props.compactLabel ? 'text-[0.6125rem]' : 'text-sm'
);
</script>

<template>
  <div class="form-control w-full">
    <label v-if="label" class="label min-h-0 py-1">
      <span :class="['label-text', labelTextClass, 'font-normal leading-snug']">
        {{ label }} <span v-if="required" class="text-error">*</span>
      </span>
    </label>

    <div class="relative">
      <!-- Trigger -->
      <button
        ref="triggerRef"
        type="button"
        class="select select-bordered flex w-full items-center !min-h-0 !px-2 !py-1 text-xs font-light leading-snug"
        :class="[
          { 'select-error': errorMessage, 'opacity-50 cursor-not-allowed': disabled },
          selectedCount ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
        ]"
        @click="toggle"
        @blur="handleBlur"
      >
        <span v-if="selectedCount" class="flex flex-wrap items-center gap-1 min-w-0 flex-1">
          <span
            v-for="item in displayLabels"
            :key="item"
            class="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary max-w-[120px]"
          >
            <span class="truncate">{{ item }}</span>
            <button
              v-if="!item.startsWith('+')"
              type="button"
              class="inline-flex h-3 w-3 items-center justify-center rounded-full hover:bg-primary/20"
              @click.stop="removeItem(options.find(o => o.label === item)?.value, $event)"
            >
              <Lucide icon="X" class="h-2 w-2" />
            </button>
          </span>
        </span>
        <span v-else class="min-w-0 flex-1 truncate text-start">
          {{ placeholder || t('general.select') }}
        </span>
        <Lucide
          icon="ChevronDown"
          class="h-4 w-4 shrink-0 text-slate-400 transition-transform ms-1"
          :class="isOpen ? 'rotate-180' : ''"
        />
      </button>

      <!-- Panel (Teleported to body) -->
      <Teleport to="body">
        <div
          v-if="isOpen"
          ref="panelRef"
          :style="posStyle"
          class="base-paginated-select-panel overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-darkmode-600 dark:bg-darkmode-800"
          @mousedown="onPanelMouseDown"
        >
          <!-- Search input -->
          <div v-if="search" class="border-b border-slate-100 px-3 py-2 dark:border-darkmode-600">
            <div class="relative">
              <Lucide icon="Search" class="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                ref="searchInputRef"
                v-model="searchText"
                type="text"
                class="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pe-2.5 ps-8 text-xs text-slate-700 placeholder-slate-400 outline-none transition-colors focus:border-primary focus:bg-white dark:border-darkmode-600 dark:bg-darkmode-700 dark:text-slate-200 dark:placeholder-slate-500"
                :placeholder="resolvedSearchPlaceholder"
              />
            </div>
          </div>

          <!-- Selected count & clear -->
          <div v-if="selectedCount" class="flex items-center justify-between border-b border-slate-100 px-3 py-1.5 dark:border-darkmode-600">
            <span class="text-[11px] text-slate-500">{{ selectedCount }} {{ t('general.selected') }}</span>
            <button
              type="button"
              class="text-[11px] text-primary hover:underline"
              @mousedown.prevent="clearAll"
            >
              {{ t('general.clear') }}
            </button>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center" style="min-height: 12rem;">
            <span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
          </div>

          <!-- Options -->
          <div v-else-if="options.length" class="max-h-[16rem] overflow-y-auto overscroll-contain">
            <button
              v-for="opt in options"
              :key="String(opt.value)"
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-start text-xs transition-colors hover:bg-slate-50 dark:hover:bg-darkmode-700"
              :class="isSelected(opt.value) ? 'bg-primary/10 font-medium text-primary' : 'text-slate-700 dark:text-slate-200'"
              @mousedown.prevent="toggleItem(opt.value)"
            >
              <span class="flex h-4 w-4 items-center justify-center rounded border" :class="isSelected(opt.value) ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-600'">
                <Lucide v-if="isSelected(opt.value)" icon="Check" class="h-3 w-3 text-white" />
              </span>
              <span class="min-w-0 truncate">{{ opt.label }}</span>
            </button>
          </div>

          <!-- Empty -->
          <div v-else class="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            {{ t('general.no-data') }}
          </div>

          <!-- Pagination -->
          <div
            v-if="totalCount > limit"
            class="flex items-center justify-between border-t border-slate-100 px-3 py-1.5 dark:border-darkmode-600"
          >
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors"
              :class="hasPrev ? 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-darkmode-700' : 'cursor-not-allowed text-slate-300 dark:text-darkmode-500'"
              :disabled="!hasPrev"
              @mousedown.prevent="goPrev"
            >
              <Lucide icon="ChevronRight" class="h-3 w-3" />
              {{ t('general.previous') }}
            </button>
            <span class="text-[11px] text-slate-400 dark:text-slate-500">
              {{ page }} / {{ totalPages }}
            </span>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors"
              :class="hasNext ? 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-darkmode-700' : 'cursor-not-allowed text-slate-300 dark:text-darkmode-500'"
              :disabled="!hasNext"
              @mousedown.prevent="goNext"
            >
              {{ t('general.next') }}
              <Lucide icon="ChevronLeft" class="h-3 w-3" />
            </button>
          </div>
        </div>
      </Teleport>
    </div>

    <label v-if="errorMessage" class="label min-h-0 py-0 pt-0.5">
      <span class="label-text-alt text-error text-xs">{{ errorMessage }}</span>
    </label>
  </div>
</template>
