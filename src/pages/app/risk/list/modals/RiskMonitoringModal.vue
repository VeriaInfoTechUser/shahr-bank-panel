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
import RegistrationSection from '../sections/RegistrationSection.vue';
import AnalysisSection from '../sections/AnalysisSection.vue';
import ResponseSection from '../sections/ResponseSection.vue';
import MonitoringSection from '../sections/MonitoringSection.vue';

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
const { parseTransitionErrors } = useRiskTransition();

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

function onResidualScoreUpdate(score: number | null) {
  residualScore.value = score;
}

function onResidualLevelUpdate(level: string) {
  residualLevel.value = level;
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

function submitForm() {
  formRef.value?.submit();
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
            <RegistrationSection
              mode="readonly"
              :category-options="categoryOptions"
              :sub-category-options="subCategoryOptions(selectedCategorySlug)"
              :member-options="memberOptions"
              :show-draft-description="false"
              :show-register-description="true"
            />
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
            <AnalysisSection
              mode="readonly"
              :risk-type="risk.riskType as string"
              :impact-factor="risk.impactFactor as number | null"
              :impact="risk.impact as number | null"
              :likelihood="risk.likelihood as number | null"
              :inherent-score="risk.inherentScore as number | null"
              :risk-level="risk.riskLevel as string | null"
            />
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
            <ResponseSection
              mode="readonly"
              :risk-type="risk.riskType as string"
              :tasks="tasks"
              :saving-tasks="false"
            />
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
            <MonitoringSection
              mode="editable"
              :residual-impact="risk.residualImpact as number | null"
              :residual-likelihood="risk.residualLikelihood as number | null"
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
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          :disabled="saving"
          @click="submitForm"
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
