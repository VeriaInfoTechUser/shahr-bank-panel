<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import Button from '@/base-components/Button';
import { grcRepo } from '@/core/repositories/grcRepo';

const props = withDefaults(
  defineProps<{
    show: boolean;
    record?: Record<string, unknown> | null;
  }>(),
  {
    record: null,
  }
);

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t, locale } = useI18n();

const formRef = ref<InstanceType<typeof Form> | null>(null);
const saving = ref(false);
const formKey = ref(0);

const isEdit = computed(() => {
  const r = props.record;
  if (!r || typeof r !== 'object') return false;
  const slug = r.slug;
  return slug != null && slug !== '';
});

const modalTitle = computed(() =>
  isEdit.value ? t('settings-page.edit-law-type') : t('settings-page.add-law-type')
);

const initialValues = ref({ title: '' });

const validationSchema = computed(() =>
  yup.object({
    title: yup.string().trim().required(t('settings-page.law-type-validation-title')),
  })
);

function titleFromRecord(rec: Record<string, unknown> | null | undefined): string {
  if (!rec) return '';
  for (const key of ['title', 'name', 'label'] as const) {
    const v = rec[key];
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return '';
}

function seedForm() {
  initialValues.value = {
    title: titleFromRecord(props.record ?? null),
  };
  formKey.value += 1;
}

watch(locale, async () => {
  await nextTick();
  const exposed = formRef.value as { validate?: () => Promise<unknown> } | null;
  await exposed?.validate?.();
});

watch(
  () => [props.show, props.record] as const,
  ([visible]) => {
    if (!visible) return;
    seedForm();
  },
  { immediate: true }
);

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
  if (!v) emit('close');
}

async function onSubmit(values: { title?: string }) {
  const title = String(values.title ?? '').trim();
  saving.value = true;
  try {
    let result;
    if (isEdit.value && props.record) {
      const slug = String(props.record.slug ?? '');
      result = await grcRepo.typeUpdate(slug, { title });
    } else {
      result = await grcRepo.typeCreate({ title });
    }

    if (result?.result) {
      toast(
        isEdit.value
          ? t('settings-page.law-type-form-edit-success')
          : t('settings-page.law-type-form-add-success'),
        { type: 'success' }
      );
      emit('success');
      close();
    } else {
      toast(
        String(
          result?.error ??
            (isEdit.value
              ? t('settings-page.law-type-form-edit-error')
              : t('settings-page.law-type-form-add-error'))
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error
        ? e.message
        : isEdit.value
          ? t('settings-page.law-type-form-edit-error')
          : t('settings-page.law-type-form-add-error'),
      { type: 'error' }
    );
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="modalTitle"
    size="sm"
    @update:visible="onDialogVisible"
  >
    <Form
      id="law-type-form"
      :key="formKey"
      ref="formRef"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-2 py-1"
      @submit="onSubmit"
    >
      <div data-autofocus-modal>
        <BaseInput
          name="title"
          :label="t('settings-page.law-type-col-name')"
          type="text"
          required
          autofocus
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
          {{ t('rule.form-cancel') }}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          form="law-type-form"
          :disabled="saving"
        >
          {{ isEdit ? t('rule.form-edit-submit') : t('rule.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
