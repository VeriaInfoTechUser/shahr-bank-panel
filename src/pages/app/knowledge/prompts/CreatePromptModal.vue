<script setup lang="ts">
import { ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
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

const typeOptions = [
  { value: 'structure-data', label: 'داده ساخت‌یافته' },
  { value: 'agent', label: 'عامل' },
];

const formSchema = yup.object({
  title: yup.string().trim().required(t('prompts.validation-title-required')),
  summary: yup.string().trim().required(t('prompts.validation-summary-required')),
  text: yup.string().trim().required(t('prompts.validation-text-required')),
  type: yup.string().trim().required(t('prompts.validation-type-required')),
});

async function onSubmit(values: Record<string, unknown>) {
  saving.value = true;
  try {
    await grcHttp.post(endpoints.rag.prompts.create, {
      title: String(values.title ?? ''),
      summary: String(values.summary ?? ''),
      text: String(values.text ?? ''),
      type: String(values.type ?? ''),
    });
    toast(t('prompts.form-add-success'), { type: 'success' });
    emit('success');
    close();
  } catch {
    toast(t('prompts.form-add-error'), { type: 'error' });
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
});
</script>

<template>
  <BaseModal
    :visible="show"
    :title="t('prompts.modal-add-title')"
    :root-class="`w-[min(100%,32rem)] max-w-[32rem] ${MODAL_SKIN}`"
    @update:visible="onDialogVisible"
  >
    <Form
      :key="'form-' + formKey"
      id="create-prompt-form"
      :validation-schema="formSchema"
      :initial-values="{ title: '', summary: '', text: '', type: '' }"
      class="space-y-4"
      @submit="onSubmit"
    >
      <BaseInput
        name="title"
        :label="t('prompts.form-title')"
        :placeholder="t('prompts.form-title')"
        :required="true"
      />
      <BaseInput
        name="summary"
        :label="t('prompts.form-summary')"
        :placeholder="t('prompts.form-summary')"
        :required="true"
      />
      <BaseInput
        name="text"
        type="textarea"
        :label="t('prompts.form-text')"
        :placeholder="t('prompts.form-text-placeholder')"
        :required="true"
        :rows="6"
      />
      <div class="form-control w-full">
        <label class="label min-h-0 py-1">
          <span class="label-text text-sm font-normal leading-snug">{{ t('prompts.form-type') }} <span class="text-error">*</span></span>
        </label>
        <select
          name="type"
          class="select select-bordered w-full !h-8 !min-h-0 py-1.5 px-2.5 text-xs font-light leading-snug dark:bg-darkmode-800 dark:text-slate-200"
        >
          <option value="" disabled>{{ t('prompts.form-type-placeholder') }}</option>
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </Form>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline-secondary" size="sm" :disabled="saving" @click="close">
          {{ t('prompts.form-cancel') }}
        </Button>
        <Button type="submit" variant="primary" size="sm" :disabled="saving" form="create-prompt-form">
          {{ t('prompts.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
