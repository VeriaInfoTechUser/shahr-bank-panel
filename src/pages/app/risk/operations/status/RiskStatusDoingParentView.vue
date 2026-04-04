<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { riskModalTaskComplianceAssignerLabel } from '../riskStatusHelpers';

const props = defineProps<{
  row: Record<string, unknown>;
}>();

const { t } = useI18n();

const referrerDisplay = computed(() =>
  riskModalTaskComplianceAssignerLabel(props.row)
);
</script>

<template>
  <div class="mt-4 border-t border-slate-200 pt-3 dark:border-darkmode-600">
    <p
      class="mb-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300"
    >
      {{ t('risk-operations.doing-parent-body') }}
    </p>
    <div
      class="rounded-md border border-slate-200/90 bg-slate-50/80 px-2.5 py-2 dark:border-darkmode-600 dark:bg-darkmode-900/40"
    >
      <p
        class="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
      >
        {{ t('risk-operations.doing-parent-referrer-label') }}
      </p>
      <p
        class="text-xs font-medium text-slate-800 dark:text-slate-100"
      >
        {{ referrerDisplay }}
      </p>
    </div>
  </div>
</template>
