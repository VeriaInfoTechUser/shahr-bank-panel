<script setup lang="ts">
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Lucide from '@/base-components/Lucide';
import type { Risk } from '../list/useRisk';

const props = defineProps<{
  riskTitle: string | Ref<string>;
  onBack?: () => void;
  onEdit?: () => void;
  risk: Ref<Risk | null> | null;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="flex items-center gap-2" dir="ltr">
    <button
      type="button"
      class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700"
      :aria-label="t('risk.back-to-list')"
      :title="t('risk.back-to-list')"
      @click="props.onBack?.()"
    >
      <Lucide icon="ArrowLeft" class="h-4 w-4 rtl:rotate-180" />
    </button>
    <button
      type="button"
      class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-primary bg-primary text-white shadow-sm transition hover:opacity-90"
      :aria-label="t('risk.action-edit')"
      :title="t('risk.action-edit')"
      @click="props.onEdit?.()"
    >
      <Lucide icon="Pencil" class="h-4 w-4" />
    </button>
  </div>
</template>
