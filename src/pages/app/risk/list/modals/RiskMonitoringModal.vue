<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseConfirmModal from '@/core/ui/base/BaseConfirmModal.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { useGlobalModal } from '@/composables/useGlobalModal';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useRisk, type Risk, type RiskTask } from '../useRisk';
import { useRiskCategories } from '../useRiskCategories';
import { useRiskTransition } from '../useRiskTransition';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';

const props = defineProps<{
  show: boolean;
  riskId: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const { openModal } = useGlobalModal();
const { loading: apiLoading, fetchRisk, updateRisk, transitionRisk } = useRisk();
const { categoryOptions, subCategoryOptions, fetchTree } = useRiskCategories();
const { calculateScore, calculateRiskLevel, parseTransitionErrors } = useRiskTransition();

const riskTypeOptions = computed(() => [
  { value: 'threat', label: t('risk.type-threat') },
  { value: 'opportunity', label: t('risk.type-opportunity') },
]);

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

const threatStrategyOptions = computed(() => [
  { value: 'reduce', label: t('risk.strategy-reduce') },
  { value: 'accept', label: t('risk.strategy-accept') },
  { value: 'transfer', label: t('risk.strategy-transfer') },
  { value: 'avoid', label: t('risk.strategy-avoid') },
]);

const opportunityStrategyOptions = computed(() => [
  { value: 'exploit', label: t('risk.strategy-exploit') },
  { value: 'share', label: t('risk.strategy-share') },
  { value: 'enhance', label: t('risk.strategy-enhance') },
]);

const strategyOptions = computed(() =>
  risk.value?.riskType === 'opportunity' ? opportunityStrategyOptions.value : threatStrategyOptions.value
);

const formKey = ref(0);
const saving = ref(false);
const transitioning = ref(false);
const risk = ref<Risk | null>(null);
const selectedCategorySlug = ref('');
const tasks = ref<RiskTask[]>([]);
const residualScore = ref<number | null>(null);
const residualLevel = ref<string | null>(null);
const memberOptions = ref<{ value: string; label: string }[]>([]);
const initialValues = ref<Record<string, unknown>>({});
const accordionOpen = ref({ registration: false, analysis: false, response: false, monitoring: true });
const formRef = ref<InstanceType<typeof Form>>();

const validationSchema = computed(() => yup.object({}));

const statusBadgeClass = computed(() => 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm bg-sky-100 text-sky-800 border border-sky-200');

const riskTypeBadgeClass = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm';
  const rt = risk.value?.riskType;
  if (rt === 'threat') return `${base} bg-red-50 text-red-700 border border-red-200`;
  if (rt === 'opportunity') return `${base} bg-green-50 text-green-700 border border-green-200`;
  return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
});

const scoreDisplay = computed(() => {
  const s = residualScore.value;
  return s != null ? String(s) : '—';
});

const levelLabel = computed(() => {
  const l = residualLevel.value;
  if (!l) return '—';
  return t(`risk.level-${l}`);
});

const levelBadgeClass = computed(() => {
  const l = residualLevel.value;
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm';
  switch (l) {
    case 'low': return `${base} bg-green-100 text-green-800 border border-green-200`;
    case 'medium': return `${base} bg-amber-100 text-amber-800 border border-amber-200`;
    case 'high': return `${base} bg-orange-100 text-orange-800 border border-orange-200`;
    case 'critical': return `${base} bg-red-100 text-red-800 border border-red-200`;
    default: return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
  }
});

const completedTasks = computed(() => tasks.value.filter((t) => t.state === 'done').length);
const totalTasks = computed(() => tasks.value.length);
const progressPercent = computed(() => {
  if (totalTasks.value === 0) return 0;
  return Math.round((completedTasks.value / totalTasks.value) * 100);
});

function mapMembers(list: Record<string, unknown>[]) {
  return list
    .map((m) => {
      const id = m.id ?? m.user_id;
      if (id == null) return null;
      const label =
        [m.name, m.full_name, m.email, m.mobile]
          .find((x) => typeof x === 'string' && String(x).trim()) ?? String(id);
      return { value: String(id), label: String(label).trim() };
    })
    .filter((x): x is { value: string; label: string } => x != null);
}

function toggleAccordion(section: 'registration' | 'analysis' | 'response' | 'monitoring') {
  accordionOpen.value[section] = !accordionOpen.value[section];
}

watch(
  () => [props.show, props.riskId],
  async ([show, id]) => {
    if (show && id) {
      await Promise.all([fetchTree(), loadMembers()]);
      await loadRisk(id);
    }
  },
  { immediate: true }
);

watch(
  () => initialValues.value,
  () => {
    const impact = initialValues.value.residualImpact ? Number(initialValues.value.residualImpact) : null;
    const likelihood = initialValues.value.residualLikelihood ? Number(initialValues.value.residualLikelihood) : null;
    residualScore.value = calculateScore(impact, likelihood);
    residualLevel.value = calculateRiskLevel(residualScore.value);
  },
  { deep: true }
);

