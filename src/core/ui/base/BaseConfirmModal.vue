<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import Button from '@/base-components/Button';

const props = withDefaults(
  defineProps<{
    show: boolean;
    /** کلید i18n عنوان؛ در صورت نبود `title` استفاده می‌شود */
    titleKey?: string;
    /** کلید i18n متن توضیح */
    messageKey?: string;
    /** عنوان مستقیم (اولویت بر `titleKey`) */
    title?: string;
    /** متن مستقیم (اولویت بر `messageKey`) */
    message?: string;
    /** کلید برچسب دکمهٔ تأیید */
    confirmLabelKey?: string;
    /** کلید برچسب انصراف */
    cancelLabelKey?: string;
    /** ظاهر دکمهٔ تأیید برای عملیات خطرناک */
    confirmVariant?: 'primary' | 'danger' | 'warning';
    /** کلاس ریشهٔ دیالوگ (عرض پیش‌فرض باریک‌تر از مودال معمولی) */
    rootClass?: string;
    /** در حین اجرای `onConfirmAction` بستن مودال غیرفعال می‌شود */
    closableWhilePending?: boolean;
    /**
     * پس از کلیک تأیید اجرا می‌شود.
     * در صورت resolve بدون خطا، `success` emit و مودال بسته می‌شود.
     * در صورت throw، پیام خطا toast می‌شود و مودال باز می‌ماند.
     */
    onConfirmAction?: () => Promise<void>;
  }>(),
  {
    titleKey: 'general.confirm-dialog-title',
    messageKey: 'general.confirm-dialog-message',
    confirmLabelKey: 'general.confirm-dialog-confirm',
    cancelLabelKey: 'rule.form-cancel',
    confirmVariant: 'danger',
    rootClass: '',
    closableWhilePending: true,
  }
);

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  /** پس از تأیید موفق (با یا بدون `onConfirmAction`) */
  (e: 'success'): void;
  /** فقط وقتی `onConfirmAction` تعریف نشده باشد، قبل از بستن */
  (e: 'confirm'): void;
}>();

const { t } = useI18n();
const pending = ref(false);

const displayTitle = computed(() => {
  if (props.title != null && String(props.title).trim() !== '') return props.title;
  return t(props.titleKey ?? 'general.confirm-dialog-title');
});

const displayMessage = computed(() => {
  if (props.message != null && String(props.message).trim() !== '') return props.message;
  return t(props.messageKey ?? 'general.confirm-dialog-message');
});

const mergedRootClass = computed(() => {
  const base =
    'max-w-md w-[min(100%,28rem)] rounded-modal border border-border bg-surface shadow-xl dark:border-border dark:bg-surface';
  return props.rootClass?.trim() ? `${base} ${props.rootClass}` : base;
});

const dialogClosable = computed(() => {
  if (props.closableWhilePending && pending.value) return false;
  return true;
});

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
  if (!v) emit('close');
}

async function handleConfirm() {
  if (props.onConfirmAction) {
    pending.value = true;
    try {
      await props.onConfirmAction();
      emit('success');
      close();
    } catch {
      /* خطا در فراخوان‌کننده با throw یا toast گزارش شده است */
    } finally {
      pending.value = false;
    }
    return;
  }
  emit('confirm');
  emit('success');
  close();
}

const confirmButtonVariant = computed(() => {
  if (props.confirmVariant === 'primary') return 'primary';
  if (props.confirmVariant === 'warning') return 'warning';
  return 'danger';
});
</script>

<template>
  <BaseModal
    :visible="show"
    :title="displayTitle"
    :closable="dialogClosable"
    :root-class="mergedRootClass"
    @update:visible="onDialogVisible"
  >
    <p class="text-sm leading-relaxed text-text-secondary dark:text-text-secondary">
      {{ displayMessage }}
    </p>
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          :disabled="pending"
          @click="close"
        >
          {{ t(cancelLabelKey ?? 'rule.form-cancel') }}
        </Button>
        <Button
          type="button"
          :variant="confirmButtonVariant"
          size="sm"
          :disabled="pending"
          @click="handleConfirm"
        >
          {{ t(confirmLabelKey ?? 'general.confirm-dialog-confirm') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
