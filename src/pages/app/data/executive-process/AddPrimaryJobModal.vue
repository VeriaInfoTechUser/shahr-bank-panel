<script setup lang="ts">
import { ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import { grcRepo, type GrcEntity } from '@/core/repositories/grcRepo';
import BaseDateRangePicker from '@/core/ui/base/BaseDateRangePicker.vue';

const props = withDefaults(
  defineProps<{
    show: boolean;
    mode?: 'add' | 'edit';
    job?: Record<string, unknown> | null;
  }>(),
  {
    mode: 'add',
    job: null,
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

const assets = ref<GrcEntity[]>([]);
const loadingAssets = ref(false);

const assetOptions = ref<{ value: string; label: string }[]>([]);

const initialValues = ref({
  asset_slug: '',
  date_from: '',
  date_to: '',
});

const validationSchema = yup.object({
  asset_slug: yup.string().trim().required(t('validation.required')),
  date_from: yup.string().trim().required(t('validation.required')),
  date_to: yup.string().trim().required(t('validation.required')),
});

async function loadAllAssets() {
  loadingAssets.value = true;
  try {
    const res = await grcRepo.assetsList({ limit: 1000 });
    if (res?.result && res.data?.list) {
      assets.value = res.data.list;
      assetOptions.value = assets.value.map((a) => ({ value: a.slug, label: a.title ?? a.slug }));
    } else {
      assets.value = [];
      assetOptions.value = [];
    }
  } catch {
    assets.value = [];
    assetOptions.value = [];
  } finally {
    loadingAssets.value = false;
  }
}

watch(
  () => [props.show, props.mode, props.job] as const,
  async ([show, mode, j]) => {
    if (!show) return;

    await loadAllAssets();

    if (mode === 'edit' && j) {
      initialValues.value = {
        asset_slug: (j.asset_slug as string) ?? '',
        date_from: (j.date_from as string) ?? '',
        date_to: (j.date_to as string) ?? '',
      };
    } else {
      initialValues.value = {
        asset_slug: '',
        date_from: '',
        date_to: '',
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

async function onSubmit(values: Record<string, unknown>) {
  saving.value = true;
  try {
    const selectedAsset = assets.value.find((a) => a.slug === values.asset_slug);
    const payload: Record<string, unknown> = {
      calculation_level: 'ASSET',
    };

    if (values.asset_slug) payload.asset_slug = String(values.asset_slug);
    if (selectedAsset && 'indicatorSlug' in selectedAsset) {
      payload.indicator_slug = (selectedAsset as Record<string, unknown>).indicatorSlug;
    }
    if (values.date_from) payload.date_from = String(values.date_from);
    if (values.date_to) payload.date_to = String(values.date_to);

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
  } catch {
    // toast shown by http interceptor
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="props.mode === 'edit' ? t('job.edit') : t('job.toolbar-add-asset')"
    size="sm"
    @update:visible="onDialogVisible"
  >
    <Form
      :key="formKey"
      id="add-primary-job-form"
      ref="formRef"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-3"
      @submit="onSubmit"
    >
      <BaseSelect
        name="asset_slug"
        :label="t('job.asset-slug')"
        :options="assetOptions"
        :placeholder="loadingAssets ? t('general.loading') : t('job.asset-slug-placeholder')"
        :required="true"
        :filter="true"
      />
      <BaseDateRangePicker
        name-from="date_from"
        name-to="date_to"
        :label="t('job.date-range')"
        :placeholder="t('job.date-range-placeholder')"
        :required="true"
      />
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
          form="add-primary-job-form"
          :disabled="saving"
        >
          {{ t('general.submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
