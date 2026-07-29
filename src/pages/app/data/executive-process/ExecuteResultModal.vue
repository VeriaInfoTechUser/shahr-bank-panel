<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import Button from '@/base-components/Button';

interface ResultItem {
  uuid7: string;
  date_from: string;
  date_to: string;
  value: number;
}

const props = defineProps<{
  show: boolean;
  data: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
}>();

const { t } = useI18n();

const indicatorTitle = computed(() => (props.data?.indicator_title as string) ?? '—');
const indicatorSlug = computed(() => (props.data?.indicator_slug as string) ?? '—');
const dataSourceTitle = computed(() => (props.data?.data_source_title as string) ?? '—');
const dataSourceSlug = computed(() => (props.data?.data_source_slug as string) ?? '—');
const formula = computed(() => (props.data?.formula as string) ?? '—');
const unit = computed(() => (props.data?.unit as string) ?? '');
const dateFrom = computed(() => {
  const v = props.data?.date_from;
  return v ? new Date(String(v)).toLocaleString('fa-IR') : '—';
});
const dateTo = computed(() => {
  const v = props.data?.date_to;
  return v ? new Date(String(v)).toLocaleString('fa-IR') : '—';
});
const calculatedValue = computed(() => {
  const v = props.data?.calculated_value;
  return v != null ? Number(v).toLocaleString() : '—';
});
const totalRawRecords = computed(() => props.data?.total_raw_records ?? 0);
const results = computed<ResultItem[]>(() => (props.data?.results as ResultItem[]) ?? []);

function close() {
  emit('update:show', false);
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
}

function formatDate(v: string) {
  return new Date(v).toLocaleString('fa-IR');
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="t('job.execute-result-title')"
    size="lg"
    @update:visible="onDialogVisible"
  >
    <div class="space-y-5">
      <!-- Summary Card -->
      <div class="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 dark:border-darkmode-600 dark:from-darkmode-700 dark:to-darkmode-800">
        <!-- Title Row -->
        <div class="mb-4 flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ indicatorTitle }}</h3>
            <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ dataSourceTitle }}</p>
          </div>
          <div class="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-center">
            <p class="text-lg font-bold leading-none text-white">{{ calculatedValue }}</p>
            <p v-if="unit" class="mt-0.5 text-[10px] font-medium text-white/80">{{ unit }}</p>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div class="rounded-lg bg-white p-2.5 dark:bg-darkmode-600">
            <p class="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{{ t('job.formula') }}</p>
            <p class="mt-0.5 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{{ formula }}</p>
          </div>
          <div class="rounded-lg bg-white p-2.5 dark:bg-darkmode-600">
            <p class="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{{ t('job.date-from') }}</p>
            <p class="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">{{ dateFrom }}</p>
          </div>
          <div class="rounded-lg bg-white p-2.5 dark:bg-darkmode-600">
            <p class="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{{ t('job.date-to') }}</p>
            <p class="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">{{ dateTo }}</p>
          </div>
          <div class="rounded-lg bg-white p-2.5 dark:bg-darkmode-600">
            <p class="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{{ t('job.indicator-slug') }}</p>
            <p class="mt-0.5 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{{ indicatorSlug }}</p>
          </div>
          <div class="rounded-lg bg-white p-2.5 dark:bg-darkmode-600">
            <p class="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{{ t('job.data-source-slug') }}</p>
            <p class="mt-0.5 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{{ dataSourceSlug }}</p>
          </div>
          <div class="rounded-lg bg-white p-2.5 dark:bg-darkmode-600">
            <p class="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{{ t('job.total-raw-records') }}</p>
            <p class="mt-0.5 text-xs font-bold text-primary">{{ totalRawRecords }}</p>
          </div>
        </div>
      </div>

      <!-- Results Table -->
      <div v-if="results.length" class="space-y-2">
        <h4 class="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          {{ t('job.results') }}
          <span class="ml-auto text-xs font-normal text-slate-400">({{ results.length }})</span>
        </h4>
        <div class="max-h-72 overflow-auto rounded-xl border border-slate-200 dark:border-darkmode-600">
          <table class="w-full text-xs">
            <thead class="sticky top-0 z-10 bg-slate-100 dark:bg-darkmode-600">
              <tr>
                <th class="px-3 py-2.5 text-center font-semibold text-slate-500 dark:text-slate-400">#</th>
                <th class="px-3 py-2.5 text-right font-semibold text-slate-500 dark:text-slate-400">{{ t('job.date-from') }}</th>
                <th class="px-3 py-2.5 text-right font-semibold text-slate-500 dark:text-slate-400">{{ t('job.date-to') }}</th>
                <th class="px-3 py-2.5 text-right font-semibold text-slate-500 dark:text-slate-400">{{ t('job.value') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-darkmode-600">
              <tr
                v-for="(item, idx) in results"
                :key="item.uuid7"
                class="transition hover:bg-primary/5 dark:hover:bg-primary/10"
              >
                <td class="px-3 py-2 text-center tabular-nums text-slate-400">{{ idx + 1 }}</td>
                <td class="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                  {{ formatDate(item.date_from) }}
                </td>
                <td class="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                  {{ formatDate(item.date_to) }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                  {{ item.value.toLocaleString() }}
                  <span v-if="unit" class="ml-0.5 text-slate-400">{{ unit }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button type="button" variant="primary" size="sm" @click="close">
          {{ t('general.close') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
