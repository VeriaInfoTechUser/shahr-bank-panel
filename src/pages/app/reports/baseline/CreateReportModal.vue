<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
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
  loadFrameworks();
}

// ── Step 2: Framework ───────────────────────────────────────────────────────
interface Framework {
  slug: string;
  title: string;
  number: string;
  version: string;
  summary: string;
}

const frameworks = ref<Framework[]>([]);
const frameworksLoading = ref(false);
const selectedFramework = ref<string | null>(null);
const frameworkSearch = ref('');

const filteredFrameworks = computed(() => {
  const q = frameworkSearch.value.trim().toLowerCase();
  if (!q) return frameworks.value;
  return frameworks.value.filter(
    fw => fw.title.toLowerCase().includes(q)
      || fw.number.toLowerCase().includes(q)
      || fw.summary.toLowerCase().includes(q)
  );
});

function selectFramework(slug: string) {
  selectedFramework.value = selectedFramework.value === slug ? null : slug;
}

async function loadFrameworks() {
  if (frameworks.value.length > 0) return;
  frameworksLoading.value = true;
  try {
    const res = await grcRepo.frameworkList({ limit: 100 });
    frameworks.value = (res?.data?.list ?? []).map((fw: GrcEntity) => ({
      slug: fw.slug,
      title: fw.title ?? fw.slug,
      number: fw.number ?? '',
      version: fw.version ?? '',
      summary: fw.summary ?? '',
    }));
  } catch {
    frameworks.value = [];
  } finally {
    frameworksLoading.value = false;
  }
}

function goToStep3() {
  if (!selectedFramework.value) return;
  currentStep.value = 3;
}

// ── Step 3: Confirm & Submit ────────────────────────────────────────────────
const selectedFrameworkData = computed(() =>
  frameworks.value.find(fw => fw.slug === selectedFramework.value) ?? null
);

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

async function submitReport() {
  if (!selectedFramework.value || !selectedPeriod.value) return;
  saving.value = true;
  try {
    await reportRepo.createReport({
      title: reportTitle.value.trim(),
      type: selectedPeriod.value.type,
      frameworkSlug: selectedFramework.value,
      frameworkTitle: selectedFrameworkData.value?.title ?? '',
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
  frameworkSearch.value = '';
  saving.value = false;
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

        <!-- Search -->
        <div v-if="!frameworksLoading && frameworks.length" class="relative mb-3">
          <Lucide icon="Search" class="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="frameworkSearch"
            type="text"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pe-3 ps-9 text-sm text-slate-700 placeholder-slate-400 outline-none transition-colors focus:border-primary focus:bg-white dark:border-darkmode-600 dark:bg-darkmode-700 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-primary"
            :placeholder="t('reports.search-framework')"
          />
        </div>

        <!-- Loading -->
        <div v-if="frameworksLoading" class="space-y-2">
          <div v-for="i in 5" :key="i" class="h-14 animate-pulse rounded-lg border border-slate-200 bg-slate-50 dark:border-darkmode-600 dark:bg-darkmode-700" />
        </div>

        <!-- List -->
        <div v-else-if="filteredFrameworks.length" class="max-h-[340px] space-y-1.5 overflow-y-auto overscroll-contain pe-1">
          <button
            v-for="fw in filteredFrameworks"
            :key="fw.slug"
            type="button"
            class="group flex w-full items-center gap-3 rounded-lg border p-3 text-right transition-all"
            :class="
              selectedFramework === fw.slug
                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-darkmode-600 dark:bg-darkmode-800 dark:hover:border-darkmode-500 dark:hover:bg-darkmode-700'
            "
            @click="selectFramework(fw.slug)"
          >
            <!-- Radio -->
            <div
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all"
              :class="selectedFramework === fw.slug ? 'border-primary bg-primary' : 'border-slate-300 dark:border-darkmode-500'"
            >
              <div v-if="selectedFramework === fw.slug" class="h-2 w-2 rounded-full bg-white" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate text-sm font-semibold" :class="selectedFramework === fw.slug ? 'text-primary' : 'text-slate-700 dark:text-slate-200'">
                  {{ fw.title }}
                </span>
                <span v-if="fw.version" class="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-darkmode-600 dark:text-slate-400">
                  v{{ fw.version }}
                </span>
              </div>
              <div class="mt-0.5 flex items-center gap-2">
                <span v-if="fw.number" class="font-mono text-[11px] text-slate-400 dark:text-slate-500">{{ fw.number }}</span>
                <span v-if="fw.summary" class="hidden text-[11px] text-slate-400 dark:text-slate-500 sm:inline">— {{ fw.summary }}</span>
              </div>
            </div>
          </button>
        </div>

        <!-- Empty -->
        <div v-else class="py-8 text-center">
          <Lucide icon="LayoutGrid" class="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-darkmode-500" />
          <p class="text-sm text-slate-400 dark:text-slate-500">{{ t('general.no-data') }}</p>
        </div>
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
            <div v-if="selectedFrameworkData" class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Lucide icon="LayoutGrid" class="h-5 w-5 text-primary" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {{ selectedFrameworkData.title }}
                  </span>
                  <span v-if="selectedFrameworkData.version" class="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-darkmode-500 dark:text-slate-300">
                    v{{ selectedFrameworkData.version }}
                  </span>
                </div>
                <span v-if="selectedFrameworkData.number" class="font-mono text-xs text-slate-400 dark:text-slate-500">
                  {{ selectedFrameworkData.number }}
                </span>
              </div>
            </div>
          </div>
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
