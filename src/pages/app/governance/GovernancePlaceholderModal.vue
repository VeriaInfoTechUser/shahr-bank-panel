<script setup lang="ts">
import BaseModal from '@/core/ui/base/BaseModal.vue';
import Button from '@/base-components/Button';
import { useI18n } from 'vue-i18n';

defineProps<{
  show: boolean;
  /** کلید i18n برای عنوان مودال (مثلاً همان عنوان دکمهٔ افزودن) */
  titleKey: string;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
}>();

const { t } = useI18n();

function onDialogVisible(v: boolean) {
  emit('update:show', v);
  if (!v) emit('close');
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="t(titleKey)"
    @update:visible="onDialogVisible"
  >
    <div
      data-autofocus-modal
      class="min-h-[6rem] py-1"
      aria-hidden="true"
    />
    <template #footer>
      <Button
        type="button"
        variant="outline-secondary"
        size="sm"
        @click="onDialogVisible(false)"
      >
        {{ t('rule.form-cancel') }}
      </Button>
    </template>
  </BaseModal>
</template>
