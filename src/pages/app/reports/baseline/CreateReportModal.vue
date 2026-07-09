<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BasePaginatedSelect from '@/core/ui/base/BasePaginatedSelect.vue';
import DatePickerExtra from '@/components/DatePickerExtra.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { grcRepo, type GrcEntity } from '@/core/repositories/grcRepo';
import { reportRepo } from '@/core/repositories/reportRepo';

const MODAL_SKIN = 'rounded-xl border border-slate-200 bg-white shadow-xl dark:border-darkmode-600 dark:bg-darkmode-800';

// ── Props / Emits ───────────────────────────────────────────────────────────
const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t, locale } = useI18n();
const isRtl = computed(() => ['fa', 'ar'].includes(String(locale.value).slice(0, 2)));

// ── Modal size: step 1 = compact (fits DatePicker), step 2+ = lg ───────────
const modalRootClass = computed(() => {
  if (currentStep.value === 1) {
    return `w-[min(100%,24rem)] max-w-[24rem] ${MODAL_SKIN} report-wizard-modal`;
  }
  return `max-w-4xl w-[min(100%,56rem)] ${MODAL_SKIN} report-wizard-modal`;
});

// ── Steps ───────────────────────────────────────────────────────────────────
const STEPS = [
  { key: 1, labelKey: 'reports.wizard-step-period', icon: 'Calendar' },
  { key: 2, labelKey: 'reports.wizard-step-framework', icon: 'LayoutGrid' },
  { key: 3, labelKey: 'reports.wizard-step-confirm', icon: 'CheckCircle' },
] as const;

const currentStep = ref(1);
const saving = ref(false);

// ── Step 1: Period ──────────────────────────────────────────────────────────
const reportTitle = ref('');
const selectedPeriod = ref<{ type: string; startDate: string; endDate: string } | null>(null);
const dateType = ref<'jalali' | 'gregorian'>('jalali');

function goToStep2() {
  if (!selectedPeriod.value || !reportTitle.value.trim()) return;
  currentStep.value = 2;
}

// ── Step 2: Framework ───────────────────────────────────────────────────────
const selectedFramework = ref<string | null>(null);
const selectedFrameworkTitle = ref('');

async function fetchFrameworks({ page, limit, search }: { page: number; limit: number; search?: string }) {
  const res = await grcRepo.frameworkList({ page, limit, title: search });
  const list = (res?.data?.list ?? []).map((fw: GrcEntity) => ({
    value: fw.slug,
    label: fw.title ?? fw.slug,
  }));
  return { list, count: res?.data?.paginator?.count ?? 0 };
}

function onFrameworkChange(slug: unknown) {
  selectedFramework.value = String(slug ?? '');
}

function goToStep3() {
  if (!selectedFramework.value) return;
  currentStep.value = 3;
}

const periodLabel = computed(() => {
  const p = selectedPeriod.value;
  if (!p) return '';
  const labels: Record<string, string> = {
    season: 'فصل / Quarter',
    month: 'ماه / Month',
    year: 'سال / Year',
  };
  return `${labels[p.type] ?? p.type}  •  ${p.startDate} — ${p.endDate}`;
});

const submitError = ref('');
const submitSuccess = ref(false);

