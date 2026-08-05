<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { Form, useForm } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseConfirmModal from '@/core/ui/base/BaseConfirmModal.vue';
import Button from '@/base-components/Button';
import { useGlobalModal } from '@/composables/useGlobalModal';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useRisk, type Risk } from '../useRisk';
import { useRiskCategories } from '../useRiskCategories';
import { useCapabilityTree } from '../useCapabilityTree';
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
const { categoryOptions, subCategoryOptions, getCategoryTitle, getSubCategoryTitle, fetchTree } = useRiskCategories();
const { capitalOptions, domainOptions, componentOptions, capabilityOptions, getTitle: getCapabilityTitle, fetchTree: fetchCapabilityTree } = useCapabilityTree();
const { calculateScore, calculateRiskLevel, parseTransitionErrors } = useRiskTransition();

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

const riskTypeOptions = computed(() => [
  { value: 'threat', label: t('risk.type-threat') },
  { value: 'opportunity', label: t('risk.type-opportunity') },
]);

const formKey = ref(0);
const saving = ref(false);
const transitioning = ref(false);
const risk = ref<Risk | null>(null);
const selectedCategorySlug = ref('');
const selectedCapitalSlug = ref('');
const selectedDomainSlug = ref('');
const selectedComponentSlug = ref('');
const memberOptions = ref<{ value: string; label: string }[]>([]);
const initialValues = ref<Record<string, unknown>>({});
const formRef = ref<InstanceType<typeof Form>>();
const { setFieldValue } = useForm();

