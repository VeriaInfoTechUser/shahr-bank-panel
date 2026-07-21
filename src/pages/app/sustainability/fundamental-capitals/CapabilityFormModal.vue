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
  domainSlug?: string;
  domainTitle?: string;
  capitalSlug?: string;
  capitalTitle?: string;
  capitalType?: string;
  componentSlug?: string;
  componentTitle?: string;
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
    ? t('sustainability-capability-page.edit')
    : t('sustainability-capability-page.add');
});

const templateOptions = [
  { value: 'GOVERN', label: 'Govern (GOVERN)' },
  { value: 'OPERATE', label: 'Operate (OPERATE)' },
  { value: 'IMPROVE', label: 'Improve (IMPROVE)' },
  { value: 'MONITOR', label: 'Monitor (MONITOR)' },
];

const importanceOptions = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const maturityOptions = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
];

const initialValues = ref({
  slug: '',
  title: '',
  titleEn: '',
  version: '',
  template: '',
  importance: '',
  requiredMaturity: '',
  industries: [] as string[],
  description: '',
  outcomeEN: '',
  ownerRole: '',
});

const validationSchema = computed(() =>
  yup.object({
    slug: yup
      .string()
      .trim()
      .required(t('sustainability-capability-page.validation-slug'))
      .matches(/^[A-Za-z][A-Za-z0-9]*(-[A-Za-z0-9]+)*$/, t('sustainability-capability-page.validation-slug-pattern')),
    title: yup
      .string()
      .trim()
      .required(t('sustainability-capability-page.validation-title')),
    titleEn: yup.string().trim().optional(),
    version: yup.string().trim().optional(),
    template: yup.string().trim().optional(),
    importance: yup.string().trim().optional(),
    requiredMaturity: yup.string().trim().optional(),
    industries: yup.array().optional(),
    description: yup.string().trim().optional(),
    outcomeEN: yup.string().trim().optional(),
    ownerRole: yup.string().trim().optional(),
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
    importance: rec ? String(rec.importance ?? '') : '',
    requiredMaturity: rec ? String(rec.requiredMaturity ?? '') : '',
    industries: rec && Array.isArray(rec.industries) ? (rec.industries as string[]) : [],
    description: rec ? String(rec.description ?? '') : '',
    outcomeEN: rec ? String(rec.outcomeEN ?? '') : '',
    ownerRole: rec ? String(rec.ownerRole ?? '') : '',
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
  const importance = String(values.importance ?? '').trim();
  const requiredMaturity = values.requiredMaturity ? Number(values.requiredMaturity) : undefined;
  const industries = Array.isArray(values.industries) ? values.industries : [];
  const description = String(values.description ?? '').trim();
  const outcomeEN = String(values.outcomeEN ?? '').trim();
  const ownerRole = String(values.ownerRole ?? '').trim();

  const parentData = props.parentData;

  saving.value = true;
  try {
    let result;
    if (isEdit.value && props.record) {
      const recordSlug = String(props.record.slug ?? '');
      result = await grcRepo.capabilityUpdate(recordSlug, {
        title,
        titleEn,
        version,
        template,
        importance,
        requiredMaturity,
        industries,
        description,
        outcomeEN,
        ownerRole,
      });
    } else {
      result = await grcRepo.capabilityCreate({
        slug,
        title,
        titleEn,
        version,
        template,
        importance,
        requiredMaturity,
        industries,
        description,
        outcomeEN,
        ownerRole,
        componentSlug: parentData?.componentSlug ?? parentData?.slug ?? '',
        domainSlug: parentData?.domainSlug ?? '',
        capitalSlug: parentData?.capitalSlug ?? '',
        capitalType: parentData?.capitalType ?? '',
        parentSlug: parentData?.componentSlug ?? parentData?.slug ?? '',
        parentTitle: parentData?.componentTitle ?? parentData?.title ?? '',
        parentSource: 'component',
        status: 1,
      });
    }

    if (result?.result) {
      toast(
        isEdit.value
          ? t('sustainability-capability-page.edit-success')
          : t('sustainability-capability-page.add-success'),
        { type: 'success' }
      );
      emit('success');
      close();
    } else {
      toast(
        String(
          result?.error ??
            (isEdit.value
              ? t('sustainability-capability-page.edit-error')
              : t('sustainability-capability-page.add-error'))
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error
        ? e.message
        : isEdit.value
          ? t('sustainability-capability-page.edit-error')
          : t('sustainability-capability-page.add-error'),
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
    size="md"
    @update:visible="onDialogVisible"
  >
    <Form
      id="capability-form"
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
              {{ t('sustainability-capability-page.component') }}:
            </span>
            <span class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ parentData.componentTitle || parentData.title }}</span>
          </div>
          <div v-if="parentData.domainTitle" class="flex items-center gap-2">
            <span class="text-xs text-slate-500 dark:text-slate-400">
              {{ t('sustainability-capability-page.domain') }}:
            </span>
            <span class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ parentData.domainTitle }}</span>
          </div>
          <div v-if="parentData.capitalTitle" class="flex items-center gap-2">
            <span class="text-xs text-slate-500 dark:text-slate-400">
              {{ t('sustainability-capability-page.capital') }}:
            </span>
            <span class="text-xs font-medium text-slate-700 dark:text-slate-300">{{ parentData.capitalTitle }}</span>
          </div>
        </div>
        <BaseInput
          name="slug"
          :label="t('sustainability-capability-page.col-slug')"
          type="text"
          required
          :disabled="isEdit"
          autofocus
        />
        <BaseInput
          name="title"
          :label="t('sustainability-capability-page.col-title')"
          type="text"
          required
        />
        <BaseInput
          name="titleEn"
          :label="t('sustainability-capability-page.col-title-en')"
          type="text"
        />
        <div class="grid grid-cols-3 gap-3">
          <BaseInput
            name="version"
            :label="t('sustainability-capability-page.col-version')"
            type="text"
          />
          <BaseSelect
            name="template"
            :label="t('sustainability-capability-page.col-template')"
            :options="templateOptions"
            placeholder=""
            filter
          />
          <BaseSelect
            name="importance"
            :label="t('sustainability-capability-page.col-importance')"
            :options="importanceOptions"
            placeholder=""
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <BaseSelect
            name="requiredMaturity"
            :label="t('sustainability-capability-page.col-required-maturity')"
            :options="maturityOptions"
            placeholder=""
          />
          <BaseInput
            name="ownerRole"
            :label="t('sustainability-capability-page.col-owner-role')"
            type="text"
          />
        </div>
        <BaseInput
          name="outcomeEN"
          :label="t('sustainability-capability-page.col-outcome-en')"
          type="textarea"
        />
        <BaseInput
          name="description"
          :label="t('sustainability-capability-page.col-description')"
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
          form="capability-form"
          :disabled="saving"
        >
          {{ isEdit ? t('rule.form-edit-submit') : t('rule.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
