<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import { grcRepo, type GrcEntity } from '@/core/repositories/grcRepo';
import BaseDatePicker from '@/core/ui/base/BaseDatePicker.vue';

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

const initialValues = ref({
  asset_slug: '',
  metric_slug: '',
  calculation_level: '',
  date: '',
});

const validationSchema = computed(() =>
  yup.object({
    asset_slug: isPrimary.value
      ? yup.string().trim().required(t('validation.required'))
      : yup.string().trim().optional(),
    metric_slug: !isPrimary.value
      ? yup.string().trim().required(t('validation.required'))
      : yup.string().trim().optional(),
    calculation_level: yup.string().trim().required(t('validation.required')),
    date: yup.string().trim().required(t('validation.required')),
  })
);

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
      initialValues.value = {
        asset_slug: (j.asset_slug as string) ?? '',
        metric_slug: (j.metric_slug as string) ?? '',
        calculation_level: (j.calculation_level as string) ?? '',
        date: (j.date as string) ?? '',
      };
      selectedMetricSlug.value = (j.metric_slug as string) ?? '';
    } else {
      initialValues.value = {
        asset_slug: '',
        metric_slug: '',
        calculation_level: props.defaultCalculationLevel || '',
        date: '',
      };
      selectedMetricSlug.value = '';
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
      calculation_level: String(values.calculation_level ?? ''),
    };

    if (isPrimary.value) {
      if (values.asset_slug) payload.asset_slug = String(values.asset_slug);
    } else {
      if (values.metric_slug) payload.metric_slug = String(values.metric_slug);
    }

    if (values.date) {
      payload.date = String(values.date);
    }

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
    size="sm"
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
      <!-- Primary: asset dropdown + date -->
      <div v-if="isPrimary" class="space-y-3">
        <BaseSelect
          name="asset_slug"
          :label="t('job.asset-slug')"
          :options="assetOptions"
          :placeholder="loadingAssets ? t('general.loading') : t('job.asset-slug-placeholder')"
          :required="true"
          :filter="true"
        />
        <BaseDatePicker
          name="date"
          :label="t('job.date')"
          :required="true"
        />
      </div>

      <!-- Secondary: metric select + date -->
      <div v-else class="space-y-3">
        <BaseSelect
          name="metric_slug"
          :label="t('job.metric-slug')"
          :options="metricOptions"
          :placeholder="t('job.metric-slug-placeholder')"
          :required="true"
          :filter="true"
          @change="onMetricChanged"
        />
        <BaseDatePicker
          name="date"
          :label="t('job.date')"
          :required="true"
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