const validationSchema = computed(() => yup.object({
  title: yup.string().trim().required(t('validation.required')),
  riskType: yup.string().trim().required(t('validation.required')),
  categorySlug: yup.string().trim().required(t('validation.required')),
  categoryTitle: yup.string().trim().required(t('validation.required')),
  subCategorySlug: yup.string().trim().required(t('validation.required')),
  subCategoryTitle: yup.string().trim().required(t('validation.required')),
  capitalSlug: yup.string().trim().required(t('validation.required')),
  capitalTitle: yup.string().trim().required(t('validation.required')),
  domainSlug: yup.string().trim().required(t('validation.required')),
  domainTitle: yup.string().trim().required(t('validation.required')),
  componentSlug: yup.string().trim().required(t('validation.required')),
  componentTitle: yup.string().trim().required(t('validation.required')),
  capabilitySlug: yup.string().trim().required(t('validation.required')),
  capabilityTitle: yup.string().trim().required(t('validation.required')),
  ownerId: yup.string().trim().required(t('validation.required')),
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

watch(
    () => [props.show, props.riskId],
    async ([show, id]) => {
      if (show && id) {
        await Promise.all([fetchTree(), fetchCapabilityTree(), loadMembers()]);
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
  selectedCapitalSlug.value = (data as Record<string, unknown>).capitalSlug as string ?? '';
  selectedDomainSlug.value = (data as Record<string, unknown>).domainSlug as string ?? '';
  selectedComponentSlug.value = (data as Record<string, unknown>).componentSlug as string ?? '';

  await nextTick();
  populateForm(data);
  formKey.value += 1;
}

function populateForm(r: Risk) {
  const rec = r as Record<string, unknown>;
  initialValues.value = {
    title: r.title ?? '',
    riskType: r.riskType ?? '',
    categorySlug: r.categorySlug ?? '',
    categoryTitle: r.categoryTitle ?? '',
    subCategorySlug: r.subCategorySlug ?? '',
    subCategoryTitle: r.subCategoryTitle ?? '',
    capitalSlug: (rec.capitalSlug as string) ?? '',
    capitalTitle: (rec.capitalTitle as string) ?? '',
    domainSlug: (rec.domainSlug as string) ?? '',
    domainTitle: (rec.domainTitle as string) ?? '',
    componentSlug: (rec.componentSlug as string) ?? '',
    componentTitle: (rec.componentTitle as string) ?? '',
    capabilitySlug: (rec.capabilitySlug as string) ?? '',
    capabilityTitle: (rec.capabilityTitle as string) ?? '',
    ownerId: r.ownerId ?? '',
    impact: r.impact ?? '',
    likelihood: r.likelihood ?? '',
    vulnerability: r.vulnerability ?? '',
    threat: r.threat ?? '',
    analysisDescription: r.analysisDescription ?? '',
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
  setFieldValue('subCategorySlug', '');
  setFieldValue('subCategoryTitle', '');
  setFieldValue('categoryTitle', getCategoryTitle(String(value ?? '')));
}

function onCapitalChange(value: unknown) {
  selectedCapitalSlug.value = String(value ?? '');
  selectedDomainSlug.value = '';
  selectedComponentSlug.value = '';
  setFieldValue('capitalTitle', getCapabilityTitle(String(value ?? '')));
  setFieldValue('domainSlug', '');
  setFieldValue('domainTitle', '');
  setFieldValue('componentSlug', '');
  setFieldValue('componentTitle', '');
  setFieldValue('capabilitySlug', '');
  setFieldValue('capabilityTitle', '');
}

function onDomainChange(value: unknown) {
  selectedDomainSlug.value = String(value ?? '');
  selectedComponentSlug.value = '';
  setFieldValue('domainTitle', getCapabilityTitle(String(value ?? '')));
  setFieldValue('componentSlug', '');
  setFieldValue('componentTitle', '');
  setFieldValue('capabilitySlug', '');
  setFieldValue('capabilityTitle', '');
}

function onComponentChange(value: unknown) {
  selectedComponentSlug.value = String(value ?? '');
  setFieldValue('componentTitle', getCapabilityTitle(String(value ?? '')));
  setFieldValue('capabilitySlug', '');
  setFieldValue('capabilityTitle', '');
}

async function handleSave(values: Record<string, unknown>) {
  if (!risk.value) return;
  saving.value = true;
  try {
    const data = {
      title: values.title,
      riskType: values.riskType,
      categorySlug: values.categorySlug,
      categoryTitle: values.categoryTitle,
      subCategorySlug: values.subCategorySlug,
      subCategoryTitle: values.subCategoryTitle,
      capabilitySlug: values.capabilitySlug,
      capabilityTitle: values.capabilityTitle,
      componentSlug: values.componentSlug,
      componentTitle: values.componentTitle,
      domainSlug: values.domainSlug,
      domainTitle: values.domainTitle,
      capitalSlug: values.capitalSlug,
      capitalTitle: values.capitalTitle,
      ownerId: values.ownerId,
      impact: values.impact ? Number(values.impact) : null,
      likelihood: values.likelihood ? Number(values.likelihood) : null,
      vulnerability: values.vulnerability || '',
      threat: values.threat || '',
      analysisDescription: values.analysisDescription || '',
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
  formRef.value?.validate().then(({ valid }) => {
    if (!valid) return;
    const values = formRef.value?.getValues();
    openModal({
      component: BaseConfirmModal,
      props: {
        title: t('risk.transition-confirm-title'),
        message: t('risk.transition-confirm-message', { status: t('risk.status-response') }),
        confirmVariant: 'primary' as const,
        onConfirmAction: async () => {
          transitioning.value = true;
          try {
            const res = await transitionRisk(risk.value!.slug, 'response', {
              ...values,
              impact: values.impact ? Number(values.impact) : null,
              likelihood: values.likelihood ? Number(values.likelihood) : null,
              capabilityTitle: values.capabilityTitle,
              componentTitle: values.componentTitle,
              domainTitle: values.domainTitle,
              capitalTitle: values.capitalTitle,
            });
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
        <div class="space-y-3">
          <BaseInput
              name="title"
              :label="t('risk.field-title')"
              :required="true"
              :placeholder="t('risk.field-title-placeholder')"
          />
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
            <BaseSelect
                name="categorySlug"
                :label="t('risk.field-category')"
                :options="categoryOptions"
                :required="true"
                :filter="true"
                @change="onCategoryChange"
            />
            <BaseSelect
                name="subCategorySlug"
                :label="t('risk.field-sub-category')"
                :options="subCategoryOptions(selectedCategorySlug)"
                :required="true"
                :filter="true"
            />
            <BaseSelect
                name="capitalSlug"
                :label="t('risk.field-capital')"
                :options="capitalOptions"
                :required="true"
                :filter="true"
                @change="onCapitalChange"
            />
            <BaseSelect
                name="domainSlug"
                :label="t('risk.field-domain')"
                :options="domainOptions(selectedCapitalSlug)"
                :required="true"
                :filter="true"
                @change="onDomainChange"
            />
            <BaseSelect
                name="componentSlug"
                :label="t('risk.field-component')"
                :options="componentOptions(selectedDomainSlug)"
                :required="true"
                :filter="true"
                @change="onComponentChange"
            />
            <BaseSelect
                name="capabilitySlug"
                :label="t('risk.field-capability')"
                :options="capabilityOptions(selectedComponentSlug)"
                :required="true"
                :filter="true"
            />
            <BaseSelect
                name="ownerId"
                :label="t('risk.field-owner')"
                :options="memberOptions"
                :required="true"
                :filter="true"
            />
            <BaseSelect
                name="riskType"
                :label="t('risk.field-risk-type')"
                :options="riskTypeOptions"
                :required="true"
            />
          </div>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
            <BaseSelect
                name="impact"
                :label="t('risk.field-impact-factor')"
                :options="impactOptions"
                :required="true"
            />
            <BaseSelect
                name="likelihood"
                :label="t('risk.field-likelihood')"
                :options="likelihoodOptions"
                :required="true"
            />
          </div>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
            <BaseInput
                name="vulnerability"
                :label="t('risk.field-vulnerability')"
                :placeholder="t('risk.field-vulnerability-placeholder')"
            />
            <BaseInput
                name="threat"
                :label="t('risk.field-threat')"
                :placeholder="t('risk.field-threat-placeholder')"
            />
          </div>
          <BaseInput
              name="analysisDescription"
              :label="t('risk.field-analysis-description')"
              type="textarea"
              :rows="3"
              :placeholder="t('risk.field-analysis-description-placeholder')"
          />
        </div>
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
          {{ t('general.close') }}
        </Button>
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
