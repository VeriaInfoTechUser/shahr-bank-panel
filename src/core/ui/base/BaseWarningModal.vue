<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';

const props = withDefaults(
  defineProps<{
    show: boolean;
    titleKey?: string;
    messageKey?: string;
    title?: string;
    message?: string;
    closeLabelKey?: string;
    rootClass?: string;
  }>(),
  {
    titleKey: 'general.warning',
    messageKey: '',
    closeLabelKey: 'general.close',
    rootClass: '',
  }
);

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
}>();

const { t } = useI18n();

const displayTitle = computed(() => {
  if (props.title != null && String(props.title).trim() !== '') return props.title;
  return t(props.titleKey ?? 'general.warning');
});

const displayMessage = computed(() => {
  if (props.message != null && String(props.message).trim() !== '') return props.message;
  return t(props.messageKey ?? '');
});

const mergedRootClass = computed(() => {
  const base =
    'max-w-md w-[min(100%,28rem)] rounded-modal border border-border bg-surface shadow-xl dark:border-border dark:bg-surface';
  return props.rootClass?.trim() ? `${base} ${props.rootClass}` : base;
});

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
    :closable="true"
    :root-class="mergedRootClass"
    @update:visible="onDialogVisible"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <div class="flex h-7 w-7 items-center justify-center rounded-full bg-warning/20">
          <Lucide icon="AlertTriangle" class="h-4 w-4 text-warning" />
        </div>
        <span class="font-normal leading-tight text-text-secondary !text-[16px]">
          {{ displayTitle }}
        </span>
      </div>
    </template>
    <p class="text-sm leading-relaxed text-text-secondary dark:text-text-secondary">
      {{ displayMessage }}
    </p>
    <template #footer>
      <div class="flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="sm"
          @click="close"
        >
          {{ t(closeLabelKey ?? 'general.close') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