async function submitReport() {
  if (!selectedFramework.value || !selectedPeriod.value) return;
  saving.value = true;
  submitError.value = '';
  submitSuccess.value = false;
  try {
    let fwTitle = selectedFrameworkTitle.value;
    if (!fwTitle) {
      const fwRes = await grcRepo.frameworkGet(selectedFramework.value);
      fwTitle = fwRes?.data?.title ?? selectedFramework.value;
    }
    await reportRepo.createReport({
      title: reportTitle.value.trim(),
      type: selectedPeriod.value.type,
      frameworkSlug: selectedFramework.value,
      frameworkTitle: fwTitle,
      dateType: dateType.value,
      periodType: selectedPeriod.value.type,
      startDate: selectedPeriod.value.startDate,
      endDate: selectedPeriod.value.endDate,
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

// ── Reset on open ───────────────────────────────────────────────────────────
watch(() => props.show, (visible) => {
  if (!visible) return;
  currentStep.value = 1;
  reportTitle.value = '';
  selectedPeriod.value = null;
  dateType.value = 'jalali';
  selectedFramework.value = null;
  selectedFrameworkTitle.value = '';
  saving.value = false;
  submitError.value = '';
  submitSuccess.value = false;
});
</script>

<template>
  <BaseModal
    :visible="show"
    :title="t('reports.wizard-title')"
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

      <!-- ═══ Step 1: Period ═══ -->
      <div v-if="currentStep === 1">
        <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          {{ t('reports.wizard-step-period') }}
        </p>
        <div class="flex flex-col items-center gap-3">
          <input
            v-model="reportTitle"
            type="text"
            class="w-full max-w-[320px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none transition-colors focus:border-primary focus:bg-white dark:border-darkmode-600 dark:bg-darkmode-700 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-primary"
            :placeholder="t('reports.title-placeholder')"
          />
          <DatePickerExtra
            v-model="selectedPeriod"
            :modes="['season', 'month', 'year']"
            @calendar-change="dateType = $event"
          />
        </div>
      </div>

      <!-- ═══ Step 2: Framework ═══ -->
      <div v-else-if="currentStep === 2">
        <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          {{ t('reports.wizard-step-framework') }}
        </p>
        <BasePaginatedSelect
          name="framework"
          :label="t('menu.framework')"
          :fetch-fn="fetchFrameworks"
          :limit="10"
          :search="true"
          placeholder=""
          @change="onFrameworkChange"
        />
      </div>

      <!-- ═══ Step 3: Confirm ═══ -->
      <div v-else-if="currentStep === 3">
        <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          {{ t('reports.wizard-step-confirm') }}
        </p>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-darkmode-600 dark:bg-darkmode-700">
          <!-- Title -->
          <div class="mb-4">
            <span class="mb-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {{ t('reports.col-title') }}
            </span>
            <div class="flex items-center gap-2">
              <Lucide icon="Type" class="h-4 w-4 text-primary" />
              <span class="text-sm font-medium text-slate-700 dark:text-slate-200">
                {{ reportTitle }}
              </span>
            </div>
          </div>

          <div class="mb-4 h-px bg-slate-200 dark:bg-darkmode-600" />

          <!-- Period -->
          <div class="mb-4">
            <span class="mb-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {{ t('reports.period') }}
            </span>
            <div class="flex items-center gap-2">
              <Lucide icon="Calendar" class="h-4 w-4 text-primary" />
              <span class="text-sm font-medium text-slate-700 dark:text-slate-200">
                {{ periodLabel }}
              </span>
            </div>
            <span class="mt-1 inline-block rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-darkmode-500 dark:text-slate-300">
              {{ dateType === 'jalali' ? 'شمسی' : 'میلادی' }}
            </span>
          </div>

          <div class="mb-4 h-px bg-slate-200 dark:bg-darkmode-600" />

          <!-- Framework -->
          <div>
            <span class="mb-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {{ t('menu.framework') }}
            </span>
            <div v-if="selectedFramework" class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Lucide icon="LayoutGrid" class="h-5 w-5 text-primary" />
              </div>
              <div class="min-w-0">
                <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {{ selectedFrameworkTitle || selectedFramework }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Inline feedback ═══ -->
      <div v-if="submitSuccess || submitError" class="mt-4">
        <div
          v-if="submitSuccess"
          class="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success"
        >
          <Lucide icon="CheckCircle" class="h-4 w-4" />
          {{ t('reports.create-success') }}
        </div>
        <div
          v-else-if="submitError"
          class="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
        >
          <Lucide icon="XCircle" class="h-4 w-4" />
          {{ submitError }}
        </div>
      </div>
    </div>

    <!-- ═══ Footer ═══ -->
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline-secondary" size="sm" :disabled="saving" @click="close">
          {{ t('button.cancel') }}
        </Button>
        <Button
          v-if="currentStep > 1"
          type="button"
          variant="outline-secondary"
          size="sm"
          @click="goBack"
        >
          {{ t('button.back') }}
        </Button>
        <Button
          v-if="currentStep === 1"
          type="button"
          variant="primary"
          size="sm"
          :disabled="!selectedPeriod"
          @click="goToStep2"
        >
          {{ t('reports.wizard-next') }}
        </Button>
        <Button
          v-else-if="currentStep === 2"
          type="button"
          variant="primary"
          size="sm"
          :disabled="!selectedFramework"
          @click="goToStep3"
        >
          {{ t('reports.wizard-next') }}
        </Button>
        <Button
          v-else
          type="button"
          variant="primary"
          size="sm"
          :disabled="saving"
          @click="submitReport"
        >
          <Lucide v-if="saving" icon="Loader2" class="me-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="Check" class="me-1 h-3.5 w-3.5" />
          {{ t('reports.submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>

<style>
.report-wizard-modal {
  transition: max-width 0.3s ease, width 0.3s ease !important;
}
</style>
