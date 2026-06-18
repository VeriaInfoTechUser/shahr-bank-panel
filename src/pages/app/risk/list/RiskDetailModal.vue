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
const { categoryOptions, subCategoryOptions, getCategoryTitle, getSubCategoryTitle, fetchTree } = useRiskCategories();
const { getTransitions, getSectionsForStatus, isTransitionDisabled, parseTransitionErrors, calculateScore, calculateRiskLevel } = useRiskTransition();

const formKey = ref(0);
const saving = ref(false);
const registering = ref(false);
const savingTasks = ref(false);
const risk = ref<Risk | null>(null);
const currentStatus = ref<string>('');
const selectedCategorySlug = ref('');
const tasks = ref<RiskTask[]>([]);
const residualScore = ref<number | null>(null);
const residualLevel = ref<string | null>(null);
const memberOptions = ref<{ value: string; label: string }[]>([]);
const initialValues = ref<Record<string, unknown>>({});

const { setFieldValue, setFieldError, resetForm, validate, values: formValues } = useForm();

const sections = computed(() => getSectionsForStatus(currentStatus.value));
const transitions = computed(() => getTransitions(currentStatus.value));

const validationSchema = computed(() => yup.object({
  title: currentStatus.value === 'draft' || currentStatus.value === 'analysis' ? yup.string().trim().required(t('validation.required')) : yup.string().optional(),
  riskType: currentStatus.value === 'draft' || currentStatus.value === 'analysis' ? yup.string().trim().required(t('validation.required')) : yup.string().optional(),
  categorySlug: currentStatus.value === 'draft' || currentStatus.value === 'analysis' ? yup.string().trim().required(t('validation.required')) : yup.string().optional(),
  subCategorySlug: currentStatus.value === 'draft' || currentStatus.value === 'analysis' ? yup.string().trim().required(t('validation.required')) : yup.string().optional(),
  impact: currentStatus.value === 'analysis' ? yup.string().required(t('validation.required')) : yup.string().optional(),
  likelihood: currentStatus.value === 'analysis' ? yup.string().required(t('validation.required')) : yup.string().optional(),
  treatmentStrategy: currentStatus.value === 'response' ? yup.string().required(t('validation.required')) : yup.string().optional(),
}));

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
  currentStatus.value = data.state ?? 'draft';
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
    draftDescription: r.draftDescription ?? '',
    registerDescription: r.registerDescription ?? '',
    riskType: r.riskType ?? '',
    categorySlug: r.categorySlug ?? '',
    subCategorySlug: r.subCategorySlug ?? '',
    ownerId: r.ownerId ?? '',
    analysisDescription: r.analysisDescription ?? '',
    impactFactor: r.impactFactor ?? '',
    impact: r.impact ?? '',
    likelihood: r.likelihood ?? '',
    inherentScore: r.inherentScore != null ? String(r.inherentScore) : '',
    riskLevel: r.riskLevel ?? '',
    note: r.note ?? '',
    strategy: r.strategy ?? '',
    treatmentStrategy: r.treatmentStrategy ?? '',
    responseDescription: r.responseDescription ?? '',
    framework: r.framework?.[0] ?? '',
    control: r.control?.[0] ?? '',
    monitoringDescription: r.monitoringDescription ?? '',
    residualImpact: r.residualImpact ?? '',
    residualLikelihood: r.residualLikelihood ?? '',
  };
  initialValues.value = vals;
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

    if (status === 'draft' || status === 'registered' || status === 'analysis') {
      const catSlug = String(values.categorySlug ?? '');
      const subCatSlug = String(values.subCategorySlug ?? '');
      data = {
        title: values.title,
        draftDescription: values.draftDescription,
        registerDescription: values.registerDescription,
        riskType: values.riskType,
        categorySlug: catSlug,
        categoryTitle: getCategoryTitle(catSlug),
        subCategorySlug: subCatSlug,
        subCategoryTitle: getSubCategoryTitle(catSlug, subCatSlug),
        ownerId: values.ownerId,
      };
      if (status === 'analysis') {
        data.analysisDescription = values.analysisDescription || '';
        data.impactFactor = values.impactFactor ? Number(values.impactFactor) : null;
        data.impact = values.impact ? Number(values.impact) : null;
        data.likelihood = values.likelihood ? Number(values.likelihood) : null;
        data.inherentScore = values.inherentScore ? Number(values.inherentScore) : null;
        data.riskLevel = values.riskLevel || null;
        data.note = values.note || '';
      }
    } else if (status === 'response') {
      data = {
        strategy: values.strategy,
        treatmentStrategy: values.treatmentStrategy,
        responseDescription: values.responseDescription || '',
        framework: values.framework ? [values.framework] : [],
        control: values.control ? [values.control] : [],
      };
      if (tasks.value.length > 0) {
        await updateTasks(risk.value.slug, tasks.value);
      }
    } else if (status === 'monitoring') {
      data = {
        monitoringDescription: values.monitoringDescription || '',
        residualImpact: values.residualImpact ? Number(values.residualImpact) : null,
        residualLikelihood: values.residualLikelihood ? Number(values.residualLikelihood) : null,
        residualScore: residualScore.value,
        residualLevel: residualLevel.value,
      };
    } else {
      return;
    }

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

