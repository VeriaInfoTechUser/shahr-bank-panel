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

interface CapitalData {
  slug: string;
  title: string;
  capitalType?: string;
  parentSlug?: string;
  parentTitle?: string;
}

const props = withDefaults(
  defineProps<{
    show: boolean;
    record?: Record<string, unknown> | null;
    capitalData?: CapitalData | null;
  }>(),
  {
    record: null,
    capitalData: null,
  }
);

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();

const saving = ref(false);
const formKey = ref(0);

const isEdit = computed(() => {
  const r = props.record;
  if (!r || typeof r !== 'object') return false;
  return r.slug != null && r.slug !== '';
});

const modalTitle = computed(() => {
  return isEdit.value
    ? t('sustainability-domain-page.edit')
    : t('sustainability-domain-page.add');
});

const initialValues = ref({
  slug: '',
  title: '',
  titleEn: '',
  version: '',
  order: '',
  industries: [] as string[],
  description: '',
});

const validationSchema = computed(() =>
  yup.object({
    slug: yup
      .string()
      .trim()
      .required(t('sustainability-domain-page.validation-slug'))
      .matches(/^[A-Za-z][A-Za-z0-9]*(-[A-Za-z0-9]+)*$/, t('sustainability-domain-page.validation-slug-pattern')),
    title: yup
      .string()
      .trim()
      .required(t('sustainability-domain-page.validation-title')),
    titleEn: yup.string().trim().optional(),
    version: yup.string().trim().optional(),
    order: yup.string().trim().optional(),
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
    version: rec ? String(rec.version ?? '') : '',
    order: rec ? String(rec.order ?? '') : '',
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
  const version = String(values.version ?? '').trim();
  const order = values.order ? Number(values.order) : undefined;
  const industries = Array.isArray(values.industries) ? values.industries : [];
  const description = String(values.description ?? '').trim();

  const capitalData = props.capitalData;

  saving.value = true;
  try {
    let result;
    if (isEdit.value && props.record) {
      const recordSlug = String(props.record.slug ?? '');
      result = await grcRepo.domainUpdate(recordSlug, {
        title,
        titleEn,
        version,
        order,
        industries,
        description,
      });
    } else {
      result = await grcRepo.domainCreate({
        slug,
        title,
        titleEn,
        version,
        order,
        industries,
        description,
        capitalSlug: capitalData?.slug ?? '',
        capitalType: capitalData?.capitalType ?? '',
        parentSlug: capitalData?.parentSlug ?? capitalData?.slug ?? '',
        parentTitle: capitalData?.parentTitle ?? capitalData?.title ?? '',
        parentSource: 'capital',
        status: 1,
      });
    }

    if (result?.result) {
      toast(
        isEdit.value
          ? t('sustainability-domain-page.edit-success')
          : t('sustainability-domain-page.add-success'),
        { type: 'success' }
      );
      emit('success');
      close();
    } else {
      toast(
        String(
          result?.error ??
            (isEdit.value
              ? t('sustainability-domain-page.edit-error')
              : t('sustainability-domain-page.add-error'))
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error
        ? e.message
        : isEdit.value
          ? t('sustainability-domain-page.edit-error')
          : t('sustainability-domain-page.add-error'),
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
      id="domain-form"
      :key="formKey"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-4"
      @submit="onSubmit"
    >
      <div>
        <div
          v-if="capitalData"
          class="mb-3 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 dark:bg-primary/10"
        >
          <span class="text-xs text-slate-500 dark:text-slate-400">
            {{ t('sustainability-domain-page.capital') }}:
          </span>
          <span class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ capitalData.title }}</span>
        </div>
        <BaseInput
          name="slug"
          :label="t('sustainability-domain-page.col-slug')"
          type="text"
          required
          :disabled="isEdit"
          autofocus
        />
        <BaseInput
          name="title"
          :label="t('sustainability-domain-page.col-title')"
          type="text"
          required
        />
        <BaseInput
          name="titleEn"
          :label="t('sustainability-domain-page.col-title-en')"
          type="text"
        />
        <div class="grid grid-cols-2 gap-3">
          <BaseInput
            name="version"
            :label="t('sustainability-domain-page.col-version')"
            type="text"
          />
          <BaseInput
            name="order"
            :label="t('sustainability-domain-page.col-order')"
            type="number"
          />
        </div>
        <BaseInput
          name="description"
          :label="t('sustainability-domain-page.col-description')"
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
          form="domain-form"
          :disabled="saving"
        >
          {{ isEdit ? t('rule.form-edit-submit') : t('rule.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
