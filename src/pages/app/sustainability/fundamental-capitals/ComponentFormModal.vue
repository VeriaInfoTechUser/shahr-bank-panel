<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import { grcRepo } from '@/core/repositories/grcRepo';

interface ParentData {
  slug: string;
  title: string;
  capitalSlug?: string;
  capitalTitle?: string;
  capitalType?: string;
  domainSlug?: string;
  domainTitle?: string;
}

const props = withDefaults(
  defineProps<{
    show: boolean;
    record?: Record<string, unknown> | null;
    parentData?: ParentData | null;
  }>(),
  {
    record: null,
    parentData: null,
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
    ? t('sustainability-component-page.edit')
    : t('sustainability-component-page.add');
});

const templateOptions = [
  { value: 'GOV', label: 'Governance (GOV)' },
  { value: 'OPS', label: 'Operations (OPS)' },
  { value: 'RISK', label: 'Risk (RISK)' },
  { value: 'PERF', label: 'Performance (PERF)' },
  { value: 'LEARN', label: 'Learning (LEARN)' },
];

const initialValues = ref({
  slug: '',
  title: '',
  titleEn: '',
  version: '',
  template: '',
  industries: [] as string[],
  description: '',
  definitionEN: '',
});

const validationSchema = computed(() =>
  yup.object({
    slug: yup
      .string()
      .trim()
      .required(t('sustainability-component-page.validation-slug'))
      .matches(/^[A-Za-z][A-Za-z0-9]*(-[A-Za-z0-9]+)*$/, t('sustainability-component-page.validation-slug-pattern')),
    title: yup
      .string()
      .trim()
      .required(t('sustainability-component-page.validation-title')),
    titleEn: yup.string().trim().optional(),
    version: yup.string().trim().optional(),
    template: yup.string().trim().optional(),
    industries: yup.array().optional(),
    description: yup.string().trim().optional(),
    definitionEN: yup.string().trim().optional(),
  })
);

function seedForm() {
  const rec = props.record;
  initialValues.value = {
    slug: rec ? String(rec.slug ?? '') : '',
    title: rec ? String(rec.title ?? '') : '',
    titleEn: rec ? String(rec.titleEn ?? '') : '',
    version: rec ? String(rec.version ?? '') : '',
    template: rec ? String(rec.template ?? '') : '',
    industries: rec && Array.isArray(rec.industries) ? (rec.industries as string[]) : [],
    description: rec ? String(rec.description ?? '') : '',
    definitionEN: rec ? String(rec.definitionEN ?? '') : '',
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
  const template = String(values.template ?? '').trim();
  const industries = Array.isArray(values.industries) ? values.industries : [];
  const description = String(values.description ?? '').trim();
  const definitionEN = String(values.definitionEN ?? '').trim();

  const parentData = props.parentData;

  saving.value = true;
  try {
    let result;
    if (isEdit.value && props.record) {
      const recordSlug = String(props.record.slug ?? '');
      result = await grcRepo.componentUpdate(recordSlug, {
        title,
        titleEn,
        version,
        template,
        industries,
        description,
        definitionEN,
      });
    } else {
      result = await grcRepo.componentCreate({
        slug,
        title,
        titleEn,
        version,
        template,
        industries,
        description,
        definitionEN,
        domainSlug: parentData?.domainSlug ?? parentData?.slug ?? '',
        capitalSlug: parentData?.capitalSlug ?? '',
        capitalType: parentData?.capitalType ?? '',
        parentSlug: parentData?.domainSlug ?? parentData?.slug ?? '',
        parentTitle: parentData?.domainTitle ?? parentData?.title ?? '',
        parentSource: 'domain',
        status: 1,
      });
    }

    if (result?.result) {
      toast(
        isEdit.value
          ? t('sustainability-component-page.edit-success')
          : t('sustainability-component-page.add-success'),
        { type: 'success' }
      );
      emit('success');
      close();
    } else {
      toast(
        String(
          result?.error ??
            (isEdit.value
              ? t('sustainability-component-page.edit-error')
              : t('sustainability-component-page.add-error'))
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error
        ? e.message
        : isEdit.value
          ? t('sustainability-component-page.edit-error')
          : t('sustainability-component-page.add-error'),
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
      id="component-form"
      :key="formKey"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-4"
      @submit="onSubmit"
    >
      <div>
        <div
          v-if="parentData"
          class="mb-3 flex flex-col gap-1 rounded-lg bg-primary/5 px-3 py-2 dark:bg-primary/10"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 dark:text-slate-400">
              {{ t('sustainability-component-page.domain') }}:
            </span>
            <span class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ parentData.domainTitle || parentData.title }}</span>
          </div>
          <div v-if="parentData.capitalTitle" class="flex items-center gap-2">
            <span class="text-xs text-slate-500 dark:text-slate-400">
              {{ t('sustainability-component-page.capital') }}:
            </span>
            <span class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ parentData.capitalTitle }}</span>
          </div>
        </div>
        <BaseInput
          name="slug"
          :label="t('sustainability-component-page.col-slug')"
          type="text"
          required
          :disabled="isEdit"
          autofocus
        />
        <BaseInput
          name="title"
          :label="t('sustainability-component-page.col-title')"
          type="text"
          required
        />
        <BaseInput
          name="titleEn"
          :label="t('sustainability-component-page.col-title-en')"
          type="text"
        />
        <div class="grid grid-cols-2 gap-3">
          <BaseInput
            name="version"
            :label="t('sustainability-component-page.col-version')"
            type="text"
          />
          <BaseSelect
            name="template"
            :label="t('sustainability-component-page.col-template')"
            :options="templateOptions"
            placeholder=""
            filter
          />
        </div>
        <BaseInput
          name="definitionEN"
          :label="t('sustainability-component-page.col-definition-en')"
          type="textarea"
        />
        <BaseInput
          name="description"
          :label="t('sustainability-component-page.col-description')"
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
          form="component-form"
          :disabled="saving"
        >
          {{ isEdit ? t('rule.form-edit-submit') : t('rule.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
