<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import Button from '@/base-components/Button';
import { grcRepo } from '@/core/repositories/grcRepo';
import { sourceDataSourceTypes } from '@/pages/app/sustainability/source-data-source-types';

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
const parentDataSources = ref<{ value: string; label: string }[]>([]);
const allDataSources = ref<{ value: string; label: string }[]>([]);
const metricOptions = ref<{ value: string; label: string }[]>([]);
const selectedDataSourceType = ref('');

const currentSlug = computed(() =>
  isEdit.value ? String(props.record?.slug ?? '') : ''
);

const relationOptions = computed(() =>
  currentSlug.value
    ? allDataSources.value.filter((a) => a.value !== currentSlug.value)
    : allDataSources.value
);

const isEdit = computed(() => {
  const r = props.record;
  if (!r || typeof r !== 'object') return false;
  const slug = r.slug;
  return slug != null && slug !== '';
});

const modalTitle = computed(() =>
  isEdit.value
    ? t('governance-page.edit-entity', { entity: t('menu.sustainability-data-source') })
    : t('governance-page.add-entity', { entity: t('menu.sustainability-data-source') })
);

const dataSourceTypeOptions = computed(() =>
  sourceDataSourceTypes.map((item) => ({
    value: item.slug,
    label: t(item.title),
  }))
);

const statusOptions = [
  { value: 1, label: t('data-source-page.status-active') },
  { value: 0, label: t('data-source-page.status-inactive') },
];

const initialValues = ref({
  title: '',
  dataSourceType: '',
  parentDataSourceSlug: null as string | null,
  metricSlug: null as string | null,
  description: '',
  status: 1,
  relationSlugs: [] as string[],
});

const validationSchema = computed(() =>
  yup.object({
    title: yup
      .string()
      .trim()
      .required(t('governance-page.validation-title-required')),
    dataSourceType: yup
      .string()
      .trim()
      .required(t('data-source-page.validation-data-source-type-required')),
    parentDataSourceSlug: yup.string().trim().nullable().optional(),
    metricSlug: yup.string().trim().nullable().optional(),
    description: yup.string().trim().optional(),
    status: yup.number().oneOf([0, 1]).required(),
    relationSlugs: yup.array().of(yup.string()).optional(),
  })
);

function getField(rec: Record<string, unknown>, key: string): unknown {
  if (rec[key] !== undefined) return rec[key];
  const info = rec.information as Record<string, unknown> | undefined;
  if (info && info[key] !== undefined) return info[key];
  return undefined;
}

function seedForm() {
  const rec = props.record;
  const dataSourceType = String(getField(rec ?? {}, 'dataSourceType') ?? '');
  selectedDataSourceType.value = dataSourceType;
  initialValues.value = {
    title: String(getField(rec ?? {}, 'title') ?? ''),
    dataSourceType,
    parentDataSourceSlug: (getField(rec ?? {}, 'parentDataSourceSlug') as string) ?? null,
    metricSlug: (getField(rec ?? {}, 'metricSlug') as string) ?? null,
    description: String(getField(rec ?? {}, 'description') ?? ''),
    status: Number(getField(rec ?? {}, 'status') ?? 1) as 0 | 1,
    relationSlugs: (getField(rec ?? {}, 'relationSlugs') as string[]) ?? [],
  };
  formKey.value += 1;
}

async function loadAssets() {
  try {
    const res = await grcRepo.dataSourcesList({ limit: 1000 });
    const list = res?.data?.list ?? [];
    const options = (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => ({
      value: String(item.slug ?? ''),
      label: String(item.title ?? item.name ?? ''),
    }));
    allDataSources.value = options;
    parentDataSources.value = options;
  } catch {
    allDataSources.value = [];
    parentDataSources.value = [];
  }
}

async function loadMetrics(dataSourceType?: string) {
  try {
    const params: Record<string, unknown> = { limit: 1000 };
    if (dataSourceType) params.sourceDataSourceType = dataSourceType;
    const res = await grcRepo.metricsList(params);
    const list = res?.data?.list ?? [];
    metricOptions.value = (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => ({
      value: String(item.slug ?? ''),
      label: String(item.title ?? item.name ?? ''),
    }));
  } catch {
    metricOptions.value = [];
  }
}

