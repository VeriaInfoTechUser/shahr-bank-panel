<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Form, useForm } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import { useRisk } from './useRisk';
import RegistrationSection from './sections/RegistrationSection.vue';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const { loading, categoryOptions, subCategoryOptions, fetchCategories, createRisk } = useRisk();
const saving = ref(false);
const formKey = ref(0);
const selectedCategorySlug = ref('');

const { setFieldValue } = useForm();

const initialValues = ref({
  title: '',
  description: '',
  riskType: '',
  categorySlug: '',
  subCategorySlug: '',
  source: '',
  owner: '',
});

const validationSchema = computed(() =>
  yup.object({
    title: yup.string().trim().required(t('validation.required')),
    description: yup.string().trim().optional(),
    riskType: yup.string().trim().required(t('validation.required')),
    categorySlug: yup.string().trim().required(t('validation.required')),
    subCategorySlug: yup.string().trim().required(t('validation.required')),
    source: yup.string().trim().optional(),
    owner: yup.string().trim().optional(),
  })
);

watch(
  () => props.show,
  (show) => {
    if (show) {
      initialValues.value = {
        title: '',
        description: '',
        riskType: '',
        categorySlug: '',
        subCategorySlug: '',
        source: '',
        owner: '',
      };
      selectedCategorySlug.value = '';
      formKey.value += 1;
    }
  },
  { immediate: true }
);

fetchCategories();

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

async function onSubmit(values: Record<string, unknown>) {
  saving.value = true;
  try {
    const data = {
      title: String(values.title ?? ''),
      description: String(values.description ?? ''),
      riskType: String(values.riskType ?? ''),
      categorySlug: String(values.categorySlug ?? ''),
      subCategorySlug: String(values.subCategorySlug ?? ''),
      source: String(values.source ?? ''),
      owner: String(values.owner ?? ''),
      status: 'draft',
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
      <RegistrationSection
        mode="editable"
        :category-options="categoryOptions"
        :sub-category-options="subCategoryOptions(selectedCategorySlug)"
        @category-change="onCategoryChange"
      />
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
