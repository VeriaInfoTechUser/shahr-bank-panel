<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useForm } from 'vee-validate';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import { useRiskTransition } from '../useRiskTransition';

const props = defineProps<{
  mode: 'editable' | 'readonly';
  riskType: string;
  impactFactor: number | null;
  impact: number | null;
  likelihood: number | null;
  inherentScore: number | null;
  riskLevel: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:score', score: number | null): void;
  (e: 'update:level', level: string): void;
}>();

const { t } = useI18n();
const { calculateScore, calculateRiskLevel } = useRiskTransition();
const { setFieldValue } = useForm();

const disabled = computed(() => props.mode === 'readonly');

const impactOptions = computed(() => [
  { value: 1, label: `1 - ${t('risk.impact-1')}` },
  { value: 2, label: `2 - ${t('risk.impact-2')}` },
  { value: 3, label: `3 - ${t('risk.impact-3')}` },
  { value: 4, label: `4 - ${t('risk.impact-4')}` },
  { value: 5, label: `5 - ${t('risk.impact-5')}` },
]);

const likelihoodOptions = computed(() => [
  { value: 1, label: `1 - ${t('risk.likelihood-1')}` },
  { value: 2, label: `2 - ${t('risk.likelihood-2')}` },
  { value: 3, label: `3 - ${t('risk.likelihood-3')}` },
  { value: 4, label: `4 - ${t('risk.likelihood-4')}` },
  { value: 5, label: `5 - ${t('risk.likelihood-5')}` },
]);

const scoreDisplay = computed(() => {
  const s = props.inherentScore;
  return s != null ? String(s) : '—';
});

const levelLabel = computed(() => {
  const l = props.riskLevel;
  if (!l) return '—';
  return t(`risk.level-${l}`);
});

const levelBadgeClass = computed(() => {
  const l = props.riskLevel;
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm';
  switch (l) {
    case 'low': return `${base} bg-green-100 text-green-800 border border-green-200`;
    case 'medium': return `${base} bg-amber-100 text-amber-800 border border-amber-200`;
    case 'high': return `${base} bg-orange-100 text-orange-800 border border-orange-200`;
    case 'critical': return `${base} bg-red-100 text-red-800 border border-red-200`;
    default: return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
  }
});

watch(
  () => [props.impact, props.likelihood],
  ([impact, likelihood]) => {
    const score = calculateScore(impact as number | null, likelihood as number | null);
    const level = calculateRiskLevel(score);
    emit('update:score', score);
    emit('update:level', level);
    setFieldValue('inherentScore', score != null ? String(score) : '');
    setFieldValue('riskLevel', level);
  },
  { immediate: true }
);
</script>

<template>
  <div class="space-y-3">
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
      <BaseSelect
        name="impactFactor"
        :label="t('risk.field-impact-factor')"
        :options="impactOptions"
        :required="true"
        :disabled="disabled"
      />
      <BaseSelect
        name="likelihood"
        :label="t('risk.field-likelihood')"
        :options="likelihoodOptions"
        :required="true"
        :disabled="disabled"
      />
    </div>
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
      <div class="form-control w-full">
        <label class="label min-h-0 py-1">
          <span class="label-text text-sm font-normal leading-snug">{{ t('risk.field-inherent-score') }}</span>
        </label>
        <div class="flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-200">
          {{ scoreDisplay }}
        </div>
      </div>
      <div class="form-control w-full">
        <label class="label min-h-0 py-1">
          <span class="label-text text-sm font-normal leading-snug">{{ t('risk.field-risk-level') }}</span>
        </label>
        <div class="flex h-8 items-center">
          <span v-if="props.riskLevel" :class="levelBadgeClass">{{ levelLabel }}</span>
          <span v-else class="text-xs text-slate-400">—</span>
        </div>
      </div>
    </div>
    <BaseInput
      name="analysis_description"
      :label="t('risk.field-analysis-description')"
      type="textarea"
      :rows="3"
      :disabled="disabled"
      :placeholder="t('risk.field-analysis-description-placeholder')"
    />
    <BaseInput
      name="note"
      :label="t('risk.field-note')"
      type="textarea"
      :rows="3"
      :disabled="disabled"
      :placeholder="t('risk.field-note-placeholder')"
    />
  </div>
</template>
