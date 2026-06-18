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
import { useRisk, type Risk } from '../useRisk';
import { useRiskCategories } from '../useRiskCategories';
import { useRiskTransition } from '../useRiskTransition';
import RegistrationSection from '../sections/RegistrationSection.vue';
import AnalysisSection from '../sections/AnalysisSection.vue';

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
const { categoryOptions, subCategoryOptions, getCategoryTitle, getSubCategoryTitle, fetchTree } = useRiskCategories();
const { parseTransitionErrors } = useRiskTransition();

const formKey = ref(0);
const saving = ref(false);
const transitioning = ref(false);
const risk = ref<Risk | null>(null);
const selectedCategorySlug = ref('');
const memberOptions = ref<{ value: string; label: string }[]>([]);
const initialValues = ref<Record<string, unknown>>({});
const accordionOpen = ref({ registration: true, analysis: true });
const formRef = ref<InstanceType<typeof Form>>();

const validationSchema = computed(() => yup.object({
  title: yup.string().trim().required(t('validation.required')),
  riskType: yup.string().trim().required(t('validation.required')),
  categorySlug: yup.string().trim().required(t('validation.required')),
  subCategorySlug: yup.string().trim().required(t('validation.required')),
  impact: yup.string().required(t('validation.required')),
  likelihood: yup.string().required(t('validation.required')),
}));

const statusBadgeClass = computed(() => 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm bg-violet-100 text-violet-800 border border-violet-200');

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

function toggleAccordion(section: 'registration' | 'analysis') {
  accordionOpen.value[section] = !accordionOpen.value[section];
}

function onScoreUpdate(score: number | null) {
  formRef.value?.setFieldValue('inherentScore', score != null ? String(score) : '');
}

function onLevelUpdate(level: string) {
  formRef.value?.setFieldValue('riskLevel', level);
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

  await nextTick();
  populateForm(data);
  formKey.value += 1;
}

function populateForm(r: Risk) {
  initialValues.value = {
    title: r.title ?? '',
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
  };
}

function close() {
  emit('update:show', false);
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
}

function onCategoryChange(value: unknown) {
  selectedCategorySlug.value = String(value ?? '');
}

async function handleSave(values: Record<string, unknown>) {
  if (!risk.value) return;
  saving.value = true;
  try {
    const catSlug = String(values.categorySlug ?? '');
    const subCatSlug = String(values.subCategorySlug ?? '');
    const data = {
      title: values.title,
      riskType: values.riskType,
      categorySlug: catSlug,
      categoryTitle: getCategoryTitle(catSlug),
      subCategorySlug: subCatSlug,
      subCategoryTitle: getSubCategoryTitle(catSlug, subCatSlug),
      ownerId: values.ownerId,
      analysisDescription: values.analysisDescription || '',
      impactFactor: values.impactFactor ? Number(values.impactFactor) : null,
      impact: values.impact ? Number(values.impact) : null,
      likelihood: values.likelihood ? Number(values.likelihood) : null,
      inherentScore: values.inherentScore ? Number(values.inherentScore) : null,
      riskLevel: values.riskLevel || null,
      note: values.note || '',
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

function handleTransitionToResponse() {
  if (!risk.value) return;
  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('risk.transition-confirm-title'),
      message: t('risk.transition-confirm-message', { status: t('risk.status-response') }),
      confirmVariant: 'primary' as const,
      onConfirmAction: async () => {
        transitioning.value = true;
        try {
          const res = await transitionRisk(risk.value!.slug, 'response');
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
        <span :class="statusBadgeClass">{{ t('risk.status-analysis') }}</span>
        <span :class="riskTypeBadgeClass">{{ t(`risk.type-${risk.riskType}`) }}</span>
        <span class="text-xs text-slate-400">{{ risk.createdAt }}</span>
      </div>

      <Form
        id="risk-analysis-modal-form"
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
              @category-change="onCategoryChange"
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
              mode="editable"
              :risk-type="risk.riskType as string"
              :impact-factor="risk.impactFactor as number | null"
              :impact="risk.impact as number | null"
              :likelihood="risk.likelihood as number | null"
              :inherent-score="risk.inherentScore as number | null"
              :risk-level="risk.riskLevel as string | null"
              @update:score="onScoreUpdate"
              @update:level="onLevelUpdate"
            />
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
          form="risk-analysis-modal-form"
          :disabled="saving"
        >
          {{ t('risk.action.save-analysis') }}
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
          @click="handleTransitionToResponse"
        >
          {{ t('risk.action-send-response') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
