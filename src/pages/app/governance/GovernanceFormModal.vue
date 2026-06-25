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
    type: string;
    entityName: string;
    entityLabelKey?: string;
  }>(),
  {
    record: null,
    entityLabelKey: undefined,
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

const entityLabel = computed(() => t(props.entityLabelKey ?? `menu.governance-${props.entityName}`));

const modalTitle = computed(() =>
  isEdit.value
    ? t('governance-page.edit-entity', { entity: entityLabel.value })
    : t('governance-page.add-entity', { entity: entityLabel.value })
);

const initialValues = ref({ title: '', description: '' });

const validationSchema = computed(() =>
  yup.object({
    title: yup
      .string()
      .trim()
      .required(t('governance-page.validation-title-required')),
    description: yup.string().trim().optional(),
  })
);

function titleFromRecord(rec: Record<string, unknown> | null | undefined): string {
  if (!rec) return '';
  const info = rec.information as Record<string, unknown> | undefined;
  for (const key of ['title', 'name', 'label'] as const) {
    if (info) {
      const v = info[key];
      if (typeof v === 'string' && v.trim()) return v;
      if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
    }
    const v = rec[key];
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return '';
}

function descriptionFromRecord(rec: Record<string, unknown> | null | undefined): string {
  if (!rec) return '';
  const info = rec.information as Record<string, unknown> | undefined;
  for (const key of ['description', 'summary'] as const) {
    if (info) {
      const v = info[key];
      if (typeof v === 'string' && v.trim()) return v;
    }
    const v = rec[key];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}

function seedForm() {
  initialValues.value = {
    title: titleFromRecord(props.record ?? null),
    description: descriptionFromRecord(props.record ?? null),
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

async function onSubmit(values: { title?: string; description?: string }) {
  const title = String(values.title ?? '').trim();
  const description = String(values.description ?? '').trim();
  saving.value = true;
  try {
    let result;
    if (isEdit.value && props.record) {
      const slug = String(props.record.slug ?? '');
      const data = props.type === 'metric'
        ? { information: { title, description } }
        : { title, description };
      result = await grcRepo.governanceUpdate(slug, data);
    } else {
      const data = props.type === 'metric'
        ? { type: props.type, information: { title, description } }
        : { type: props.type, title, description };
      result = await grcRepo.governanceCreate(data);
    }

    if (result?.result) {
      toast(
        isEdit.value
          ? t('governance-page.edit-success', { entity: entityLabel.value })
          : t('governance-page.add-success', { entity: entityLabel.value }),
        { type: 'success' }
      );
      emit('success');
      close();
    } else {
      toast(
        String(
          result?.error ??
            (isEdit.value
              ? t('governance-page.edit-error', { entity: entityLabel.value })
              : t('governance-page.add-error', { entity: entityLabel.value }))
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error
        ? e.message
        : isEdit.value
          ? t('governance-page.edit-error', { entity: entityLabel.value })
          : t('governance-page.add-error', { entity: entityLabel.value }),
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
      :id="`governance-${entityName}-form`"
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
          :label="t('governance-page.col-title')"
          type="text"
          required
          autofocus
        />
        <BaseInput
          name="description"
          :label="t('governance-page.col-description')"
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
          :form="`governance-${entityName}-form`"
          :disabled="saving"
        >
          {{ isEdit ? t('rule.form-edit-submit') : t('rule.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
