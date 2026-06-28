<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import { grcRepo, type GrcEntity } from '@/core/repositories/grcRepo';

const props = withDefaults(
  defineProps<{
    show: boolean;
    mode?: 'add' | 'edit';
    job?: Record<string, unknown> | null;
    defaultCalculationLevel?: string;
  }>(),
  {
    mode: 'add',
    job: null,
    defaultCalculationLevel: '',
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

const metrics = ref<GrcEntity[]>([]);
const assets = ref<GrcEntity[]>([]);
const loadingAssets = ref(false);
const selectedMetricSlug = ref('');

const isPrimary = computed(() => props.defaultCalculationLevel === 'PRIMARY');

const metricOptions = computed(() =>
  metrics.value.map((m) => ({ value: m.slug, label: m.title ?? m.slug }))
);
const assetOptions = computed(() =>
  assets.value.map((a) => ({ value: a.slug, label: a.title ?? a.slug }))
);

const typeOptions = [
  { value: 'CALCULATE', label: t('job.type-calculate') },
  { value: 'RECALCULATE', label: t('job.type-recalculate') },
  { value: 'UPDATE', label: t('job.type-update') },
  { value: 'TEST', label: t('job.type-test') },
];

const calculationLevelOptions = [
  { value: 'PRIMARY', label: t('job.level-primary') },
  { value: 'SECONDARY', label: t('job.level-secondary') },
];

const statusOptions = [
  { value: 'TO_DO', label: t('job.status-to-do') },
  { value: 'IN_PROGRESS', label: t('job.status-in-progress') },
  { value: 'DONE', label: t('job.status-done') },
  { value: 'FAILED', label: t('job.status-failed') },
  { value: 'CANCELLED', label: t('job.status-cancelled') },
];

const persistentOptions = [
  { value: 'true', label: t('general.yes') },
  { value: 'false', label: t('general.no') },
];

const initialValues = ref({
  metric_slug: '',
  asset_slug: '',
  date_start: '',
  type: '',
  is_persistent: 'true',
  calculation_level: '',
  status: 'TO_DO',
});

const validationSchema = computed(() =>
  yup.object({
    metric_slug: isPrimary.value
      ? yup.string().trim().optional()
      : yup.string().trim().required(t('validation.required')),
    asset_slug: yup.string().trim().optional(),
    date_start: isPrimary.value
      ? yup.string().trim().required(t('validation.required'))
      : yup.string().trim().optional(),
    type: yup.string().trim().required(t('validation.required')),
    calculation_level: yup.string().trim().required(t('validation.required')),
    status: yup.string().trim().optional(),
  })
);

async function loadMetrics() {
  try {
    const res = await grcRepo.metricsList({ limit: 1000 });
    if (res?.result && res.data?.list) {
      metrics.value = res.data.list;
    }
  } catch {
    // silent
  }
}

async function loadAllAssets() {
  loadingAssets.value = true;
  try {
    const res = await grcRepo.assetsList({ limit: 1000 });
    if (res?.result && res.data?.list) {
      assets.value = res.data.list;
    } else {
      assets.value = [];
    }
  } catch {
    assets.value = [];
  } finally {
    loadingAssets.value = false;
  }
}

async function loadAssetsByMetric(metricSlug: string) {
  if (!metricSlug) {
    assets.value = [];
    return;
  }
  loadingAssets.value = true;
  try {
    const res = await grcRepo.metricAssetsList(metricSlug, { limit: 1000 });
    if (res?.result && res.data?.list) {
      assets.value = res.data.list;
    } else {
      assets.value = [];
    }
  } catch {
    assets.value = [];
  } finally {
    loadingAssets.value = false;
  }
}

watch(selectedMetricSlug, async (newSlug, oldSlug) => {
  if (newSlug === oldSlug) return;
  const currentAsset = initialValues.value.asset_slug;
  await loadAssetsByMetric(newSlug);
  if (currentAsset && !assets.value.find((a) => a.slug === currentAsset)) {
    initialValues.value.asset_slug = '';
  }
});

watch(
  () => [props.show, props.mode, props.job] as const,
  async ([show, mode, j]) => {
    if (!show) return;

    if (isPrimary.value) {
      await loadAllAssets();
    } else {
      await loadMetrics();
    }

    if (mode === 'edit' && j) {
      const metricSlug = (j.metric_slug as string) ?? '';
      selectedMetricSlug.value = metricSlug;
      if (!isPrimary.value && metricSlug) await loadAssetsByMetric(metricSlug);
      initialValues.value = {
        metric_slug: metricSlug,
        asset_slug: (j.asset_slug as string) ?? '',
        date_start: (j.date_start as string) ?? '',
        type: (j.type as string) ?? '',
        is_persistent: String(j.is_persistent ?? true),
        calculation_level: (j.calculation_level as string) ?? '',
        status: (j.status as string) ?? 'TO_DO',
      };
    } else {
      selectedMetricSlug.value = '';
      if (!isPrimary.value) assets.value = [];
      initialValues.value = {
        metric_slug: '',
        asset_slug: '',
        date_start: '',
        type: '',
        is_persistent: 'true',
        calculation_level: props.defaultCalculationLevel || '',
        status: 'TO_DO',
      };
    }
    formKey.value += 1;
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

function onMetricChanged(value: unknown) {
  selectedMetricSlug.value = String(value ?? '');
}

async function onSubmit(values: Record<string, unknown>) {
  saving.value = true;
  try {
    const payload: Record<string, unknown> = {
      type: String(values.type ?? ''),
      is_persistent: values.is_persistent === 'true',
      calculation_level: String(values.calculation_level ?? ''),
    };

    if (!isPrimary.value && values.metric_slug) payload.metric_slug = String(values.metric_slug);
    if (values.asset_slug) payload.asset_slug = String(values.asset_slug);
    if (values.date_start) payload.date_start = String(values.date_start);
    if (values.status) payload.status = String(values.status);

    if (props.mode === 'edit' && props.job) {
      const id = String(props.job.id ?? '');
      const res = await grcRepo.calculationJobUpdate(id, payload);
      if (res?.result) {
        toast(t('job.edit-success'), { type: 'success' });
        emit('success');
        close();
      } else {
        toast(res?.error?.[0] ?? t('job.edit-error'), { type: 'error' });
      }
    } else {
      const res = await grcRepo.calculationJobCreate(payload);
      if (res?.result) {
        toast(t('job.add-success'), { type: 'success' });
        emit('success');
        close();
      } else {
        toast(res?.error?.[0] ?? t('job.add-error'), { type: 'error' });
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('general.error');
    toast(message, { type: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="props.mode === 'edit' ? t('job.edit') : t('job.add')"
    @update:visible="onDialogVisible"
  >
    <Form
      :key="formKey"
      id="add-job-modal-form"
      ref="formRef"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-3"
      @submit="onSubmit"
    >
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
        <BaseSelect
          v-if="!isPrimary"
          name="metric_slug"
          :label="t('job.metric-slug')"
          :options="metricOptions"
          :placeholder="t('job.metric-slug-placeholder')"
          :required="true"
          :filter="true"
          @change="onMetricChanged"
        />
        <BaseSelect
          name="asset_slug"
          :label="t('job.asset-slug')"
          :options="assetOptions"
          :placeholder="loadingAssets ? t('general.loading') : t('job.asset-slug-placeholder')"
          :filter="true"
          :disabled="!isPrimary && !selectedMetricSlug"
        />
        <BaseInput
          v-if="isPrimary"
          name="date_start"
          :label="t('job.date-start')"
          type="datetime-local"
          :required="true"
        />
        <BaseSelect
          name="type"
          :label="t('job.type')"
          :options="typeOptions"
          :required="true"
        />
        <div>
          <BaseSelect
            name="is_persistent"
            :label="t('job.is-persistent')"
            :options="persistentOptions"
          />
          <p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {{ t('job.is-persistent-hint') }}
          </p>
        </div>
        <BaseSelect
          name="calculation_level"
          :label="t('job.calculation-level')"
          :options="calculationLevelOptions"
          :required="true"
        />
        <BaseSelect
          name="status"
          :label="t('job.status')"
          :options="statusOptions"
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
          {{ t('general.cancel') }}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          form="add-job-modal-form"
          :disabled="saving"
        >
          {{ props.mode === 'edit' ? t('title.update') : t('title.register') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
