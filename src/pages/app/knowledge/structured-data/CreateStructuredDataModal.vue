<script setup lang="ts">
import { ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import Button from '@/base-components/Button';
import { grcHttp } from '@/core/api/grcHttp';
import { endpoints } from '@/core/api/endpoints';

const MODAL_SKIN = 'rounded-xl border border-slate-200 bg-white shadow-xl dark:border-darkmode-600 dark:bg-darkmode-800';

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();

const saving = ref(false);
const formKey = ref(0);
const isConverted = ref(false);

const tagOptions = [
  { value: 'legal', label: 'حقوقی' },
  { value: 'compliance', label: 'تطبیق' },
  { value: 'risk', label: 'ریسک' },
  { value: 'governance', label: 'حاکمیت' },
  { value: 'esg', label: 'پایداری' },
  { value: 'policy', label: 'سیاست‌نامه' },
];

const formSchema = yup.object({
  title: yup.string().trim().required(t('structured-data.validation-title-required')),
  data: yup.string().trim().required(t('structured-data.validation-data-required')),
  converted: yup.string().test('converted-required', t('structured-data.validation-converted-required'), (value) => {
    if (!isConverted.value) return true;
    return !!value && value.trim().length > 0;
  }),
  tags: yup.array().of(yup.string()).default([]),
});

async function onSubmit(values: Record<string, unknown>) {
  saving.value = true;
  try {
    await grcHttp.post(endpoints.rag.structuredData.create, {
      title: String(values.title ?? ''),
      data: String(values.data ?? ''),
      converted: String(values.converted ?? ''),
      isConverted: isConverted.value,
      tags: (values.tags ?? []) as string[],
    });
    toast(t('structured-data.form-add-success'), { type: 'success' });
    emit('success');
    close();
  } catch {
    toast(t('structured-data.form-add-error'), { type: 'error' });
  } finally {
    saving.value = false;
  }
}

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  if (!v) close();
}

watch(() => props.show, (visible) => {
  if (!visible) return;
  formKey.value++;
  saving.value = false;
  isConverted.value = false;
});
</script>

<template>
  <BaseModal
    :visible="show"
    :title="t('structured-data.modal-add-title')"
    :root-class="`w-[min(100%,32rem)] max-w-[32rem] ${MODAL_SKIN}`"
    @update:visible="onDialogVisible"
  >
    <Form
      :key="'form-' + formKey"
      id="create-structured-data-form"
      :validation-schema="formSchema"
      :initial-values="{ title: '', data: '', converted: '', tags: [] }"
      class="space-y-4"
      @submit="onSubmit"
    >
      <BaseInput
        name="title"
        :label="t('structured-data.form-title')"
        :placeholder="t('structured-data.form-title')"
        :required="true"
      />
      <BaseInput
        name="data"
        type="textarea"
        :label="t('structured-data.form-data')"
        :placeholder="t('structured-data.form-data-placeholder')"
        :required="true"
        :rows="6"
        input-dir="ltr"
      />

      <!-- isConverted checkbox -->
      <div class="form-control w-full">
        <label class="label min-h-0 py-1 cursor-pointer justify-start gap-2">
          <input
            v-model="isConverted"
            type="checkbox"
            class="checkbox checkbox-sm checkbox-primary"
          />
          <span class="label-text text-sm font-normal leading-snug">{{ t('structured-data.form-is-converted') }}</span>
        </label>
      </div>

      <!-- converted textarea — only enabled when isConverted is checked -->
      <BaseInput
        name="converted"
        type="textarea"
        :label="t('structured-data.form-converted')"
        :placeholder="t('structured-data.form-converted-placeholder')"
        :disabled="!isConverted"
        :rows="4"
      />

      <BaseMultiSelect
        name="tags"
        :label="t('structured-data.form-tags')"
        :options="tagOptions"
        :placeholder="t('structured-data.form-tags-placeholder')"
      />
    </Form>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline-secondary" size="sm" :disabled="saving" @click="close">
          {{ t('structured-data.form-cancel') }}
        </Button>
        <Button type="submit" variant="primary" size="sm" :disabled="saving" form="create-structured-data-form">
          {{ t('structured-data.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
