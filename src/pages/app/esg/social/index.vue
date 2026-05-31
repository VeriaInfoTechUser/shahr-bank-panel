<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useQuery} from "@core/composables";
import {esgRepo} from "@core/repositories/esgRepo";
import {computed, onMounted, onUnmounted, ref} from "vue";
import EsgAnswerModal from "@/components/EsgAnswerModal.vue";

const {t} = useI18n();

interface Domain {
  id: number;
  type: string;
  source: string;
  slug: string;
  title: string;
  description: string;
  parent_slug: string;
  code: string;
  order: number;
  is_active: boolean;
  time_create_view: string;
  time_update_view: string;
}

interface Control {
  id: number;
  type: string;
  source: string;
  slug: string;
  parent_slug: string;
  summary: string;
  title: string;
  description: string;
  answer_type: string;
  answer_unit: string;
  answer: string | number | null;
  answer_status: string;
  domain_title: string;
  domain_slug: string;
  metric_code: string;
  kpi_code: string;
  frameworks: string[];
  dashboard_usage: string;
  module: string;
  output_scope: string;
  order: number;
  is_active: boolean;
  time_create_view: string;
  time_update_view: string;
}

interface EsgResponse {
  result: boolean;
  data: {
    list: (Domain | Control)[];
    paginator: { count: number; limit: number; page: number };
  };
  error: unknown[];
}

const selectedDomainFilter = ref<string[]>([]);
const selectedControl = ref<Control | null>(null);
const showAnswerModal = ref(false);
const answerInput = ref<string | number>("");
const submittingAnswer = ref(false);

const {
  data: socialData,
  isLoading,
  error,
  refetch,
  invalidate,
} = useQuery(
    ["esg-social-list"],
    () => esgRepo.list({type: ["domain", "control"], source: "social"}),
    {
      enabled: true,
      staleTime: 300000,
      refetchOnMount: true,
    }
);

const allItems = computed(() => {
  return socialData.value?.data?.list || [];
});

const domains = computed(() => {
  return allItems.value.filter((item) => item.type === "domain") as Domain[];
});

const controls = computed(() => {
  return allItems.value.filter((item) => item.type === "control") as Control[];
});

const filteredControls = computed(() => {
  if (selectedDomainFilter.value.length === 0) {
    return controls.value;
  }
  return controls.value.filter(
      (control) => selectedDomainFilter.value.includes(control.domain_slug)
  );
});

const getDomainStats = (domain: Domain) => {
  const domainControls = controls.value.filter(
      (control) => control.domain_slug === domain.slug
  );
  const answered = domainControls.filter(
      (control) => control.answer_status === "answered"
  ).length;
  const total = domainControls.length;
  const unanswered = total - answered;
  const answeredPercent = total > 0 ? Math.round((answered / total) * 100) : 0;
  const unansweredPercent = total > 0 ? Math.round((unanswered / total) * 100) : 0;

  return {
    total,
    answered,
    unanswered,
    answeredPercent,
    unansweredPercent,
  };
};

const getAnswerUnitLabel = (unit: string | null | undefined) => {
  if (!unit) return "";
  const unitKey = unit.toString().toLowerCase();
  const translation = t(`governance.unit.${unitKey}`);
  return translation === `governance.unit.${unitKey}` ? unit : translation;
};

const getDisplayUnit = (control: Control | null | undefined, forList = false) => {
  if (!control) return "";
  if (control.answer_type === "percentage") return "%";
  if (control.answer_unit) {
    const unitKey = control.answer_unit;
    if (forList && unitKey === 'count') return "";
    return getAnswerUnitLabel(unitKey);
  }

  const code = (control.metric_code || "").toString().toLowerCase();
  const kpi = (control.kpi_code || "").toString().toLowerCase();
  const title = (control.title || "").toString().toLowerCase();
  const combined = `${code} ${kpi} ${title}`;

  const mapping: { [key: string]: string } = {
    'tco2': 'tco2e',
    'tco2e': 'tco2e',
    'co2': 'tco2e',
    'kwh': 'kwh',
    'kwh/h': 'kwh',
    'kg': 'kg',
    'liter': 'liter',
    'l ': 'liter',
    'm3': 'm3',
    'm³': 'm3',
    'ton': 'ton',
    'tonne': 'ton',
    'ha': 'hectare',
    'hectare': 'hectare',
    'person': 'person',
    'people': 'person',
    'employee': 'person',
    'staff': 'person',
    'animal': 'animal',
    'head': 'animal',
    'hour': 'hour',
    'hr': 'hour',
    'count': 'count'
  };

  for (const key in mapping) {
    if (Object.prototype.hasOwnProperty.call(mapping, key)) {
      if (combined.includes(key)) {
        const unitKey = mapping[key];
        if (forList && unitKey === 'count') return "";
        return getAnswerUnitLabel(unitKey);
      }
    }
  }

  return "";
};