async function loadMembers() {
  try {
    const res = await ermRepo.memberList({ page: 1, limit: 500 });
    const list = res?.data?.list ?? [];
    memberOptions.value = mapMembers(Array.isArray(list) ? list : []);
  } catch {
    memberOptions.value = [];
  }
}

async function loadRisk(id: string) {
  const data = await fetchRisk(id);
  if (!data) return;
  risk.value = data;
  selectedCategorySlug.value = data.categorySlug ?? '';
  tasks.value = data.tasks ?? [];
  residualScore.value = data.residualScore ?? null;
  residualLevel.value = data.residualLevel ?? null;

  await nextTick();
  populateForm(data);
  formKey.value += 1;
}

function populateForm(r: Risk) {
  initialValues.value = {
    monitoringDescription: r.monitoringDescription ?? '',
    residualImpact: r.residualImpact ?? '',
    residualLikelihood: r.residualLikelihood ?? '',
    impactFactor: r.impactFactor ?? '',
    likelihood: r.likelihood ?? '',
    vulnerability: r.vulnerability ?? '',
    threat: r.threat ?? '',
    strategy: r.strategy ?? '',
    treatmentStrategy: r.treatmentStrategy ?? '',
    responseDescription: r.responseDescription ?? '',
    framework: r.framework?.[0] ?? '',
    control: r.control?.[0] ?? '',
  };
}

function close() {
  emit('update:show', false);
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
}

async function handleSave(values: Record<string, unknown>) {
  if (!risk.value) return;
  saving.value = true;
  try {
    const data = {
      monitoringDescription: values.monitoringDescription || '',
      residualImpact: values.residualImpact ? Number(values.residualImpact) : null,
      residualLikelihood: values.residualLikelihood ? Number(values.residualLikelihood) : null,
      residualScore: residualScore.value,
      residualLevel: residualLevel.value,
    };

    await updateRisk(risk.value.slug, data);
    toast(t('risk.save-success'), { type: 'success' });
    await loadRisk(risk.value.slug);
    emit('success');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('risk.save-error');
    toast(message, { type: 'error' });
  } finally {
    saving.value = false;
  }
}

function handleCloseRisk() {
  if (!risk.value) return;
  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('risk.transition-confirm-title'),
      message: t('risk.transition-confirm-message', { status: t('risk.status-closed') }),
      confirmVariant: 'primary' as const,
      onConfirmAction: async () => {
        transitioning.value = true;
        try {
          const res = await transitionRisk(risk.value!.slug, 'closed');
          if (!res) throw new Error(t('risk.transition-error'));
        } catch (err: unknown) {
          if (err instanceof Error) {
            const parsed = parseTransitionErrors([err.message]);
            if (parsed.length > 0 && parsed[0] !== err.message) {
              throw new Error(t(parsed[0]));
            }
          }
          throw err;
        } finally {
          transitioning.value = false;
        }
      },
    },
    onSuccess: async () => {
      toast(t('risk.transition-success'), { type: 'success' });
      close();
      emit('success');
    },
  });
}


</script>

