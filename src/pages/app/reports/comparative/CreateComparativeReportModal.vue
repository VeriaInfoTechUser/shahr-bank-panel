<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import BasePaginatedSelect from '@/core/ui/base/BasePaginatedSelect.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { grcRepo, type GrcEntity } from '@/core/repositories/grcRepo';
import { reportRepo, type ReportItem } from '@/core/repositories/reportRepo';

const MODAL_SKIN = 'rounded-xl border border-slate-200 bg-white shadow-xl dark:border-darkmode-600 dark:bg-darkmode-800';

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();

const modalRootClass = computed(() => {
  return `w-[min(100%,28rem)] max-w-[28rem] ${MODAL_SKIN} report-wizard-modal`;
});

const STEPS = [
  { key: 1, labelKey: 'reports.wizard-step-info', icon: 'FileText' },
  { key: 2, labelKey: 'reports.wizard-step-select-reports', icon: 'List' },
  { key: 3, labelKey: 'reports.wizard-step-confirm', icon: 'CheckCircle' },
] as const;

const currentStep = ref(1);
const saving = ref(false);
const step1FormKey = ref(0);
const step2FormKey = ref(0);

// ── Step 1 ──────────────────────────────────────────────────────────────────
const step1Schema = yup.object({
  title: yup.string().trim().required(t('reports.validation-title-required')),
  framework: yup.string().trim().required(t('reports.validation-framework-required')),
  periodType: yup.string().trim().required(t('reports.validation-period-required')),
  dateType: yup.string().trim().required(t('reports.validation-date-type-required')),
});

const periodTypeOptions = computed(() => [
  { value: 'YEARLY', label: t('reports.period-type.yearly') },
  { value: 'QUARTERLY', label: t('reports.period-type.quarterly') },
  { value: 'MONTHLY', label: t('reports.period-type.monthly') },
]);

const dateTypeOptions = computed(() => [
  { value: 'jalali', label: t('reports.date-type.jalali') },
  { value: 'gregorian', label: t('reports.date-type.gregorian') },
]);

const selectedFrameworkTitle = ref('');

async function fetchFrameworks({ page, limit, search }: { page: number; limit: number; search?: string }) {
  const res = await grcRepo.frameworkList({ page, limit, title: search });
  return {
    list: (res?.data?.list ?? []).map((fw: GrcEntity) => ({ value: fw.slug, label: fw.title ?? fw.slug })),
    count: res?.data?.paginator?.count ?? 0,
  };
}

const step1Values = ref<{ title: string; framework: string; periodType: string; dateType: string }>({ title: '', framework: '', periodType: '', dateType: '' });

async function onStep1Submit(values: Record<string, unknown>) {
  step1Values.value = {
    title: String(values.title ?? ''),
    framework: String(values.framework ?? ''),
    periodType: String(values.periodType ?? ''),
    dateType: String(values.dateType ?? ''),
  };
  selectedFrameworkTitle.value = '';
  await Promise.all([loadBaselineReports(), loadFrameworkTitle()]);
  if (baselineReports.value.length < 2) {
    toast(t('reports.not-enough-reports'), { type: 'warning' });
    return;
  }
  currentStep.value = 2;
}

// ── Step 2 ──────────────────────────────────────────────────────────────────
const step2Schema = yup.object({
  reportA: yup.string().trim().required(t('reports.validation-report-a-required')),
  reportB: yup.string().trim().required(t('reports.validation-report-b-required')),
});

const baselineReports = ref<ReportItem[]>([]);
const reportsLoading = ref(false);

async function loadBaselineReports() {
  reportsLoading.value = true;
  try {
    const res = await reportRepo.getBaselineList({
      page: 1,
      limit: 200,
      frameworkSlug: step1Values.value.framework,
      periodType: step1Values.value.periodType,
      dateType: step1Values.value.dateType,
    });
    baselineReports.value = res?.data?.list ?? [];
  } catch {
    baselineReports.value = [];
  } finally {
    reportsLoading.value = false;
  }
}

