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
    parentSlug?: string | null;
    parentTitle?: string | null;
    record?: Record<string, unknown> | null;
  }>(),
  {
    parentSlug: null,
    parentTitle: null,
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

const modalTitle = computed(() => {
  if (isEdit.value) return t('settings-page.category-edit');
  return props.parentSlug
    ? t('settings-page.category-add-child')
    : t('settings-page.category-add-parent');
});

const initialValues = ref({ slug: '', title: '', description: '' });

const validationSchema = computed(() =>
  yup.object({
    slug: isEdit.value
      ? yup.string().optional()
      : yup.string().trim().required(t('settings-page.category-validation-slug')),
    title: yup.string().trim().required(t('settings-page.category-validation-title')),
    description: yup.string().trim().optional(),
  })
);

function seedForm() {
  if (isEdit.value && props.record) {
    initialValues.value = {
      slug: String(props.record.slug ?? ''),
      title: String(props.record.title ?? ''),
      description: String(props.record.description ?? ''),
    };
  } else {
    initialValues.value = { slug: '', title: '', description: '' };
  }
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

async function onSubmit(values: { slug?: string; title?: string; description?: string }) {
  const title = String(values.title ?? '').trim();
  const description = String(values.description ?? '').trim();
  saving.value = true;
  try {
    let result;
    if (isEdit.value && props.record) {
      const slug = String(props.record.slug ?? '');
      result = await grcRepo.governanceCategoryUpdate(slug, { title, description });
    } else {
      const slug = String(values.slug ?? '').trim();
      const payload: Record<string, unknown> = { slug, title, description };
      if (props.parentSlug) {
        payload.parentSlug = props.parentSlug;
      }
      result = await grcRepo.governanceCategoryCreate(payload);
    }

    if (result?.result) {
      toast(
        isEdit.value
          ? t('settings-page.category-form-edit-success')
          : t('settings-page.category-form-add-success'),
        { type: 'success' }
      );
      emit('success');
      close();
    } else {
      toast(
        String(
          result?.error ??
            (isEdit.value
              ? t('settings-page.category-form-edit-error')
              : t('settings-page.category-form-add-error'))
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error
        ? e.message
        : isEdit.value
          ? t('settings-page.category-form-edit-error')
          : t('settings-page.category-form-add-error'),
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
      id="category-form"
      :key="formKey"
      ref="formRef"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-2 py-1"
      @submit="onSubmit"
    >
      <div data-autofocus-modal>
        <div v-if="parentTitle && !isEdit" class="mb-2 text-xs text-slate-500">
          {{ t('settings-page.category-parent-label') }}: <span class="font-medium text-slate-700 dark:text-slate-300">{{ parentTitle }}</span>
        </div>
        <BaseInput
          name="slug"
          :label="t('settings-page.category-col-slug')"
          type="text"
          :required="!isEdit"
          :disabled="isEdit"
          autofocus
        />
        <BaseInput
          name="title"
          :label="t('settings-page.category-col-title')"
          type="text"
          required
        />
        <BaseInput
          name="description"
          :label="t('settings-page.category-col-description')"
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
          :disabled="saving"
          @click="close"
        >
          {{ t('rule.form-cancel') }}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          form="category-form"
          :disabled="saving"
        >
          {{ isEdit ? t('rule.form-edit-submit') : t('rule.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
