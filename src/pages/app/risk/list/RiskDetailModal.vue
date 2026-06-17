<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import { Form, useForm } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseConfirmModal from '@/core/ui/base/BaseConfirmModal.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { useGlobalModal } from '@/composables/useGlobalModal';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useRisk, type Risk, type RiskTask } from './useRisk';
import { useRiskCategories } from './useRiskCategories';
import { useRiskTransition, type RiskState } from './useRiskTransition';
import RegistrationSection from './sections/RegistrationSection.vue';
import AnalysisSection from './sections/AnalysisSection.vue';
import ResponseSection from './sections/ResponseSection.vue';
import MonitoringSection from './sections/MonitoringSection.vue';

const props = defineProps<{
  show: boolean;
  riskId: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const { openModal } = useGlobalModal();
const {
  loading: apiLoading,
  fetchRisk,
  updateRisk,
  transitionRisk,
  updateTasks,
} = useRisk();
const { categoryOptions, subCategoryOptions, fetchTree } = useRiskCategories();
const { getTransitions, getSectionsForStatus, calculateScore, calculateRiskLevel } = useRiskTransition();

const formKey = ref(0);
const saving = ref(false);
const savingTasks = ref(false);
const risk = ref<Risk | null>(null);
const currentStatus = ref<string>('');
const selectedCategorySlug = ref('');
const tasks = ref<RiskTask[]>([]);
const residualScore = ref<number | null>(null);
const residualLevel = ref<string | null>(null);
const memberOptions = ref<{ value: string; label: string }[]>([]);

const { setFieldValue, resetForm } = useForm();

const sections = computed(() => getSectionsForStatus(currentStatus.value));
const transitions = computed(() => getTransitions(currentStatus.value));

const statusBadgeClass = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm';
  switch (currentStatus.value) {
    case 'draft': return `${base} bg-slate-100 text-slate-700 border border-slate-200`;
    case 'registered': return `${base} bg-blue-100 text-blue-800 border border-blue-200`;
    case 'analysis': return `${base} bg-violet-100 text-violet-800 border border-violet-200`;
    case 'response': return `${base} bg-orange-100 text-orange-800 border border-orange-200`;
    case 'monitoring': return `${base} bg-sky-100 text-sky-800 border border-sky-200`;
    case 'closed': return `${base} bg-emerald-100 text-emerald-800 border border-emerald-200`;
    case 'archived': return `${base} bg-stone-100 text-stone-700 border border-stone-200`;
    default: return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
  }
});

const riskTypeBadgeClass = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm';
  const rt = risk.value?.riskType;
  if (rt === 'threat') return `${base} bg-red-50 text-red-700 border border-red-200`;
  if (rt === 'opportunity') return `${base} bg-green-50 text-green-700 border border-green-200`;
  return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
});

const accordionOpen = ref({
  registration: false,
  analysis: false,
  response: false,
  monitoring: false,
  tasks: false,
});

const isReadonlySection = (section: string) => sections.value[section as keyof typeof sections.value] === 'readonly';
const isVisibleSection = (section: string) => sections.value[section as keyof typeof sections.value] !== 'hidden';
const isEditableSection = (section: string) => sections.value[section as keyof typeof sections.value] === 'editable';

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
  currentStatus.value = data.status ?? 'draft';
  selectedCategorySlug.value = data.categorySlug ?? '';
  tasks.value = data.tasks ?? [];
  residualScore.value = data.residualScore ?? null;
  residualLevel.value = data.residualLevel ?? null;

  accordionOpen.value = {
    registration: currentStatus.value === 'draft' || currentStatus.value === 'analysis',
    analysis: currentStatus.value === 'analysis',
    response: currentStatus.value === 'response',
    monitoring: currentStatus.value === 'monitoring',
    tasks: currentStatus.value === 'response' || currentStatus.value === 'monitoring',
  };

  await nextTick();
  populateForm(data);
  formKey.value += 1;
}

function populateForm(r: Risk) {
  const vals: Record<string, unknown> = {
    title: r.title ?? '',
    draft_description: r.draft_description ?? '',
    riskType: r.riskType ?? '',
    categorySlug: r.categorySlug ?? '',
    subCategorySlug: r.subCategorySlug ?? '',
    owner: r.owner ?? '',
    analysis_description: r.analysis_description ?? '',
    impact: r.impact ?? '',
    likelihood: r.likelihood ?? '',
    inherentScore: r.inherentScore != null ? String(r.inherentScore) : '',
    riskLevel: r.riskLevel ?? '',
    note: r.note ?? '',
    treatmentStrategy: r.treatmentStrategy ?? '',
    response_description: r.response_description ?? '',
    framework: r.framework?.[0] ?? '',
    control: r.control?.[0] ?? '',
    monitoring_description: r.monitoring_description ?? '',
    residualImpact: r.residualImpact ?? '',
    residualLikelihood: r.residualLikelihood ?? '',
  };
  resetForm({ values: vals });
}

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
  if (!v) emit('close');
}

