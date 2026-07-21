<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { grcRepo } from '@/core/repositories/grcRepo';

const props = withDefaults(
  defineProps<{
    show: boolean;
    record?: Record<string, unknown> | null;
    parentSlug?: string | null;
    parentTitle?: string | null;
  }>(),
  {
    record: null,
    parentSlug: null,
    parentTitle: null,
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
  if (isEdit.value) return t('capital-structure-page.edit');
  if (props.parentSlug) return t('capital-structure-page.add-child');
  return t('capital-structure-page.add-root');
});

const initialValues = ref({ title: '', description: '', number: '' });

const validationSchema = computed(() =>
  yup.object({
    title: yup
      .string()
      .trim()
      .required(t('capital-structure-page.validation-title')),
    description: yup.string().trim().optional(),
    number: yup.string().trim().optional(),
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
  if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  return '';
}

function seedForm() {
  initialValues.value = {
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

async function onSubmit(values: { title?: string; description?: string; number?: string }) {
  const title = String(values.title ?? '').trim();
  const description = String(values.description ?? '').trim();
  const number = String(values.number ?? '').trim();
  saving.value = true;
  try {
    let result;
    if (isEdit.value && props.record) {
      const slug = String(props.record.slug ?? '');
      result = await grcRepo.capitalUpdate(slug, { title, description, number });
    } else {
      const data: Record<string, unknown> = { title, description, number, status: 1 };
      if (props.parentSlug) {
        data.parentSlug = props.parentSlug;
      }
      result = await grcRepo.capitalCreate(data);
    }

    if (result?.result) {
      toast(
        isEdit.value
          ? t('capital-structure-page.edit-success')
          : t('capital-structure-page.add-success'),
        { type: 'success' }
      );
      emit('success');
      close();
    } else {
      toast(
        String(
          result?.error ??
            (isEdit.value
              ? t('capital-structure-page.edit-error')
              : t('capital-structure-page.add-error'))
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error
        ? e.message
        : isEdit.value
          ? t('capital-structure-page.edit-error')
          : t('capital-structure-page.add-error'),
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
      id="structure-form"
      :key="formKey"
      ref="formRef"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-4"
      @submit="onSubmit"
    >
      <div data-autofocus-modal>
        <div
          v-if="parentTitle"
          class="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 dark:bg-primary/10"
        >
          <Lucide icon="GitBranch" class="h-4 w-4 shrink-0 text-primary/60" />
          <span class="text-xs text-slate-500 dark:text-slate-400">
            {{ t('capital-structure-page.parent-label') }}:
          </span>
          <span class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ parentTitle }}</span>
        </div>
        <BaseInput
          name="title"
          :label="t('capital-structure-page.col-title')"
          type="text"
          required
          autofocus
        />
        <BaseInput
          name="number"
          :label="t('capital-structure-page.col-number')"
          type="text"
        />
        <BaseInput
          name="description"
          :label="t('capital-structure-page.col-description')"
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
          form="structure-form"
          :disabled="saving"
        >
          {{ isEdit ? t('rule.form-edit-submit') : t('rule.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