const handleDomainClick = (domain: Domain) => {
  const index = selectedDomainFilter.value.indexOf(domain.slug);
  if (index > -1) {
    selectedDomainFilter.value.splice(index, 1);
  } else {
    selectedDomainFilter.value.push(domain.slug);
  }
};

const handleControlClick = (control: Control) => {
  selectedControl.value = control;
  answerInput.value = control.answer ?? "";
  showAnswerModal.value = true;
};

const handleSubmitAnswer = async () => {
  if (!selectedControl.value) return;

  submittingAnswer.value = true;
  try {
    selectedControl.value.answer = answerInput.value;
    selectedControl.value.answer_status = "answered";
    closeAnswerModal();
  } catch (err) {
    console.error("Error submitting answer:", err);
  } finally {
    submittingAnswer.value = false;
  }
};

const handleClearAnswer = () => {
  answerInput.value = "";
};

const closeAnswerModal = () => {
  showAnswerModal.value = false;
  selectedControl.value = null;
  answerInput.value = "";
};

onMounted(() => {
});

onUnmounted(() => {
  invalidate();
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-1 pb-12 pt-2 md:px-2">

    <div v-if="isLoading" class="space-y-4">
      <div class="animate-pulse">
        <div class="h-40 bg-slate-200 dark:bg-darkmode-700 rounded-xl"></div>
      </div>
      <div class="animate-pulse">
        <div class="h-96 bg-slate-200 dark:bg-darkmode-700 rounded-xl"></div>
      </div>
    </div>

    <div
        v-else-if="error"
        class="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400"
    >
      <div class="flex gap-3">
        <svg
            class="w-5 h-5 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
        >
          <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
          />
        </svg>
        <div>
          <p class="font-medium">{{ t("governance.error-loading") }}</p>
          <p class="text-sm mt-1">{{ t("general.error") }}</p>
        </div>
      </div>
    </div>

    <div v-else-if="domains.length === 0"
         class="rounded-xl border border-slate-200/60 bg-white p-12 text-center shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
      <svg
          class="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
      >
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p class="text-slate-600 dark:text-slate-400">{{ t("general.no-data") }}</p>
    </div>

    <template v-else>
      <div class="mb-2">
        <p class="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
          {{ t("governance.domains-title") }}
        </p>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-1.5">
          <div
              v-for="domain in domains"
              :key="domain.id"
              @click="handleDomainClick(domain)"
              :class="[
        'relative cursor-pointer rounded-xl border p-2.5 transition-all duration-150 select-none',
        'hover:-translate-y-px active:scale-[0.985]',
        selectedDomainFilter.includes(domain.slug)
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-500'
          : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-white/8 dark:bg-darkmode-800 dark:hover:border-white/15'
      ]"
          >
            <Transition name="pop">
              <div v-if="selectedDomainFilter.includes(domain.slug)"
                   class="absolute top-2 right-2 w-[15px] h-[15px] rounded-full bg-blue-500 flex items-center justify-center">
                <svg class="w-2 h-2 text-white" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l2 2 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </Transition>

            <div class="flex items-start gap-1.5 mb-2" dir="rtl">
              <h3 :class="[
          'text-[12px] font-medium leading-snug line-clamp-2 flex-1 min-w-0 pr-4',
          selectedDomainFilter.includes(domain.slug)
            ? 'text-blue-700 dark:text-blue-300'
            : 'text-slate-800 dark:text-slate-100'
        ]">
                {{ domain.title }}
              </h3>
              <span :class="[
          'font-mono text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap flex-shrink-0 leading-relaxed',
          selectedDomainFilter.includes(domain.slug)
            ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400'
            : 'bg-slate-100 dark:bg-white/6 border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500'
        ]">
          {{ domain.code }}
        </span>
            </div>

            <div class="flex items-center gap-1.5">
              <div class="flex-1 h-[3px] bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden" dir="ltr">
                <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="selectedDomainFilter.includes(domain.slug)
              ? 'bg-blue-500 dark:bg-blue-400'
              : 'bg-emerald-500 dark:bg-emerald-400'"
                    :style="{ width: getDomainStats(domain).answeredPercent + '%' }"
                />
              </div>
              <span :class="[
          'text-[11px] font-medium min-w-[28px] text-right',
          selectedDomainFilter.includes(domain.slug)
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-400 dark:text-slate-500'
        ]">
          {{ getDomainStats(domain).answeredPercent }}%
        </span>
            </div>
          </div>
        </div>

        <div class="mt-2 flex items-center justify-between min-h-[26px]">
          <Transition name="fade">
      <span v-if="selectedDomainFilter.length > 0" class="text-[11px] text-slate-400 dark:text-slate-500">
        {{ selectedDomainFilter.length }} {{ t('governance.domains-selected') }}
      </span>
          </Transition>
          <Transition name="fade">
            <button v-if="selectedDomainFilter.length > 0" @click="selectedDomainFilter = []"
                    class="inline-flex items-center gap-1.5 text-[11px] font-medium
               text-slate-500 dark:text-slate-400
               bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/12
               border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1
               transition-colors duration-150">
              <i class="ti ti-x text-[11px]" aria-hidden="true"></i>
              {{ t("governance.clear-filter") }}
            </button>
          </Transition>
        </div>
      </div>

      <div class="divide-y divide-slate-200 dark:divide-darkmode-700">
        <div
            v-if="filteredControls.length === 0"
            class="px-6 py-12 text-center"
        >
          <svg
              class="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
          >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p class="text-slate-600 dark:text-slate-400">{{ t("governance.no-control-found") }}</p>
        </div>

        <div
            class="rounded-xl border border-slate-200/80 dark:border-white/8 overflow-hidden bg-white dark:bg-darkmode-800">

          <div
              class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-darkmode-700 border-b border-slate-200/80 dark:border-white/8">
    <span class="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
      {{ t('governance.controls') }}
    </span>
            <span class="text-xs text-slate-400 dark:text-slate-500">
      {{ filteredControls.length }} {{ t('governance.items') }}
    </span>
          </div>

          <div
              v-for="control in filteredControls"
              :key="control.id"
              @click="handleControlClick(control)"
              class="flex items-stretch border-b border-slate-100 dark:border-white/6 last:border-b-0
           cursor-pointer hover:bg-slate-50 dark:hover:bg-darkmode-700/50 transition-colors group"
          >
            <div
                class="w-[3px] flex-shrink-0 transition-colors"
                :class="control.answer_status === 'answered'
        ? 'bg-emerald-500 dark:bg-emerald-400'
        : 'bg-slate-200 dark:bg-white/10'"
            />

            <div class="flex flex-1 min-w-0 items-center gap-4 px-4 py-3.5">

              <div class="flex-1 min-w-0" dir="rtl">

                <div class="flex items-center flex-wrap gap-1.5 mb-1.5">
          <span class="inline-flex items-center text-[11px] font-mono font-medium px-1.5 py-0.5
                       rounded bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400
                       border border-slate-200 dark:border-white/10">
            {{ control.metric_code }}
          </span>

                  <span
                      class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                      :class="control.answer_status === 'answered'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-white/8 text-slate-400 dark:text-slate-500'"
                  >
            <svg v-if="control.answer_status === 'answered'" class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                    stroke-linejoin="round"/>
            </svg>
            {{ control.answer_status === 'answered' ? t('governance.answered') : t('governance.unanswered') }}
          </span>

                  <span class="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full
                       bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400">
            {{ control.domain_title }}
          </span>
                </div>

                <p class="text-xs text-slate-400 dark:text-slate-500 mb-1 line-clamp-1">
                  {{ control.summary }}
                </p>

                <h3
                    class="text-[13px] font-medium leading-snug line-clamp-2"
                    :class="control.answer_status === 'answered'
            ? 'text-slate-800 dark:text-slate-100'
            : 'text-slate-400 dark:text-slate-500'"
                >
                  {{ control.title }}
                </h3>

                <div v-if="control.frameworks?.length" class="flex flex-wrap gap-1 mt-2">
          <span
              v-for="fw in control.frameworks"
              :key="fw"
              class="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/6
                   rounded px-1.5 py-0.5 leading-none"
          >
            {{ fw }}
          </span>
                </div>
              </div>

              <div class="flex-shrink-0 text-right flex flex-col items-end gap-1 min-w-[56px]">
                <template v-if="control.answer !== null && control.answer !== ''">
          <span class="text-xl font-medium text-slate-900 dark:text-slate-100 leading-none tabular-nums">
            {{ control.answer }}
            <template v-if="control.answer_type === 'percentage'">%</template>
            <template v-else-if="control.answer_type === 'number'">
              <template v-if="getDisplayUnit(control, true)"> {{ getDisplayUnit(control, true) }}</template>
            </template>
          </span>
                </template>
                <span v-else class="text-slate-300 dark:text-slate-600 text-base">—</span>
              </div>

              <i class="ti ti-chevron-right text-sm text-slate-300 dark:text-slate-600
                opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" aria-hidden="true"/>
            </div>
          </div>
        </div>

      </div>
    </template>

    <EsgAnswerModal
      v-model:show="showAnswerModal"
      :control="selectedControl"
      v-model:answer="answerInput"
      :submitting="submittingAnswer"
      @submit="handleSubmitAnswer"
      @clear="handleClearAnswer"
      @close="closeAnswerModal"
    />    <EsgAnswerModal
      v-model:show="showAnswerModal"
      :control="selectedControl"
      v-model:answer="answerInput"
      :submitting="submittingAnswer"
      @submit="handleSubmitAnswer"
      @clear="handleClearAnswer"
      @close="closeAnswerModal"
    />
  </div>
</template>

<style>
.pop-enter-active {
  transition: opacity 0.15s, transform 0.15s;
}

.pop-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