const metricDisabled = computed(() => !selectedDataSourceType.value);

function onAssetTypeChange(value: unknown) {
  const dataSourceType = String(value ?? '');
  selectedDataSourceType.value = dataSourceType;
  metricOptions.value = [];
  if (dataSourceType) {
    void loadMetrics(dataSourceType);
  }
}

watch(
  () => [props.show, props.record] as const,
  ([visible]) => {
    if (!visible) return;
    seedForm();
    void loadAssets();
    if (selectedDataSourceType.value) {
      void loadMetrics(selectedDataSourceType.value);
    }
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

async function onSubmit(values: {
  title?: string;
  dataSourceType?: string;
  parentDataSourceSlug?: string | null;
  metricSlug?: string | null;
  description?: string;
  status?: number;
  relationSlugs?: string[];
}) {
  const title = String(values.title ?? '').trim();
  const dataSourceType = String(values.dataSourceType ?? '').trim();
  const parentDataSourceSlug = values.parentDataSourceSlug || null;
  const metricSlug = values.metricSlug || null;
  const description = String(values.description ?? '').trim();
  const status = values.status ?? 1;
  const relationSlugs = values.relationSlugs ?? [];

  saving.value = true;
  try {
    let result;
    if (isEdit.value && props.record) {
      const slug = String(props.record.slug ?? '');
      result = await grcRepo.dataSourceUpdate(slug, {
        title,
        dataSourceType,
        parentDataSourceSlug,
        metricSlug,
        description,
        status,
        relationSlugs,
      });
    } else {
      result = await grcRepo.dataSourceCreate({
        title,
        dataSourceType,
        parentDataSourceSlug,
        metricSlug,
        description,
        status,
        relationSlugs,
      });
    }

    if (result?.result) {
      toast(
        isEdit.value
          ? t('governance-page.edit-success', { entity: t('menu.sustainability-data-source') })
          : t('governance-page.add-success', { entity: t('menu.sustainability-data-source') }),
        { type: 'success' }
      );
      emit('success');
      close();
    } else {
      toast(
        String(
          result?.error ??
            (isEdit.value
              ? t('governance-page.edit-error', { entity: t('menu.sustainability-data-source') })
              : t('governance-page.add-error', { entity: t('menu.sustainability-data-source') }))
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error
        ? e.message
        : isEdit.value
          ? t('governance-page.edit-error', { entity: t('menu.sustainability-data-source') })
          : t('governance-page.add-error', { entity: t('menu.sustainability-data-source') }),
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
      id="data-source-form"
      :key="formKey"
      ref="formRef"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="py-1"
      @submit="onSubmit"
    >
      <div data-autofocus-modal class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <BaseInput
          name="title"
          :label="t('governance-page.col-title')"
          type="text"
          required
          autofocus
        />
        <BaseSelect
          name="parentDataSourceSlug"
          :label="t('data-source-page.col-parent-data-source')"
          :options="parentDataSources"
          :filter="true"
        />
        <BaseSelect
          name="dataSourceType"
          :label="t('data-source-page.col-data-source-type')"
          :options="dataSourceTypeOptions"
          :required="true"
          :filter="true"
          @change="onAssetTypeChange"
        />
        <BaseSelect
          name="metricSlug"
          :label="t('data-source-page.col-metric')"
          :options="metricOptions"
          :filter="true"
          :disabled="metricDisabled"
        />
        <BaseSelect
          name="status"
          :label="t('data-source-page.col-status')"
          :options="statusOptions"
          :required="true"
        />
        <BaseMultiSelect
          name="relationSlugs"
          :label="t('data-source-page.col-relations')"
          :options="relationOptions"
        />
        <div class="md:col-span-2">
          <BaseInput
            name="description"
            :label="t('governance-page.col-description')"
            type="textarea"
          />
        </div>
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
          form="data-source-form"
          :disabled="saving"
        >
          {{ isEdit ? t('rule.form-edit-submit') : t('rule.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
