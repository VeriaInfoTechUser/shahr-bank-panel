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
import BaseDatePicker from '@/core/ui/base/BaseDatePicker.vue';

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

const indicators = ref<GrcEntity[]>([]);
const selectedIndicatorSlug = ref('');

const indicatorOptions = ref<{ value: string; label: string }[]>([]);

const initialValues = ref({
  indicator_slug: '',
  date: '',
});

const validationSchema = yup.object({
  indicator_slug: yup.string().trim().required(t('validation.required')),
  date: yup.string().trim().required(t('validation.required')),
});

async function loadIndicators() {
  try {
    const res = await grcRepo.indicatorList({ limit: 1000 });
    if (res?.result && res.data?.list) {
      indicators.value = res.data.list;
      indicatorOptions.value = indicators.value.map((m) => ({ value: m.slug, label: m.title ?? m.slug }));
    }
  } catch {
    // silent
  }
}

watch(
  () => [props.show, props.mode, props.job] as const,
  async ([show, mode, j]) => {
    if (!show) return;

    await loadIndicators();

    if (mode === 'edit' && j) {
      initialValues.value = {
        indicator_slug: (j.indicator_slug as string) ?? '',
        date: (j.date as string) ?? '',
      };
      selectedIndicatorSlug.value = (j.indicator_slug as string) ?? '';
    } else {
      initialValues.value = {
        indicator_slug: '',
        date: '',
      };
      selectedIndicatorSlug.value = '';
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

function onIndicatorChanged(value: unknown) {
  selectedIndicatorSlug.value = String(value ?? '');
}

async function onSubmit(values: Record<string, unknown>) {
  saving.value = true;
  try {
    const payload: Record<string, unknown> = {
      calculation_level: 'SECONDARY',
    };

    if (values.indicator_slug) payload.indicator_slug = String(values.indicator_slug);
    if (values.date) payload.date_from = String(values.date);

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
    :title="props.mode === 'edit' ? t('job.edit') : t('job.toolbar-add-secondary')"
    size="sm"
    @update:visible="onDialogVisible"
  >
    <Form
      :key="formKey"
      id="add-secondary-job-form"
      ref="formRef"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-3"
      @submit="onSubmit"
    >
      <BaseSelect
        name="indicator_slug"
        :label="t('job.indicator-slug')"
        :options="indicatorOptions"
        :placeholder="t('job.indicator-slug-placeholder')"
        :required="true"
        :filter="true"
        @change="onIndicatorChanged"
      />
      <BaseDatePicker
        name="date"
        :label="t('job.date')"
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
          form="add-secondary-job-form"
          :disabled="saving"
        >
          {{ props.mode === 'edit' ? t('title.update') : t('title.register') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
