<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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

const { t } = useI18n();

const formRef = ref<InstanceType<typeof Form> | null>(null);
const saving = ref(false);
const formKey = ref(0);

const isEdit = computed(() => {
  const r = props.record;
  if (!r || typeof r !== 'object') return false;
  const slug = r.slug;
  return slug != null && slug !== '';
});

const modalTitle = computed(() => {
  return isEdit.value ? t('capital-indicator-page.edit') : t('capital-indicator-page.add');
});

const initialValues = ref({ slug: '', title: '', description: '', number: '' });

const validationSchema = computed(() =>
  yup.object({
    slug: yup
      .string()
      .trim()
      .required(t('capital-indicator-page.validation-slug')),
    title: yup.string().trim().optional(),
    description: yup.string().trim().optional(),
    number: yup.string().trim().optional(),
  })
);

function slugFromRecord(rec: Record<string, unknown> | null | undefined): string {
  if (!rec) return '';
  const v = rec.slug;
  if (typeof v === 'string' && v.trim()) return v;
  return '';
}

function titleFromRecord(rec: Record<string, unknown> | null | undefined): string {
  if (!rec) return '';
  for (const key of ['title', 'name'] as const) {
    const v = rec[key];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}

function descriptionFromRecord(rec: Record<string, unknown> | null | undefined): string {
  if (!rec) return '';
  for (const key of ['description', 'summary'] as const) {
    const v = rec[key];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}

function numberFromRecord(rec: Record<string, unknown> | null | undefined): string {
  if (!rec) return '';
  const v = rec.number;
  if (typeof v === 'string' && v.trim()) return v;
  return '';
}

function seedForm() {
  initialValues.value = {
    slug: slugFromRecord(props.record ?? null),
    title: titleFromRecord(props.record ?? null),
    description: descriptionFromRecord(props.record ?? null),
    number: numberFromRecord(props.record ?? null),
  };
  formKey.value += 1;
}

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

async function onSubmit(values: { slug?: string; title?: string; description?: string; number?: string }) {
  const slug = String(values.slug ?? '').trim();
  const title = String(values.title ?? '').trim();
  const description = String(values.description ?? '').trim();
  const number = String(values.number ?? '').trim();
  saving.value = true;
  try {
    let result;
    if (isEdit.value && props.record) {
      const existingSlug = String(props.record.slug ?? '');
      result = await grcRepo.indicatorUpdate(existingSlug, { slug, title, description, number });
    } else {
      result = await grcRepo.indicatorCreate({ slug, title, description, number, status: 1 });
    }

    if (result?.result) {
      toast(
        isEdit.value
          ? t('capital-indicator-page.edit-success')
          : t('capital-indicator-page.add-success'),
        { type: 'success' }
      );
      emit('success');
      close();
    } else {
      toast(
        String(
          result?.error ??
            (isEdit.value
              ? t('capital-indicator-page.edit-error')
              : t('capital-indicator-page.add-error'))
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error
        ? e.message
        : isEdit.value
          ? t('capital-indicator-page.edit-error')
          : t('capital-indicator-page.add-error'),
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
      id="indicator-form"
      :key="formKey"
      ref="formRef"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-4"
      @submit="onSubmit"
    >
      <div data-autofocus-modal>
        <BaseInput
          name="slug"
          :label="t('capital-indicator-page.col-slug')"
          type="text"
          required
          autofocus
          :disabled="isEdit"
        />
        <BaseInput
          name="title"
          :label="t('capital-indicator-page.col-title')"
          type="text"
        />
        <BaseInput
          name="number"
          :label="t('capital-indicator-page.col-number')"
          type="text"
        />
        <BaseInput
          name="description"
          :label="t('capital-indicator-page.col-description')"
          type="textarea"
        />
      </div>
    </Form>
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          class="!rounded-lg"
          :disabled="saving"
          @click="close"
        >
          {{ t('rule.form-cancel') }}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          class="!rounded-lg !shadow-md !shadow-primary/20"
          form="indicator-form"
          :disabled="saving"
        >
          {{ isEdit ? t('rule.form-edit-submit') : t('rule.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
