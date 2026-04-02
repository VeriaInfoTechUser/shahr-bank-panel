<script setup lang="ts">
import BaseModal from '@/core/ui/base/BaseModal.vue';
import Button from '@/base-components/Button';
import { useI18n } from 'vue-i18n';

defineProps<{
  show: boolean;
  /** برای مراحل بعد؛ فعلاً در UI استفاده نمی‌شود */
  row?: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
}>();

const { t } = useI18n();

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
  if (!v) emit('close');
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="t('compliance-page.status-flow-modal-title')"
    @update:visible="onDialogVisible"
  >
    <div
      class="min-h-[min(12rem,40vh)] py-2"
      data-autofocus-modal
    />
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          @click="close"
        >
          {{ t('rule.form-cancel') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
