<script setup lang="ts">
import { ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
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

const formSchema = yup.object({
  title: yup.string().trim().required(t('documents.validation-title-required')),
  path: yup.string().trim().required(t('documents.validation-file-required')),
});

async function onSubmit(values: Record<string, unknown>) {
  saving.value = true;
  try {
    await grcHttp.post(endpoints.rag.documents.process, {
      title: String(values.title ?? ''),
      path: String(values.path ?? ''),
    });
    toast(t('documents.form-add-success'), { type: 'success' });
    emit('success');
    close();
  } catch {
    toast(t('documents.form-add-error'), { type: 'error' });
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
    :title="t('documents.modal-add-title')"
    :root-class="`w-[min(100%,32rem)] max-w-[32rem] ${MODAL_SKIN}`"
    @update:visible="onDialogVisible"
  >
    <Form
      :key="'form-' + formKey"
      id="create-document-form"
      :validation-schema="formSchema"
      :initial-values="{ title: '', path: '' }"
      class="space-y-4"
      @submit="onSubmit"
    >
      <BaseInput
        name="title"
        :label="t('documents.form-title')"
        :placeholder="t('documents.form-title')"
        :required="true"
      />
      <BaseInput
        name="path"
        :label="t('documents.form-file')"
        :placeholder="t('documents.form-file')"
        :required="true"
        input-dir="ltr"
      />
    </Form>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline-secondary" size="sm" :disabled="saving" @click="close">
          {{ t('documents.form-cancel') }}
        </Button>
        <Button type="submit" variant="primary" size="sm" :disabled="saving" form="create-document-form">
          <Lucide v-if="saving" icon="Loader2" class="me-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="Check" class="me-1 h-3.5 w-3.5" />
          {{ t('documents.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