async function loadFrameworkTitle() {
  try {
    const res = await grcRepo.frameworkGet(step1Values.value.framework);
    selectedFrameworkTitle.value = res?.data?.title ?? '';
  } catch {
    selectedFrameworkTitle.value = '';
  }
}

const reportOptions = computed(() =>
  baselineReports.value.map(r => ({
    value: r.slug,
    label: r.title || r.slug,
    subtitle: r.startDate && r.endDate
      ? `${new Date(r.startDate).toLocaleDateString('fa-IR')} — ${new Date(r.endDate).toLocaleDateString('fa-IR')}`
      : undefined,
  }))
);

const step2Values = ref<{ reportA: string; reportB: string }>({ reportA: '', reportB: '' });

function onStep2Submit(values: Record<string, unknown>) {
  step2Values.value = {
    reportA: String(values.reportA ?? ''),
    reportB: String(values.reportB ?? ''),
  };
  currentStep.value = 3;
}

function reportLabel(slug: string) {
  return baselineReports.value.find(x => x.slug === slug)?.title || slug;
}

function reportDate(slug: string) {
  const r = baselineReports.value.find(x => x.slug === slug);
  if (!r?.startDate || !r?.endDate) return '';
  return `${new Date(r.startDate).toLocaleDateString('fa-IR')} — ${new Date(r.endDate).toLocaleDateString('fa-IR')}`;
}

// ── Step 3 ──────────────────────────────────────────────────────────────────
const periodLabel = computed(() => {
  const labels: Record<string, string> = { YEARLY: 'سالانه', QUARTERLY: 'فصلی', MONTHLY: 'ماهانه' };
  return labels[step1Values.value.periodType] ?? step1Values.value.periodType;
});

const dateTypeLabel = computed(() => {
  const labels: Record<string, string> = { jalali: t('reports.date-type.jalali'), gregorian: t('reports.date-type.gregorian') };
  return labels[step1Values.value.dateType] ?? step1Values.value.dateType;
});

const submitError = ref('');
const submitSuccess = ref(false);

async function submitReport() {
  if (!step1Values.value.framework || !step2Values.value.reportA || !step2Values.value.reportB) return;
  saving.value = true;
  submitError.value = '';
  submitSuccess.value = false;
  try {
    const fwTitle = selectedFrameworkTitle.value || step1Values.value.framework;
    const reportA = baselineReports.value.find(x => x.slug === step2Values.value.reportA);
    const reportB = baselineReports.value.find(x => x.slug === step2Values.value.reportB);
    await reportRepo.createComparative({
      title: step1Values.value.title,
      type: 'comparative',
      frameworkSlug: step1Values.value.framework,
      frameworkTitle: fwTitle,
      dateType: step1Values.value.dateType,
      periodType: step1Values.value.periodType,
      reportASlug: step2Values.value.reportA,
      reportATitle: reportLabel(step2Values.value.reportA),
      reportAStartDate: reportA?.startDate ?? '',
      reportAEndDate: reportA?.endDate ?? '',
      reportBSlug: step2Values.value.reportB,
      reportBTitle: reportLabel(step2Values.value.reportB),
      reportBStartDate: reportB?.startDate ?? '',
      reportBEndDate: reportB?.endDate ?? '',
    });
    submitSuccess.value = true;
    emit('success');
    setTimeout(() => close(), 1200);
  } catch {
    submitError.value = t('reports.create-error');
  } finally {
    saving.value = false;
  }
}

// ── Navigation ──────────────────────────────────────────────────────────────
function goBack() {
  if (currentStep.value > 1) currentStep.value--;
}

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  if (!v) close();
}

watch(() => props.show, (visible) => {
  if (!visible) return;
  currentStep.value = 1;
  step1FormKey.value++;
  step2FormKey.value++;
  step1Values.value = { title: '', framework: '', periodType: '', dateType: '' };
  step2Values.value = { reportA: '', reportB: '' };
  selectedFrameworkTitle.value = '';
  baselineReports.value = [];
  saving.value = false;
  submitError.value = '';
  submitSuccess.value = false;
});
</script>

