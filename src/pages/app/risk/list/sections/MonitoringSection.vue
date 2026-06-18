<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useForm } from 'vee-validate';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import { useRiskTransition } from '../useRiskTransition';
import type { RiskTask } from '../useRisk';

const props = defineProps<{
  mode: 'editable' | 'readonly';
  residualImpact: number | null;
  residualLikelihood: number | null;
  residualScore: number | null;
  residualLevel: string | null;
  tasks: RiskTask[];
}>();

const emit = defineEmits<{
  (e: 'update:residualScore', score: number | null): void;
  (e: 'update:residualLevel', level: string): void;
}>();

const { t } = useI18n();
const { calculateScore, calculateRiskLevel } = useRiskTransition();

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
  const s = props.residualScore;
  return s != null ? String(s) : '—';
});

const levelLabel = computed(() => {
  const l = props.residualLevel;
  if (!l) return '—';
  return t(`risk.level-${l}`);
});

const levelBadgeClass = computed(() => {
  const l = props.residualLevel;
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm';
  switch (l) {
    case 'low': return `${base} bg-green-100 text-green-800 border border-green-200`;
    case 'medium': return `${base} bg-amber-100 text-amber-800 border border-amber-200`;
    case 'high': return `${base} bg-orange-100 text-orange-800 border border-orange-200`;
    case 'critical': return `${base} bg-red-100 text-red-800 border border-red-200`;
    default: return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
  }
});

const completedTasks = computed(() => props.tasks.filter((t) => t.state === 'done').length);
const totalTasks = computed(() => props.tasks.length);
const progressPercent = computed(() => {
  if (totalTasks.value === 0) return 0;
  return Math.round((completedTasks.value / totalTasks.value) * 100);
});

watch(
  () => [props.residualImpact, props.residualLikelihood],
  ([impact, likelihood]) => {
    const score = calculateScore(impact as number | null, likelihood as number | null);
    const level = calculateRiskLevel(score);
    emit('update:residualScore', score);
    emit('update:residualLevel', level);
  },
  { immediate: true }
);
</script>

<template>
  <div class="space-y-3">
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
      <BaseSelect
        name="residualImpact"
        :label="t('risk.field-residual-impact')"
        :options="impactOptions"
        :disabled="disabled"
      />
      <BaseSelect
        name="residualLikelihood"
        :label="t('risk.field-residual-likelihood')"
        :options="likelihoodOptions"
        :disabled="disabled"
      />
    </div>
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
      <div class="form-control w-full">
        <label class="label min-h-0 py-1">
          <span class="label-text text-sm font-normal leading-snug">{{ t('risk.field-residual-score') }}</span>
        </label>
        <div class="flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-200">
          {{ scoreDisplay }}
        </div>
      </div>
      <div class="form-control w-full">
        <label class="label min-h-0 py-1">
          <span class="label-text text-sm font-normal leading-snug">{{ t('risk.field-residual-level') }}</span>
        </label>
        <div class="flex h-8 items-center">
          <span v-if="props.residualLevel" :class="levelBadgeClass">{{ levelLabel }}</span>
          <span v-else class="text-xs text-slate-400">—</span>
        </div>
      </div>
    </div>

    <BaseInput
      name="monitoringDescription"
      :label="t('risk.field-monitoring-description')"
      type="textarea"
      :rows="3"
      :disabled="disabled"
      :placeholder="t('risk.field-monitoring-description-placeholder')"
    />

    <div v-if="props.tasks.length > 0" class="space-y-2">
      <label class="label min-h-0 py-1">
        <span class="label-text text-sm font-normal leading-snug">{{ t('risk.field-tasks') }}</span>
      </label>
      <div class="space-y-1">
        <div
          v-for="(task, index) in props.tasks"
          :key="index"
          class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-darkmode-600 dark:bg-darkmode-800"
        >
          <span class="flex-1 text-slate-700 dark:text-slate-200">{{ task.title }}</span>
          <span
            class="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[9px] font-semibold leading-snug shadow-sm"
            :class="{
              'bg-orange-100 text-orange-800 border border-orange-200': task.state === 'open',
              'bg-violet-100 text-violet-800 border border-violet-200': task.state === 'in_progress',
              'bg-sky-100 text-sky-800 border border-sky-200': task.state === 'done',
            }"
          >
            {{ t(`task.status.${task.state}`) }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex-1 h-2 rounded-full bg-slate-200 dark:bg-darkmode-600">
          <div
            class="h-full rounded-full bg-primary transition-all"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
        <span class="text-xs text-slate-500">
          {{ completedTasks }} / {{ totalTasks }}
        </span>
      </div>
    </div>
  </div>
</template>
