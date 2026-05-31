<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useQuery } from "@core/composables";
import { esgRepo } from "@core/repositories/esgRepo";
import { computed, onMounted, onUnmounted, ref } from "vue";
import Button from "@/base-components/Button";

const { t } = useI18n();

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

interface GovernanceResponse {
  result: boolean;
  data: {
    list: (Domain | Control)[];
    paginator: { count: number; limit: number; page: number };
  };
  error: unknown[];
}

// Refs
const selectedDomainFilter = ref<string[]>([]);
const selectedControl = ref<Control | null>(null);
const showAnswerModal = ref(false);
const answerInput = ref<string | number>("");
const submittingAnswer = ref(false);

// Queries
const {
  data: governanceData,
  isLoading,
  error,
  refetch,
  invalidate,
} = useQuery(
  ["esg-governance-list"],
  () => esgRepo.list({ type: ["domain", "control"], source: "governance" }),
  {
    enabled: true,
    staleTime: 300000,
    refetchOnMount: true,
  }
);

// Computed properties
const allItems = computed(() => {
  return governanceData.value?.data?.list || [];
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

// Calculate domain statistics
const getDomainStats = (domain: Domain) => {
  const domainControls = controls.value.filter(
    (control) => control.domain_slug === domain.slug
  );
  const answered = domainControls.filter(
    (control) => control.answer_status === "answered"
  ).length;
  const total = domainControls.length;
  const unanswered = total - answered;
  const answeredPercent = total > 0 ? Math.round((answered / total) * 100)  : 0;
  const unansweredPercent = total > 0 ? Math.round((unanswered / total) * 100) : 0;

  return {
    total,
    answered,
    unanswered,
    answeredPercent,
    unansweredPercent,
  };
};

// Handlers
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
    // TODO: Add API call to update answer
    // await esgRepo.updateControl(selectedControl.value.id, { answer: answerInput.value });

    // For now, update the local state
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

// Lifecycle
onMounted(() => {
  // Page initialization
});

onUnmounted(() => {
  invalidate();
});

// Helper functions
const getAnswerStatusColor = (status: string) => {
  switch (status) {
    case "answered":
      return "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400";
    case "pending":
      return "bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400";
    default:
      return "bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-400";
  }
};


</script>

<template>
  <div class="mx-auto max-w-7xl px-1 pb-12 pt-2 md:px-2">

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div class="animate-pulse">
        <div class="h-40 bg-slate-200 dark:bg-darkmode-700 rounded-xl"></div>
      </div>
      <div class="animate-pulse">
        <div class="h-96 bg-slate-200 dark:bg-darkmode-700 rounded-xl"></div>
      </div>
    </div>

    <!-- Error State -->
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
          <p class="font-medium">خطا در بارگذاری داده‌ها</p>
          <p class="text-sm mt-1">{{ t("general.error") }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="domains.length === 0" class="rounded-xl border border-slate-200/60 bg-white p-12 text-center shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
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

    <!-- Main Content -->
    <template v-else>
      <!-- Domain Cards Section -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          حوزه‌های حاکمیت
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div
              v-for="domain in domains"
              :key="domain.id"
              @click="handleDomainClick(domain)"
              :class="[
      'cursor-pointer rounded-md border p-3.5 transition-all duration-200 group',
      'hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.985]',
      selectedDomainFilter.includes(domain.slug)
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-400'
        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-darkmode-700 dark:bg-darkmode-800 dark:hover:border-darkmode-600'
    ]"
          >
            <!-- Header -->
            <div class="flex items-start justify-between gap-3 mb-2 mx-1 mt-2">
              <div class="flex items-center gap-2.5 flex-1 min-w-0">
                <!-- Title -->
                <h3 class="  text-slate-900 dark:text-slate-100 text-sm line-clamp-2 leading-tight">
                  {{ domain.title }}
                </h3>
              </div>
            </div>

            <!-- Progress -->
            <div class="space-y-2 px-2">
              <div class="flex items-center justify-between text-xs">
        <span class="text-slate-500 dark:text-slate-400 font-medium">
          {{ getDomainStats(domain).answered }}/{{ getDomainStats(domain).total }}
        </span>
                <span class="font-semibold text-slate-700 dark:text-slate-200">
          {{ getDomainStats(domain).answeredPercent }}%
        </span>
              </div>

              <!-- Progress Bar -->
              <div class="h-1.5 bg-slate-200 dark:bg-darkmode-600 rounded-full overflow-hidden transition-all duration-500 ltr " dir="ltr">
                <div
                    class="h-full bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-400 dark:to-emerald-400 rounded-full transition-all duration-300"
                    :style="{ width: getDomainStats(domain).answeredPercent + '%' }"
                >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Clear Filter Button -->
        <div v-if="selectedDomainFilter.length > 0" class="mt-4 flex justify-start">
          <Button
            variant="outline-primary"
            size="sm"
            @click="selectedDomainFilter = []"
          >
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            پاک کردن فیلتر
          </Button>
        </div>
      </div>

      <!-- Controls List Section -->
      <div class="rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
        <!-- List Header -->
        <div class="border-b border-slate-200 dark:border-darkmode-700 px-6 py-4">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
            کنترل‌ها
            <span class="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
              ({{ filteredControls.length }})
            </span>
          </h2>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {{
              selectedDomainFilter.length > 0
                ? `کنترل‌های حوزه انتخاب شده (${selectedDomainFilter.length} حوزه)`
                : "تمام کنترل‌های حاکمیت"
            }}
          </p>
        </div>

        <!-- Controls List -->
        <div class="divide-y divide-slate-200 dark:divide-darkmode-700">
          <!-- Empty State for Filtered -->
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
            <p class="text-slate-600 dark:text-slate-400">
              کنترلی برای این حوزه یافت نشد
            </p>
          </div>

          <!-- Controls Items -->
          <div
            v-for="control in filteredControls"
            :key="control.id"
            @click="handleControlClick(control)"
            class="cursor-pointer px-6 py-4 hover:bg-slate-50 dark:hover:bg-darkmode-700/50 transition-colors"
          >
            <div class="flex items-start justify-between gap-4">
              <!-- Left Content -->
              <div class="flex-1 min-w-0">
                <!-- Title and Status -->
                <div class="flex items-start justify-between gap-3 mb-2">

                  <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                    {{ control.summary }}
                  </p>
                </div>

                <!-- Description -->
                <h3 class="font-medium text-slate-900 dark:text-slate-100 text-sm">
                  {{ control.title }}
                </h3>


              </div>

              <!-- Right Content - Answer Display -->
              <div class="flex-shrink-0 text-right">
                <div v-if="control.answer !== null && control.answer !== ''" class="mb-2">
                  <p class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    <span v-if="control.answer_unit" class="text-sm font-normal ml-1">
                      {{ control.answer_unit }}
                    </span>
                    {{ control.answer }}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Answer Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showAnswerModal"
          class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          @click="closeAnswerModal"
        >
          <Transition
            enter-active-class="transition duration-200"
            enter-from-class="scale-95 opacity-0"
            enter-to-class="scale-100 opacity-100"
            leave-active-class="transition duration-200"
            leave-from-class="scale-100 opacity-100"
            leave-to-class="scale-95 opacity-0"
          >
            <div
              v-if="showAnswerModal && selectedControl"
              class="bg-white dark:bg-darkmode-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              @click.stop
            >
              <!-- Modal Header -->
              <div class="sticky top-0 border-b border-slate-200 dark:border-darkmode-700 bg-white dark:bg-darkmode-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    پاسخ به سوال
                  </h2>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {{ selectedControl.metric_code }}
                  </p>
                </div>
                <button
                  @click="closeAnswerModal"
                  class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Modal Body -->
              <div class="px-6 py-6 space-y-6">
                <!-- Question Info -->
                <div class="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                  <h3 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    {{ selectedControl.summary }}
                  </h3>
                  <p class="text-sm text-blue-800 dark:text-blue-200">
                    {{ selectedControl.title }}
                  </p>
                  <p class="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    {{ selectedControl.description }}
                  </p>
                </div>

                <!-- Form -->
                <div class="space-y-4">
                  <!-- Answer Type Label -->
                  <div>
                    <label class="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      پاسخ شما
                      <span class="text-xs text-slate-500 dark:text-slate-400 font-normal ml-2">
                        ({{ selectedControl.answer_type }}
                        <span v-if="selectedControl.answer_unit">
                          - {{ selectedControl.answer_unit }}
                        </span>
                        )
                      </span>
                    </label>

                    <!-- Input Field -->
                    <div
                      v-if="
                        selectedControl.answer_type === 'number' ||
                        selectedControl.answer_type === 'percentage'
                      "
                    >
                      <div class="relative">
                        <input
                          v-model.number="answerInput"
                          type="number"
                          :placeholder="`${
                            selectedControl.answer_type === 'percentage'
                              ? '0-100'
                              : 'عدد را وارد کنید'
                          }`"
                          class="w-full px-4 py-2 border border-slate-300 dark:border-darkmode-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-darkmode-700 dark:text-slate-100 transition-colors"
                          :min="selectedControl.answer_type === 'percentage' ? 0 : undefined"
                          :max="
                            selectedControl.answer_type === 'percentage'
                              ? 100
                              : undefined
                          "
                        />
                        <span
                          v-if="selectedControl.answer_unit"
                          class="absolute left-4 top-2.5 text-slate-500 dark:text-slate-400 text-sm pointer-events-none"
                        >
                          {{ selectedControl.answer_unit }}
                        </span>
                      </div>
                    </div>

                    <!-- Textarea for Text Answers -->
                    <textarea
                      v-else
                      v-model="answerInput"
                      rows="4"
                      placeholder="پاسخ خود را وارد کنید..."
                      class="w-full px-4 py-2 border border-slate-300 dark:border-darkmode-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-darkmode-700 dark:text-slate-100 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="border-t border-slate-200 dark:border-darkmode-700 bg-slate-50 dark:bg-darkmode-900/50 px-6 py-4 flex justify-end gap-3">
                <Button
                  variant="outline-secondary"
                  @click="closeAnswerModal"
                  :disabled="submittingAnswer"
                >
                  انصراف
                </Button>
                <Button
                  variant="outline-secondary"
                  @click="handleClearAnswer"
                  :disabled="submittingAnswer"
                >
                  پاک کردن
                </Button>
                <Button
                  variant="primary"
                  @click="handleSubmitAnswer"
                  :disabled="submittingAnswer"
                >
                  <svg
                    v-if="submittingAnswer"
                    class="w-4 h-4 ml-2 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {{
                    submittingAnswer ? "در حال ارسال..." : "ثبت پاسخ"
                  }}
                </Button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
