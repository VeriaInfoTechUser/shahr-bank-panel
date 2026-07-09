<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BasePaginatedSelect from '@/core/ui/base/BasePaginatedSelect.vue';
import DatePickerExtra from '@/components/DatePickerExtra.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { grcRepo, type GrcEntity } from '@/core/repositories/grcRepo';
import { reportRepo } from '@/core/repositories/reportRepo';

const MODAL_SKIN = 'rounded-xl border border-slate-200 bg-white shadow-xl dark:border-darkmode-600 dark:bg-darkmode-800';

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();

const saving = ref(false);
const formKey = ref(0);

// ── Form ─────────────────────────────────────────────────────────────────────
const formSchema = yup.object({
  title: yup.string().trim().required(t('reports.validation-title-required')),
  framework: yup.string().trim().required(t('reports.validation-framework-required')),
});

const selectedPeriod = ref<{ type: string; startDate: string; endDate: string } | null>(null);
const dateType = ref<'jalali' | 'gregorian'>('jalali');
const selectedFrameworkTitle = ref('');

async function fetchFrameworks({ page, limit, search }: { page: number; limit: number; search?: string }) {
  const res = await grcRepo.frameworkList({ page, limit, title: search });
  return {
    list: (res?.data?.list ?? []).map((fw: GrcEntity) => ({ value: fw.slug, label: fw.title ?? fw.slug })),
    count: res?.data?.paginator?.count ?? 0,
  };
}

async function onSubmit(values: Record<string, unknown>) {
  if (!selectedPeriod.value) return;
  saving.value = true;
  try {
    const title = String(values.title ?? '');
    const frameworkSlug = String(values.framework ?? '');
    let fwTitle = selectedFrameworkTitle.value;
    if (!fwTitle) {
      const fwRes = await grcRepo.frameworkGet(frameworkSlug);
      fwTitle = fwRes?.data?.title ?? frameworkSlug;
    }
    await reportRepo.createBaseline({
      title,
      type: selectedPeriod.value.type,
      frameworkSlug,
      frameworkTitle: fwTitle,
      dateType: dateType.value,
      periodType: selectedPeriod.value.type,
      startDate: selectedPeriod.value.startDate,
      endDate: selectedPeriod.value.endDate,
    });
    toast(t('reports.create-success'), { type: 'success' });
    emit('success');
    close();
  } catch {
    toast(t('reports.create-error'), { type: 'error' });
  } finally {
    saving.value = false;
  }
}

// ── Navigation ──────────────────────────────────────────────────────────────
function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  if (!v) close();
}

watch(() => props.show, (visible) => {
  if (!visible) return;
  formKey.value++;
  selectedFrameworkTitle.value = '';
  selectedPeriod.value = null;
  dateType.value = 'jalali';
  saving.value = false;
});
</script>

<template>
  <BaseModal
    :visible="show"
    :title="t('reports.wizard-title')"
    :root-class="`w-[min(100%,32rem)] max-w-[32rem] ${MODAL_SKIN}`"
    @update:visible="onDialogVisible"
  >
    <Form
      :key="'form-' + formKey"
      id="create-report-form"
      :validation-schema="formSchema"
      :initial-values="{ title: '', framework: '' }"
      class="space-y-4"
      @submit="onSubmit"
    >
      <BaseInput
        name="title"
        :label="t('reports.col-title')"
        :placeholder="t('reports.title-placeholder')"
        :required="true"
      />
      <BasePaginatedSelect
        name="framework"
        :label="t('menu.framework')"
        :fetch-fn="fetchFrameworks"
        :limit="10"
        :search="true"
        :required="true"
        placeholder=""
      />

      <!-- Date Picker -->
      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
          {{ t('reports.col-period') }}
          <span class="me-0.5 text-danger">*</span>
        </label>
        <div class="flex justify-center">
          <DatePickerExtra
            v-model="selectedPeriod"
            :modes="['season', 'month', 'year']"
            @calendar-change="dateType = $event"
          />
        </div>
        <p v-if="!selectedPeriod" class="mt-1 text-[11px] text-danger">
          {{ t('reports.validation-period-required') }}
        </p>
      </div>
    </Form>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline-secondary" size="sm" :disabled="saving" @click="close">
          {{ t('button.cancel') }}
        </Button>
        <Button type="submit" variant="primary" size="sm" :disabled="saving || !selectedPeriod" form="create-report-form">
          <Lucide v-if="saving" icon="Loader2" class="me-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="Check" class="me-1 h-3.5 w-3.5" />
          {{ t('reports.submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