<template>
  <BaseModal
    :visible="show"
    :title="t('reports.comparative-wizard-title')"
    :root-class="modalRootClass"
    @update:visible="onDialogVisible"
  >
    <div :class="currentStep === 1 ? 'min-h-0' : 'min-h-[28rem]'">
      <!-- Stepper -->
      <nav class="mb-6 flex items-center gap-1">
        <template v-for="(step, idx) in STEPS" :key="step.key">
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition"
            :class="[
              currentStep === step.key
                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                : currentStep > step.key
                  ? 'text-primary/70'
                  : 'text-slate-400 dark:text-slate-500',
            ]"
            @click="currentStep > step.key ? (currentStep = step.key) : undefined"
          >
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
              :class="[
                currentStep === step.key
                  ? 'bg-primary text-white'
                  : currentStep > step.key
                    ? 'bg-primary/20 text-primary'
                    : 'bg-slate-200 text-slate-500 dark:bg-darkmode-600 dark:text-slate-400',
              ]"
            >
              <Lucide v-if="currentStep > step.key" icon="Check" class="h-3.5 w-3.5" />
              <span v-else>{{ step.key }}</span>
            </span>
            <span class="hidden sm:inline">{{ t(step.labelKey) }}</span>
          </button>
          <div
            v-if="idx < STEPS.length - 1"
            class="mx-1 h-px flex-1"
            :class="currentStep > step.key ? 'bg-primary/30' : 'bg-slate-200 dark:bg-darkmode-600'"
          />
        </template>
      </nav>

      <!-- ═══ Step 1 ═══ -->
      <Form
        v-if="currentStep === 1"
        :key="'step1-' + step1FormKey"
        id="comparative-wizard-step1"
        :validation-schema="step1Schema"
        :initial-values="{ title: '', framework: '', periodType: '', dateType: '' }"
        class="space-y-4"
        @submit="onStep1Submit"
      >
        <BaseInput name="title" :label="t('reports.col-title')" :placeholder="t('reports.title-placeholder')" :required="true" />
        <BasePaginatedSelect name="framework" :label="t('menu.framework')" :fetch-fn="fetchFrameworks" :limit="10" :search="true" :required="true" placeholder="" />
        <div class="grid grid-cols-2 gap-3">
          <BaseSelect name="periodType" :label="t('reports.col-period')" :options="periodTypeOptions" :required="true" placeholder="" />
          <BaseSelect name="dateType" :label="t('reports.col-date-type')" :options="dateTypeOptions" :required="true" placeholder="" />
        </div>
      </Form>

      <!-- ═══ Step 2 ═══ -->
      <Form
        v-else-if="currentStep === 2"
        :key="'step2-' + step2FormKey"
        id="comparative-wizard-step2"
        :validation-schema="step2Schema"
        :initial-values="{ reportA: '', reportB: '' }"
        class="space-y-4"
        @submit="onStep2Submit"
      >
        <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          {{ t('reports.wizard-step-select-reports') }}
        </p>
        <div v-if="reportsLoading" class="flex items-center justify-center py-8">
          <span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
        </div>
        <template v-else>
          <ComparativeReportSelect name="reportA" other-field-name="reportB" :label="t('reports.select-report-a')" :options="reportOptions" :required="true" />
          <ComparativeReportSelect name="reportB" other-field-name="reportA" :label="t('reports.select-report-b')" :options="reportOptions" :required="true" />
        </template>
      </Form>

      <!-- ═══ Step 3 ═══ -->
      <div v-else-if="currentStep === 3">
        <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          {{ t('reports.wizard-step-confirm') }}
        </p>
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-darkmode-600 dark:bg-darkmode-700">
          <div class="mb-4">
            <span class="mb-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ t('reports.col-title') }}</span>
            <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ step1Values.title }}</span>
          </div>
          <div class="mb-4 h-px bg-slate-200 dark:bg-darkmode-600" />
          <div class="mb-4">
            <span class="mb-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ t('menu.framework') }}</span>
            <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ selectedFrameworkTitle || step1Values.framework }}</span>
          </div>
          <div class="mb-4 h-px bg-slate-200 dark:bg-darkmode-600" />
          <div class="mb-4">
            <span class="mb-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ t('reports.col-period') }}</span>
            <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ periodLabel }}</span>
          </div>
          <div class="mb-4 h-px bg-slate-200 dark:bg-darkmode-600" />
          <div class="mb-4">
            <span class="mb-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ t('reports.col-date-type') }}</span>
            <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ dateTypeLabel }}</span>
          </div>
          <div class="mb-4 h-px bg-slate-200 dark:bg-darkmode-600" />
          <div>
            <span class="mb-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ t('reports.reports-to-compare') }}</span>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-darkmode-600 dark:bg-darkmode-800">
                <Lucide icon="FileText" class="h-4 w-4 shrink-0 text-primary" />
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ reportLabel(step2Values.reportA) }}</span>
                  <span v-if="reportDate(step2Values.reportA)" class="text-[10px] font-light text-slate-400 dark:text-slate-500">{{ reportDate(step2Values.reportA) }}</span>
                </div>
              </div>
              <Lucide icon="ArrowLeftRight" class="h-4 w-4 shrink-0 text-slate-400" />
              <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-darkmode-600 dark:bg-darkmode-800">
                <Lucide icon="FileText" class="h-4 w-4 shrink-0 text-primary" />
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ reportLabel(step2Values.reportB) }}</span>
                  <span v-if="reportDate(step2Values.reportB)" class="text-[10px] font-light text-slate-400 dark:text-slate-500">{{ reportDate(step2Values.reportB) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback -->
      <div v-if="submitSuccess || submitError" class="mt-4">
        <div v-if="submitSuccess" class="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success">
          <Lucide icon="CheckCircle" class="h-4 w-4" />
          {{ t('reports.create-success') }}
        </div>
        <div v-else-if="submitError" class="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          <Lucide icon="XCircle" class="h-4 w-4" />
          {{ submitError }}
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline-secondary" size="sm" :disabled="saving" @click="close">
          {{ t('button.cancel') }}
        </Button>
        <Button v-if="currentStep > 1" type="button" variant="outline-secondary" size="sm" @click="goBack">
          {{ t('button.back') }}
        </Button>
        <Button v-if="currentStep === 1" type="submit" variant="primary" size="sm" form="comparative-wizard-step1">
          {{ t('reports.wizard-next') }}
        </Button>
        <Button v-else-if="currentStep === 2" type="submit" variant="primary" size="sm" form="comparative-wizard-step2">
          {{ t('reports.wizard-next') }}
        </Button>
        <Button v-else type="button" variant="primary" size="sm" :disabled="saving" @click="submitReport">
          <Lucide v-if="saving" icon="Loader2" class="me-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="Check" class="me-1 h-3.5 w-3.5" />
          {{ t('reports.submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>

<script lang="ts">
import { computed, defineComponent, watch } from 'vue';
import { useField } from 'vee-validate';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';

const ComparativeReportSelect = defineComponent({
  name: 'ComparativeReportSelect',
  components: { BaseSelect },
  props: {
    name: { type: String, required: true },
    otherFieldName: { type: String, required: true },
    label: { type: String, default: '' },
    options: { type: Array, default: () => [] },
    required: { type: Boolean, default: false },
  },
  setup(props) {
    const { value } = useField<string>(props.name);
    const { value: otherValue } = useField<string>(props.otherFieldName);
    const filteredOptions = computed(() => {
      return (props.options as { value: string; label: string }[]).filter(o => o.value !== otherValue.value);
    });
    watch(otherValue, (v) => { if (v && value.value === v) value.value = ''; });
    return { value, filteredOptions };
  },
  template: `<BaseSelect :name="name" :label="label" :options="filteredOptions" :required="required" placeholder="" />`,
});

export default { components: { ComparativeReportSelect } };
</script>

<style>
.report-wizard-modal {
  transition: max-width 0.3s ease, width 0.3s ease !important;
}
</style>