<template>
  <BaseModal
    :visible="show"
    :title="risk?.title ?? t('risk.detail-title')"
    size="lg"
    :closable="true"
    @update:visible="onDialogVisible"
  >
    <div v-if="apiLoading && !risk" class="flex items-center justify-center py-10">
      <span class="text-sm text-slate-500">{{ t('general.loading') }}</span>
    </div>
    <div v-else-if="risk" class="space-y-4">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-darkmode-600">
        <span :class="statusBadgeClass">{{ t('risk.status-monitoring') }}</span>
        <span :class="riskTypeBadgeClass">{{ t(`risk.type-${risk.riskType}`) }}</span>
        <span class="text-xs text-slate-400">{{ risk.createdAt }}</span>
      </div>

      <Form
        id="risk-monitoring-modal-form"
        ref="formRef"
        :key="formKey"
        :validation-schema="validationSchema"
        :initial-values="initialValues"
        class="space-y-3"
        @submit="handleSave"
      >
        <div class="rounded-lg border border-slate-200 dark:border-darkmode-600">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-darkmode-700"
            @click="toggleAccordion('registration')"
          >
            <span>{{ t('risk.section-registration') }}</span>
            <Lucide :icon="accordionOpen.registration ? 'ChevronUp' : 'ChevronDown'" class="!h-4 !w-4 text-slate-400" />
          </button>
          <div v-if="accordionOpen.registration" class="border-t border-slate-200 px-4 py-3 dark:border-darkmode-600">
            <div class="space-y-3">
              <BaseInput name="title" :label="t('risk.field-title')" :disabled="true" />
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
                <BaseSelect name="categorySlug" :label="t('risk.field-category')" :options="categoryOptions" :disabled="true" :filter="true" />
                <BaseSelect name="subCategorySlug" :label="t('risk.field-sub-category')" :options="subCategoryOptions(selectedCategorySlug)" :disabled="true" :filter="true" />
                <BaseSelect name="ownerId" :label="t('risk.field-owner')" :options="memberOptions" :disabled="true" :filter="true" />
                <BaseSelect name="riskType" :label="t('risk.field-risk-type')" :options="riskTypeOptions" :disabled="true" />
              </div>
              <BaseInput name="registerDescription" :label="t('risk.field-register-description')" type="textarea" :rows="3" :disabled="true" />
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 dark:border-darkmode-600">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-darkmode-700"
            @click="toggleAccordion('analysis')"
          >
            <span>{{ t('risk.section-analysis') }}</span>
            <Lucide :icon="accordionOpen.analysis ? 'ChevronUp' : 'ChevronDown'" class="!h-4 !w-4 text-slate-400" />
          </button>
          <div v-if="accordionOpen.analysis" class="border-t border-slate-200 px-4 py-3 dark:border-darkmode-600">
            <div class="space-y-3">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
                <BaseSelect name="impactFactor" :label="t('risk.field-impact-factor')" :options="impactOptions" :disabled="true" />
                <BaseSelect name="likelihood" :label="t('risk.field-likelihood')" :options="likelihoodOptions" :disabled="true" />
              </div>
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
                <BaseInput name="vulnerability" :label="t('risk.field-vulnerability')" :disabled="true" />
                <BaseInput name="threat" :label="t('risk.field-threat')" :disabled="true" />
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 dark:border-darkmode-600">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-darkmode-700"
            @click="toggleAccordion('response')"
          >
            <span>{{ t('risk.section-response') }}</span>
            <Lucide :icon="accordionOpen.response ? 'ChevronUp' : 'ChevronDown'" class="!h-4 !w-4 text-slate-400" />
          </button>
          <div v-if="accordionOpen.response" class="border-t border-slate-200 px-4 py-3 dark:border-darkmode-600">
            <div class="space-y-3">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
                <BaseSelect name="strategy" :label="t('risk.field-treatment-strategy')" :options="strategyOptions" :disabled="true" />
                <BaseInput name="framework" :label="t('risk.field-framework')" :disabled="true" />
                <BaseInput name="control" :label="t('risk.field-control')" :disabled="true" />
              </div>
              <BaseInput name="responseDescription" :label="t('risk.field-response-description')" type="textarea" :rows="3" :disabled="true" />
              <div v-if="tasks.length > 0" class="space-y-2">
                <label class="label min-h-0 py-1">
                  <span class="label-text text-sm font-normal leading-snug">{{ t('risk.field-tasks') }}</span>
                </label>
                <div class="space-y-1">
                  <div
                    v-for="(task, index) in tasks"
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
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 dark:border-darkmode-600">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-darkmode-700"
            @click="toggleAccordion('monitoring')"
          >
            <span>{{ t('risk.section-monitoring') }}</span>
            <Lucide :icon="accordionOpen.monitoring ? 'ChevronUp' : 'ChevronDown'" class="!h-4 !w-4 text-slate-400" />
          </button>
          <div v-if="accordionOpen.monitoring" class="border-t border-slate-200 px-4 py-3 dark:border-darkmode-600">
            <div class="space-y-3">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
                <BaseSelect name="residualImpact" :label="t('risk.field-residual-impact')" :options="impactOptions" />
                <BaseSelect name="residualLikelihood" :label="t('risk.field-residual-likelihood')" :options="likelihoodOptions" />
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
                    <span v-if="residualLevel" :class="levelBadgeClass">{{ levelLabel }}</span>
                    <span v-else class="text-xs text-slate-400">—</span>
                  </div>
                </div>
              </div>
              <BaseInput name="monitoringDescription" :label="t('risk.field-monitoring-description')" type="textarea" :rows="3" :placeholder="t('risk.field-monitoring-description-placeholder')" />
              <div v-if="tasks.length > 0" class="space-y-2">
                <label class="label min-h-0 py-1">
                  <span class="label-text text-sm font-normal leading-snug">{{ t('risk.field-tasks') }}</span>
                </label>
                <div class="space-y-1">
                  <div
                    v-for="(task, index) in tasks"
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
                    <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${progressPercent}%` }" />
                  </div>
                  <span class="text-xs text-slate-500">
                    {{ completedTasks }} / {{ totalTasks }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          type="submit"
          variant="outline-secondary"
          size="sm"
          form="risk-monitoring-modal-form"
          :disabled="saving"
        >
          {{ t('title.update') }}
        </Button>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          @click="close"
        >
          {{ t('general.close') }}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          :disabled="saving || transitioning"
          @click="handleCloseRisk"
        >
          {{ t('risk.action-close-risk') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