function onCategoryChange(value: unknown) {
  selectedCategorySlug.value = String(value ?? '');
  setFieldValue('subCategorySlug', '');
}

function toggleAccordion(section: string) {
  accordionOpen.value[section as keyof typeof accordionOpen.value] =
    !accordionOpen.value[section as keyof typeof accordionOpen.value];
}

async function handleSave(values: Record<string, unknown>) {
  if (!risk.value) return;
  saving.value = true;
  try {
    const status = currentStatus.value;
    let data: Record<string, unknown>;

    if (status === 'draft' || status === 'analysis') {
      data = {
        title: values.title,
        draft_description: values.draft_description,
        riskType: values.riskType,
        categorySlug: values.categorySlug,
        subCategorySlug: values.subCategorySlug,
        owner: values.owner,
      };
      if (status === 'analysis') {
        data.analysis_description = values.analysis_description || '';
        data.impact = values.impact ? Number(values.impact) : null;
        data.likelihood = values.likelihood ? Number(values.likelihood) : null;
        data.inherentScore = values.inherentScore ? Number(values.inherentScore) : null;
        data.riskLevel = values.riskLevel || null;
        data.note = values.note || '';
      }
    } else if (status === 'response') {
      data = {
        treatmentStrategy: values.treatmentStrategy,
        response_description: values.response_description || '',
        framework: values.framework ? [values.framework] : [],
        control: values.control ? [values.control] : [],
      };
      if (tasks.value.length > 0) {
        await updateTasks(risk.value.id, tasks.value);
      }
    } else if (status === 'monitoring') {
      data = {
        monitoring_description: values.monitoring_description || '',
        residualImpact: values.residualImpact ? Number(values.residualImpact) : null,
        residualLikelihood: values.residualLikelihood ? Number(values.residualLikelihood) : null,
        residualScore: residualScore.value,
        residualLevel: residualLevel.value,
      };
    } else {
      return;
    }

    await updateRisk(risk.value.id, data);
    toast(t('risk.save-success'), { type: 'success' });
    await loadRisk(risk.value.id);
    emit('success');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('risk.save-error');
    toast(message, { type: 'error' });
  } finally {
    saving.value = false;
  }
}

function handleTransition(to: string) {
  if (!risk.value) return;
  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('risk.transition-confirm-title'),
      message: t('risk.transition-confirm-message', { status: t(`risk.status-${to}`) }),
      confirmVariant: to === 'archived' ? 'danger' as const : 'primary' as const,
      onConfirmAction: async () => {
        const res = await transitionRisk(risk.value!.slug, to);
        if (!res) throw new Error(t('risk.transition-error'));
      },
    },
    onSuccess: async () => {
      toast(t('risk.transition-success'), { type: 'success' });
      if (risk.value) await loadRisk(risk.value.id);
      emit('success');
    },
  });
}

function onAnalysisScoreUpdate(score: number | null) {
  setFieldValue('inherentScore', score != null ? String(score) : '');
}

function onAnalysisLevelUpdate(level: string) {
  setFieldValue('riskLevel', level);
}

function onResidualScoreUpdate(score: number | null) {
  residualScore.value = score;
}

function onResidualLevelUpdate(level: string) {
  residualLevel.value = level;
}

