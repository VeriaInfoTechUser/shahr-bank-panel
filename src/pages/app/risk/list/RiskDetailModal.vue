<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useForm } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseConfirmModal from '@/core/ui/base/BaseConfirmModal.vue';
import BaseWarningModal from '@/core/ui/base/BaseWarningModal.vue';
import Button from '@/base-components/Button';
import { useGlobalModal } from '@/composables/useGlobalModal';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useRisk, type Risk, type RiskTask } from './useRisk';
import { useRiskCategories } from './useRiskCategories';
import { useRiskTransition } from './useRiskTransition';
import DraftForm from './forms/DraftForm.vue';
import RegisteredForm from './forms/RegisteredForm.vue';
import AnalysisForm from './forms/AnalysisForm.vue';
import ResponseForm from './forms/ResponseForm.vue';
import MonitoringForm from './forms/MonitoringForm.vue';

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
  deleteRisk,
} = useRisk();
const { categoryOptions, subCategoryOptions, getCategoryTitle, getSubCategoryTitle, fetchTree } = useRiskCategories();
const { parseTransitionErrors } = useRiskTransition();

const formKey = ref(0);
const saving = ref(false);
const registering = ref(false);
const transitioning = ref(false);
const savingTasks = ref(false);
const risk = ref<Risk | null>(null);
const currentStatus = ref<string>('');
const selectedCategorySlug = ref('');
const tasks = ref<RiskTask[]>([]);
const residualScore = ref<number | null>(null);
const residualLevel = ref<string | null>(null);
const memberOptions = ref<{ value: string; label: string }[]>([]);
const initialValues = ref<Record<string, unknown>>({});

const { values: formValues } = useForm();

const modalSize = computed(() => {
  if (currentStatus.value === 'draft' || currentStatus.value === 'registered') return 'md';
  return 'lg';
});

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

  await nextTick();
  populateForm(data);
  formKey.value += 1;
}

function populateForm(r: Risk) {
  initialValues.value = {
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

function handleRegister() {
  if (!risk.value) return;
  if (!formValues.draftDescription?.trim()) {
    openModal({
      component: BaseWarningModal,
      props: {
        title: t('risk.warning-title'),
        message: t('risk.warning-description-required', { description: t('risk.field-draft-description') }),
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
          const res = await transitionRisk(risk.value!.slug, 'registered', { draftDescription: formValues.draftDescription });
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
      component: BaseWarningModal,
      props: {
        title: t('risk.warning-title'),
        message: t('risk.warning-description-required', { description: t('risk.field-register-description') }),
      },
    });
    return;
  }
  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('risk.transition-confirm-title'),
      message: t('risk.transition-confirm-message', { status: t('risk.status-analysis') }),
      confirmVariant: 'primary' as const,
      onConfirmAction: async () => {
        registering.value = true;
        try {
          const res = await transitionRisk(risk.value!.slug, 'analysis', { registerDescription: formValues.registerDescription });
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

function onTasksUpdate(updated: RiskTask[]) {
  tasks.value = updated;
}

function onResidualScoreUpdate(score: number | null) {
  residualScore.value = score;
}

function onResidualLevelUpdate(level: string) {
  residualLevel.value = level;
}

function handleDelete() {
  if (!risk.value) return;
  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('risk.delete-confirm-title'),
      message: t('risk.delete-confirm-message'),
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        await deleteRisk(risk.value!.slug);
      },
    },
    onSuccess: () => {
      toast(t('risk.delete-success'), { type: 'success' });
      emit('success');
      close();
    },
  });
}

function handleTransition(to: string) {
  if (!risk.value) return;
  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('risk.transition-confirm-title'),
      message: t('risk.transition-confirm-message', { status: t(`risk.status-${to}`) }),
      confirmVariant: 'primary' as const,
      onConfirmAction: async () => {
        transitioning.value = true;
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
        } finally {
          transitioning.value = false;
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
</script>

<template>
  <BaseModal
    :visible="show"
    :title="risk?.title ?? t('risk.detail-title')"
    :size="modalSize"
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

      <DraftForm
        v-if="currentStatus === 'draft'"
        :form-key="formKey"
        :initial-values="initialValues"
        :category-options="categoryOptions"
        :sub-category-options="subCategoryOptions(selectedCategorySlug)"
        :member-options="memberOptions"
        :selected-category-slug="selectedCategorySlug"
        :saving="saving"
        :registering="registering"
        @submit="handleSave"
        @category-change="onCategoryChange"
        @register="handleRegister"
        @delete="handleDelete"
      />

      <RegisteredForm
        v-else-if="currentStatus === 'registered'"
        :form-key="formKey"
        :initial-values="initialValues"
        :category-options="categoryOptions"
        :sub-category-options="subCategoryOptions(selectedCategorySlug)"
        :member-options="memberOptions"
        :selected-category-slug="selectedCategorySlug"
        :saving="saving"
        :registering="registering"
        @submit="handleSave"
        @category-change="onCategoryChange"
        @start-analysis="handleStartAnalysis"
      />

      <AnalysisForm
        v-else-if="currentStatus === 'analysis'"
        :form-key="formKey"
        :initial-values="initialValues"
        :risk="risk"
        :category-options="categoryOptions"
        :sub-category-options="subCategoryOptions(selectedCategorySlug)"
        :member-options="memberOptions"
        :selected-category-slug="selectedCategorySlug"
        :saving="saving"
        :transitioning="transitioning"
        @submit="handleSave"
        @category-change="onCategoryChange"
        @transition="handleTransition"
      />

      <ResponseForm
        v-else-if="currentStatus === 'response'"
        :form-key="formKey"
        :initial-values="initialValues"
        :risk="risk"
        :category-options="categoryOptions"
        :sub-category-options="subCategoryOptions(selectedCategorySlug)"
        :member-options="memberOptions"
        :selected-category-slug="selectedCategorySlug"
        :tasks="tasks"
        :saving-tasks="savingTasks"
        :saving="saving"
        :transitioning="transitioning"
        @submit="handleSave"
        @update:tasks="onTasksUpdate"
        @transition="handleTransition"
      />

      <MonitoringForm
        v-else-if="currentStatus === 'monitoring'"
        :form-key="formKey"
        :initial-values="initialValues"
        :risk="risk"
        :category-options="categoryOptions"
        :sub-category-options="subCategoryOptions(selectedCategorySlug)"
        :member-options="memberOptions"
        :selected-category-slug="selectedCategorySlug"
        :tasks="tasks"
        :residual-score="residualScore"
        :residual-level="residualLevel"
        :saving="saving"
        :transitioning="transitioning"
        @submit="handleSave"
        @update:residual-score="onResidualScoreUpdate"
        @update:residual-level="onResidualLevelUpdate"
        @transition="handleTransition"
      />
    </div>
    <template #footer>
      <div class="flex justify-end">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          @click="close"
        >
          {{ t('general.close') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
