<script setup lang="ts">
import { computed } from 'vue';
import type { DashboardSection, TableRow } from '../../types';
import { formatValueWithUnit, resolveText, statusClasses, statusFromValue } from '../../dashboardUtils';

const props = defineProps<{
  section: DashboardSection;
  translate?: (key: string) => string;
}>();

const rows = computed(() => (props.section.rows ?? []) as TableRow[]);
const columns = computed(() => {
  if (props.section.columns?.length) return props.section.columns;
  const firstRow = rows.value[0];
  return firstRow && !Array.isArray(firstRow) ? Object.keys(firstRow) : [];
});

function cellValue(row: TableRow, column: string, index: number) {
  if (Array.isArray(row)) return row[index];
  return row[column];
}
</script>

<template>
  <section class="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
    <h2 class="text-base font-semibold text-slate-900 dark:text-slate-50">
      {{ resolveText(section.title, translate) }}
    </h2>

    <div class="mt-4 overflow-x-auto">
      <table class="min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column"
              class="border-b border-slate-200 bg-slate-50 px-4 py-3 text-start font-semibold text-slate-600 first:rounded-s-lg last:rounded-e-lg dark:border-darkmode-600 dark:bg-darkmode-700 dark:text-slate-300"
            >
              {{ resolveText(column, translate) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in rows" :key="rowIndex" class="group">
            <td
              v-for="column in columns"
              :key="column"
              class="border-b border-slate-100 px-4 py-3 text-slate-700 group-hover:bg-slate-50 dark:border-darkmode-700 dark:text-slate-300 dark:group-hover:bg-darkmode-700/50"
            >
              <span
                v-if="column.toLowerCase().includes('status') || column.toLowerCase().includes('severity')"
                class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
                :class="statusClasses(statusFromValue(null, String(cellValue(row, column, columns.indexOf(column)) ?? '').toLowerCase()))"
              >
                {{ resolveText(String(cellValue(row, column, columns.indexOf(column)) ?? '-'), translate) }}
              </span>
              <span v-else>
                {{ typeof cellValue(row, column, columns.indexOf(column)) === 'number'
                  ? formatValueWithUnit(cellValue(row, column, columns.indexOf(column)))
                  : resolveText(String(cellValue(row, column, columns.indexOf(column)) ?? '-'), translate) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="!rows.length" class="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        داده‌ای برای نمایش وجود ندارد.
      </p>
    </div>
  </section>
</template>
