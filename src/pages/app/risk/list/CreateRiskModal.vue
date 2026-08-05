<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { Form, useForm } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import { useRisk } from './useRisk';
import { useRiskCategories } from './useRiskCategories';
import { useCapabilityTree } from './useCapabilityTree';
import { ermRepo } from '@/core/repositories/ermRepo';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const { loading, createRisk } = useRisk();
const { categoryOptions, subCategoryOptions, getCategoryTitle, getSubCategoryTitle, fetchTree } = useRiskCategories();
const { capitalOptions, domainOptions, componentOptions, capabilityOptions, getTitle: getCapabilityTitle, fetchTree: fetchCapabilityTree } = useCapabilityTree();
const saving = ref(false);
const formKey = ref(0);
const selectedCategorySlug = ref('');
const selectedCapitalSlug = ref('');
const selectedDomainSlug = ref('');
const selectedComponentSlug = ref('');
const memberOptions = ref<{ value: string; label: string }[]>([]);

const { setFieldValue } = useForm();

const riskTypeOptions = computed(() => [
  { value: 'threat', label: t('risk.type-threat') },
  { value: 'opportunity', label: t('risk.type-opportunity') },
]);

const initialValues = ref({
  title: '',
  draftDescription: '',
  riskType: '',
  categorySlug: '',
  categoryTitle: '',
  subCategorySlug: '',
  subCategoryTitle: '',
  capitalSlug: '',
  capitalTitle: '',
  domainSlug: '',
  domainTitle: '',
  componentSlug: '',
  componentTitle: '',
  capabilitySlug: '',
  capabilityTitle: '',
  ownerId: '',
});

const validationSchema = computed(() =>
  yup.object({
    title: yup.string().trim().required(t('validation.required')),
    draftDescription: yup.string().trim().required(t('validation.required')),
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
  })
);

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
  () => props.show,
  (show) => {
    if (show) {
      initialValues.value = {
        title: '',
        draftDescription: '',
        riskType: '',
        categorySlug: '',
        categoryTitle: '',
        subCategorySlug: '',
        subCategoryTitle: '',
        capitalSlug: '',
        capitalTitle: '',
        domainSlug: '',
        domainTitle: '',
        componentSlug: '',
        componentTitle: '',
        capabilitySlug: '',
        capabilityTitle: '',
        ownerId: '',
      };
      selectedCategorySlug.value = '';
      selectedCapitalSlug.value = '';
      selectedDomainSlug.value = '';
      selectedComponentSlug.value = '';
      formKey.value += 1;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  fetchTree();
  fetchCapabilityTree();
  try {
    const res = await ermRepo.memberList({ page: 1, limit: 500 });
    const list = res?.data?.list ?? [];
    memberOptions.value = mapMembers(Array.isArray(list) ? list : []);
  } catch {
    memberOptions.value = [];
  }
});

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

async function onSubmit(values: Record<string, unknown>) {
  saving.value = true;
  try {
    const data = {
      title: String(values.title ?? ''),
      createDescription: String(values.draftDescription ?? ''),
      riskType: String(values.riskType ?? ''),
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
      ownerId: String(values.ownerId ?? ''),
    };
    await createRisk(data);
    toast(t('risk.create-success'), { type: 'success' });
    emit('success');
    close();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('risk.create-error');
    toast(message, { type: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="t('risk.create-title')"
    size="md"
    @update:visible="onDialogVisible"
  >
    <Form
      :key="formKey"
      id="create-risk-form"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-3"
      @submit="onSubmit"
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
            :filter="true"
          />
          <BaseSelect
            name="riskType"
            :label="t('risk.field-risk-type')"
            :options="riskTypeOptions"
            :required="true"
          />
        </div>
        <BaseInput
          name="draftDescription"
          :label="t('risk.field-create-description')"
          type="textarea"
          :rows="3"
          :placeholder="t('risk.field-create-description-placeholder')"
        />
      </div>
    </Form>
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          :disabled="saving"
          @click="close"
        >
          {{ t('general.cancel') }}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          form="create-risk-form"
          :disabled="saving"
        >
          {{ t('risk.action.save-draft') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
