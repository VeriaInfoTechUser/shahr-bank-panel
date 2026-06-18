<script setup lang="ts">
import { computed } from 'vue';
import { Form, useFormContext } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import Button from '@/base-components/Button';
import RegistrationSection from '../sections/RegistrationSection.vue';

const props = defineProps<{
  formKey: number;
  initialValues: Record<string, unknown>;
  categoryOptions: { value: string; label: string }[];
  subCategoryOptions: { value: string; label: string }[];
  memberOptions: { value: string; label: string }[];
  selectedCategorySlug: string;
  saving: boolean;
  registering: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', values: Record<string, unknown>): void;
  (e: 'categoryChange', value: unknown): void;
  (e: 'register', values: Record<string, unknown>): void;
  (e: 'delete'): void;
}>();

const { t } = useI18n();

const validationSchema = computed(() => yup.object({
  title: yup.string().trim().required(t('validation.required')),
  draftDescription: yup.string().trim().required(t('validation.required')),
  riskType: yup.string().trim().required(t('validation.required')),
  categorySlug: yup.string().trim().required(t('validation.required')),
  subCategorySlug: yup.string().trim().required(t('validation.required')),
  ownerId: yup.string().trim().required(t('validation.required')),
}));

async function onSubmit(values: Record<string, unknown>) {
  emit('submit', values);
}

async function handleRegister() {
  const { validate, values } = useFormContext();
  const { valid } = await validate();
  if (!valid) return;
  emit('register', values);
}
</script>

<template>
  <Form
    :key="formKey"
    id="risk-detail-form"
    :validation-schema="validationSchema"
    :initial-values="initialValues"
    class="space-y-3"
    @submit="onSubmit"
  >
    <RegistrationSection
      mode="editable"
      :category-options="categoryOptions"
      :sub-category-options="subCategoryOptions"
      :member-options="memberOptions"
      :show-draft-description="true"
      @category-change="emit('categoryChange', $event)"
    />

    <div class="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-darkmode-600">
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        :disabled="saving"
      >
        {{ t('title.update') }}
      </Button>
    </div>
  </Form>
</template>