function handleTransition(to: string) {
  if (!risk.value) return;
  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('risk.transition-confirm-title'),
      message: t('risk.transition-confirm-message', { status: t(`risk.status-${to}`) }),
      confirmVariant: to === 'archived' ? 'danger' as const : 'primary' as const,
      onConfirmAction: async () => {
        try {
          const res = await transitionRisk(risk.value!.slug, to);
          if (!res) throw new Error(t('risk.transition-error'));
        } catch (err: unknown) {
          if (err instanceof Error) {
            const parsed = parseTransitionErrors([err.message]);
            if (parsed.length > 0 && parsed[0] !== err.message) {
              throw new Error(t(parsed[0]));
            }
          }
          throw err;
        }
      },
    },
    onSuccess: async () => {
      toast(t('risk.transition-success'), { type: 'success' });
      if (risk.value) await loadRisk(risk.value.slug);
      emit('success');
    },
  });
}

function handleRegister() {
  if (!risk.value) return;
  if (!formValues.draftDescription?.trim()) {
    openModal({
      component: BaseConfirmModal,
      props: {
        title: t('risk.warning-title'),
        message: t('risk.warning-description-required', { description: t('risk.field-draft-description') }),
        confirmVariant: 'primary' as const,
      },
    });
    return;
  }
  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('risk.transition-confirm-title'),
      message: t('risk.transition-confirm-message', { status: t('risk.status-registered') }),
      confirmVariant: 'primary' as const,
      onConfirmAction: async () => {
        registering.value = true;
        try {
          const res = await transitionRisk(risk.value!.slug, 'registered');
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
          registering.value = false;
        }
      },
    },
    onSuccess: async () => {
      toast(t('risk.transition-success'), { type: 'success' });
      if (risk.value) await loadRisk(risk.value.slug);
      emit('success');
    },
  });
}

async function handleStartAnalysis() {
  if (!risk.value) return;
  if (!formValues.registerDescription?.trim()) {
    openModal({
      component: BaseConfirmModal,
      props: {
        title: t('risk.warning-title'),
        message: t('risk.warning-description-required', { description: t('risk.field-register-description') }),
        confirmVariant: 'primary' as const,
      },
    });
    return;
  }
  const { valid } = await validate();
  if (!valid) return;
  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('risk.transition-confirm-title'),
      message: t('risk.transition-confirm-message', { status: t('risk.status-analysis') }),
      confirmVariant: 'primary' as const,
      onConfirmAction: async () => {
        registering.value = true;
        try {
          const res = await transitionRisk(risk.value!.slug, 'analysis');
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
          registering.value = false;
        }
      },
    },
    onSuccess: async () => {
      toast(t('risk.transition-success'), { type: 'success' });
      if (risk.value) await loadRisk(risk.value.slug);
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

const showRegisterDescription = computed(() =>
  ['registered', 'analysis', 'response', 'monitoring', 'closed', 'archived'].includes(currentStatus.value)
);

function isTransitionButtonDisabled(to: string, formValues: Record<string, unknown>): boolean {
  return isTransitionDisabled(to, formValues, tasks.value);
}

function getFormValues(): Record<string, unknown> {
  return {
    title: risk.value?.title ?? '',
    draftDescription: risk.value?.draftDescription ?? '',
    registerDescription: risk.value?.registerDescription ?? '',
    riskType: risk.value?.riskType ?? '',
    categorySlug: risk.value?.categorySlug ?? '',
    categoryTitle: risk.value?.categoryTitle ?? '',
    subCategorySlug: risk.value?.subCategorySlug ?? '',
    subCategoryTitle: risk.value?.subCategoryTitle ?? '',
    impactFactor: risk.value?.impactFactor ?? '',
    strategy: risk.value?.strategy ?? '',
    control: risk.value?.control?.[0] ?? '',
    monitoringDescription: risk.value?.monitoringDescription ?? '',
  };
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="risk?.title ?? t('risk.detail-title')"
    :size="currentStatus === 'draft' || currentStatus === 'registered' ? 'md' : 'lg'"
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
        :validation-schema="validationSchema"
        :initial-values="initialValues"
        class="space-y-3"
        @submit="handleSave"
      >
        <div v-if="currentStatus === 'draft' || currentStatus === 'registered'">
          <RegistrationSection
            mode="editable"
            :category-options="categoryOptions"
            :sub-category-options="subCategoryOptions(selectedCategorySlug)"
            :member-options="memberOptions"
            :show-draft-description="currentStatus === 'draft'"
            :show-register-description="currentStatus === 'registered'"
            @category-change="onCategoryChange"
          />
        </div>
        <template v-else>
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
              :show-draft-description="false"
              :show-register-description="showRegisterDescription"
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
              :impact-factor="risk.impactFactor"
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
        </template>
      </Form>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
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
          variant="secondary"
          size="sm"
          form="risk-detail-form"
          :disabled="saving"
        >
          {{ currentStatus === 'analysis' ? t('risk.action.save-analysis') : currentStatus === 'response' ? t('risk.action.save-response') : currentStatus === 'monitoring' ? t('risk.action.save-residual') : t('title.update') }}
        </Button>
        <Button
          v-if="currentStatus === 'draft'"
          type="button"
          variant="primary"
          size="sm"
          :disabled="saving || registering"
          @click="handleRegister"
        >
          {{ t('risk.action-register') }}
        </Button>
        <Button
          v-if="currentStatus === 'registered'"
          type="button"
          variant="primary"
          size="sm"
          :disabled="saving || registering"
          @click="handleStartAnalysis"
        >
          {{ t('risk.action-start-analysis') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
