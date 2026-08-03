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
import DatePickerExtra from '@/components/DatePickerExtra.vue';

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

const capabilities = ref<GrcEntity[]>([]);
const loadingCapabilities = ref(false);

const capabilityOptions = ref<{ value: string; label: string }[]>([]);

const selectedPeriod = ref<{ type: string; startDate: string; endDate: string } | null>(null);

const initialValues = ref({
  capability_slug: '',
});

const validationSchema = yup.object({
  capability_slug: yup.string().trim().required(t('validation.required')),
});

async function loadAllCapabilities() {
  loadingCapabilities.value = true;
  try {
    const res = await grcRepo.capabilityList({ limit: 1000 });
    if (res?.result && res.data?.list) {
      capabilities.value = res.data.list;
      capabilityOptions.value = capabilities.value.map((c) => ({ value: c.slug, label: c.title ?? c.slug }));
    } else {
      capabilities.value = [];
      capabilityOptions.value = [];
    }
  } catch {
    capabilities.value = [];
    capabilityOptions.value = [];
  } finally {
    loadingCapabilities.value = false;
  }
}

watch(
  () => [props.show, props.mode, props.job] as const,
  async ([show, mode, j]) => {
    if (!show) return;

    await loadAllCapabilities();

    if (mode === 'edit' && j) {
      initialValues.value = {
        capability_slug: (j.capability_slug as string) ?? '',
      };
    } else {
      initialValues.value = {
        capability_slug: '',
      };
    }
    selectedPeriod.value = null;
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
  if (!selectedPeriod.value) return;
  saving.value = true;
  try {
    const payload: Record<string, unknown> = {
      calculation_level: 'CAPABILITY',
      date_from: selectedPeriod.value.startDate,
      date_to: selectedPeriod.value.endDate,
    };

    if (values.capability_slug) payload.capability_slug = String(values.capability_slug);

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
    :title="props.mode === 'edit' ? t('job.edit') : t('job.toolbar-add-capability')"
    size="sm"
    @update:visible="onDialogVisible"
  >
    <Form
      :key="formKey"
      id="add-capability-job-form"
      ref="formRef"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-3"
      @submit="onSubmit"
    >
      <BaseSelect
        name="capability_slug"
        :label="t('job.capability-slug')"
        :options="capabilityOptions"
        :placeholder="loadingCapabilities ? t('general.loading') : t('job.capability-slug-placeholder')"
        :required="true"
        :filter="true"
      />
      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
          {{ t('job.date-range') }}
          <span class="me-0.5 text-danger">*</span>
        </label>
        <div class="flex justify-center">
          <DatePickerExtra
            v-model="selectedPeriod"
            :modes="['season', 'month', 'year']"
          />
        </div>
        <p v-if="!selectedPeriod" class="mt-1 text-[11px] text-danger">
          {{ t('job.date-range-placeholder') }}
        </p>
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
          form="add-capability-job-form"
          :disabled="saving || !selectedPeriod"
        >
          {{ t('general.submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