function onTasksUpdate(updated: RiskTask[]) {
  tasks.value = updated;
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
        <span :class="statusBadgeClass">{{ t(`risk.status-${currentStatus}`) }}</span>
        <span :class="riskTypeBadgeClass">{{ t(`risk.type-${risk.riskType}`) }}</span>
        <span class="text-xs text-slate-400">{{ risk.createdAt }}</span>
      </div>

      <Form
        :key="formKey"
        id="risk-detail-form"
        :validation-schema="yup.object({
          title: currentStatus === 'draft' || currentStatus === 'analysis' ? yup.string().trim().required(t('validation.required')) : yup.string().optional(),
          riskType: currentStatus === 'draft' || currentStatus === 'analysis' ? yup.string().trim().required(t('validation.required')) : yup.string().optional(),
          categorySlug: currentStatus === 'draft' || currentStatus === 'analysis' ? yup.string().trim().required(t('validation.required')) : yup.string().optional(),
          subCategorySlug: currentStatus === 'draft' || currentStatus === 'analysis' ? yup.string().trim().required(t('validation.required')) : yup.string().optional(),
          impact: currentStatus === 'analysis' ? yup.string().required(t('validation.required')) : yup.string().optional(),
          likelihood: currentStatus === 'analysis' ? yup.string().required(t('validation.required')) : yup.string().optional(),
          treatmentStrategy: currentStatus === 'response' ? yup.string().required(t('validation.required')) : yup.string().optional(),
        })"
        class="space-y-3"
        @submit="handleSave"
      >
        <div v-if="isVisibleSection('registration')" class="rounded-lg border border-slate-200 dark:border-darkmode-600">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-darkmode-700"
            @click="toggleAccordion('registration')"
          >
            <span>{{ t('risk.section-registration') }}</span>
            <Lucide :icon="accordionOpen.registration ? 'ChevronUp' : 'ChevronDown'" class="!h-4 !w-4 text-slate-400" />
          </button>
          <div v-if="accordionOpen.registration" class="border-t border-slate-200 px-4 py-3 dark:border-darkmode-600">
            <RegistrationSection
              :mode="isEditableSection('registration') ? 'editable' : 'readonly'"
              :category-options="categoryOptions"
              :sub-category-options="subCategoryOptions(selectedCategorySlug)"
              :member-options="memberOptions"
              @category-change="onCategoryChange"
            />
          </div>
        </div>

        <div v-if="isVisibleSection('analysis')" class="rounded-lg border border-slate-200 dark:border-darkmode-600">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-darkmode-700"
            @click="toggleAccordion('analysis')"
          >
            <span>{{ t('risk.section-analysis') }}</span>
            <Lucide :icon="accordionOpen.analysis ? 'ChevronUp' : 'ChevronDown'" class="!h-4 !w-4 text-slate-400" />
          </button>
          <div v-if="accordionOpen.analysis" class="border-t border-slate-200 px-4 py-3 dark:border-darkmode-600">
            <AnalysisSection
              :mode="isEditableSection('analysis') ? 'editable' : 'readonly'"
              :risk-type="risk.riskType"
              :impact="risk.impact"
              :likelihood="risk.likelihood"
              :inherent-score="risk.inherentScore"
              :risk-level="risk.riskLevel"
              @update:score="onAnalysisScoreUpdate"
              @update:level="onAnalysisLevelUpdate"
            />
          </div>
        </div>

        <div v-if="isVisibleSection('response')" class="rounded-lg border border-slate-200 dark:border-darkmode-600">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-darkmode-700"
            @click="toggleAccordion('response')"
          >
            <span>{{ t('risk.section-response') }}</span>
            <Lucide :icon="accordionOpen.response ? 'ChevronUp' : 'ChevronDown'" class="!h-4 !w-4 text-slate-400" />
          </button>
          <div v-if="accordionOpen.response" class="border-t border-slate-200 px-4 py-3 dark:border-darkmode-600">
            <ResponseSection
              :mode="isEditableSection('response') ? 'editable' : 'readonly'"
              :risk-type="risk.riskType"
              :tasks="tasks"
              :saving-tasks="savingTasks"
              @update:tasks="onTasksUpdate"
            />
          </div>
        </div>

        <div v-if="isVisibleSection('monitoring')" class="rounded-lg border border-slate-200 dark:border-darkmode-600">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-darkmode-700"
            @click="toggleAccordion('monitoring')"
          >
            <span>{{ t('risk.section-monitoring') }}</span>
            <Lucide :icon="accordionOpen.monitoring ? 'ChevronUp' : 'ChevronDown'" class="!h-4 !w-4 text-slate-400" />
          </button>
          <div v-if="accordionOpen.monitoring" class="border-t border-slate-200 px-4 py-3 dark:border-darkmode-600">
            <MonitoringSection
              :mode="isEditableSection('monitoring') ? 'editable' : 'readonly'"
              :residual-impact="risk.residualImpact"
              :residual-likelihood="risk.residualLikelihood"
              :residual-score="residualScore"
              :residual-level="residualLevel"
              :tasks="tasks"
              @update:residual-score="onResidualScoreUpdate"
              @update:residual-level="onResidualLevelUpdate"
            />
          </div>
        </div>
      </Form>
    </div>
    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="tr in transitions"
            :key="tr.to"
            type="button"
            :variant="tr.variant"
            size="sm"
            :disabled="saving"
            @click="handleTransition(tr.to)"
          >
            {{ t(tr.labelKey) }}
          </Button>
        </div>
        <div class="flex gap-2">
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            @click="close"
          >
            {{ t('general.cancel') }}
          </Button>
          <Button
            v-if="isEditableSection('registration') || isEditableSection('analysis') || isEditableSection('response') || isEditableSection('monitoring')"
            type="submit"
            variant="primary"
            size="sm"
            form="risk-detail-form"
            :disabled="saving"
          >
            {{ currentStatus === 'analysis' ? t('risk.action.save-analysis') : currentStatus === 'response' ? t('risk.action.save-response') : currentStatus === 'monitoring' ? t('risk.action.save-residual') : t('title.update') }}
          </Button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>
