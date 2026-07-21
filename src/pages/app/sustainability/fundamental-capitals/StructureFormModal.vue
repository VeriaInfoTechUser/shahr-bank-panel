<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
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
  if (isEdit.value) return t('sustainability-fundamental-capitals-page.edit');
  if (props.parentSlug) return t('sustainability-fundamental-capitals-page.add-child');
  return t('sustainability-fundamental-capitals-page.add-root');
});

const capitalTypeOptions = [
  { value: 'NAT', label: 'Natural (NAT)' },
  { value: 'HUM', label: 'Human (HUM)' },
  { value: 'SOC', label: 'Social (SOC)' },
  { value: 'INS', label: 'Institutional (INS)' },
  { value: 'TEC', label: 'Technological (TEC)' },
  { value: 'FEC', label: 'Financial & Economic (FEC)' },
];

const initialValues = ref({
  slug: '',
  title: '',
  titleEn: '',
  capitalType: '',
  industries: [] as string[],
  description: '',
});

const validationSchema = computed(() =>
  yup.object({
    slug: yup
      .string()
      .trim()
      .required(t('sustainability-fundamental-capitals-page.validation-slug'))
      .matches(/^[A-Za-z][A-Za-z0-9]*(-[A-Za-z0-9]+)*$/, t('sustainability-fundamental-capitals-page.validation-slug-pattern')),
    title: yup
      .string()
      .trim()
      .required(t('sustainability-fundamental-capitals-page.validation-title')),
    titleEn: yup.string().trim().optional(),
    capitalType: yup.string().trim().optional(),
    industries: yup.array().optional(),
    description: yup.string().trim().optional(),
  })
);

function seedForm() {
  const rec = props.record;
  initialValues.value = {
    slug: rec ? String(rec.slug ?? '') : '',
    title: rec ? String(rec.title ?? '') : '',
    titleEn: rec ? String(rec.titleEn ?? '') : '',
    capitalType: rec ? String(rec.capitalType ?? '') : '',
    industries: rec && Array.isArray(rec.industries) ? (rec.industries as string[]) : [],
    description: rec ? String(rec.description ?? '') : '',
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

async function onSubmit(values: Record<string, unknown>) {
  const slug = String(values.slug ?? '').trim();
  const title = String(values.title ?? '').trim();
  const titleEn = String(values.titleEn ?? '').trim();
  const capitalType = String(values.capitalType ?? '').trim();
  const industries = Array.isArray(values.industries) ? values.industries : [];
  const description = String(values.description ?? '').trim();

  saving.value = true;
  try {
    let result;
    if (isEdit.value && props.record) {
      const recordSlug = String(props.record.slug ?? '');
      result = await grcRepo.capitalUpdate(recordSlug, {
        title,
        titleEn,
        capitalType,
        industries,
        description,
      });
    } else {
      const data: Record<string, unknown> = {
        slug,
        title,
        titleEn,
        capitalType,
        industries,
        description,
        status: 1,
      };
      if (props.parentSlug) {
        data.parentSlug = props.parentSlug;
      }
      result = await grcRepo.capitalCreate(data);
    }

    if (result?.result) {
      toast(
        isEdit.value
          ? t('sustainability-fundamental-capitals-page.edit-success')
          : t('sustainability-fundamental-capitals-page.add-success'),
        { type: 'success' }
      );
      emit('success');
      close();
    } else {
      toast(
        String(
          result?.error ??
            (isEdit.value
              ? t('sustainability-fundamental-capitals-page.edit-error')
              : t('sustainability-fundamental-capitals-page.add-error'))
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error
        ? e.message
        : isEdit.value
          ? t('sustainability-fundamental-capitals-page.edit-error')
          : t('sustainability-fundamental-capitals-page.add-error'),
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
      id="fundamental-capitals-form"
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
            {{ t('sustainability-fundamental-capitals-page.parent-label') }}:
          </span>
          <span class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ parentTitle }}</span>
        </div>
        <BaseInput
          name="slug"
          :label="t('sustainability-fundamental-capitals-page.col-slug')"
          type="text"
          required
          :disabled="isEdit"
          autofocus
        />
        <BaseInput
          name="title"
          :label="t('sustainability-fundamental-capitals-page.col-title')"
          type="text"
          required
        />
        <BaseInput
          name="titleEn"
          :label="t('sustainability-fundamental-capitals-page.col-title-en')"
          type="text"
        />
        <BaseSelect
          name="capitalType"
          :label="t('sustainability-fundamental-capitals-page.col-capital-type')"
          :options="capitalTypeOptions"
          placeholder=""
          filter
        />
        <BaseInput
          name="description"
          :label="t('sustainability-fundamental-capitals-page.col-description')"
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
          form="fundamental-capitals-form"
          :disabled="saving"
        >
          {{ isEdit ? t('rule.form-edit-submit') : t('rule.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
