<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Teleport, Transition } from "vue";
import Button from "@/base-components/Button";
import { FormInput } from "@/base-components/Form";
import type { PropType } from "vue";

interface Control {
  id: number;
  summary: string;
  title: string;
  description: string;
  answer_type: string;
  answer_unit: string;
  answer: string | number | null;
  domain_title: string;
  frameworks?: string[];
  metric_code?: string;
  kpi_code?: string;
}

const props = defineProps({
  show: { type: Boolean, required: true },
  control: { type: Object as PropType<Control | null>, default: null },
  answer: { type: [String, Number] as PropType<string | number>, default: "" },
  submitting: { type: Boolean, default: false },
});

const emit = defineEmits<{
  "update:show": [boolean];
  "update:answer": [string | number];
  "submit": [];
  "clear": [];
  "close": [];
}>();

const { t } = useI18n();

const localAnswer = computed({
  get: () => props.answer,
  set: (value: string | number) => emit("update:answer", value),
});

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
    const unitKey = control.answer_unit.toString().toLowerCase();
    if (forList && unitKey === "count") return "";
    return getAnswerUnitLabel(unitKey);
  }

  const code = (control.metric_code || "").toString().toLowerCase();
  const kpi = (control.kpi_code || "").toString().toLowerCase();
  const title = (control.title || "").toString().toLowerCase();
  const combined = `${code} ${kpi} ${title}`;

  const mapping: { [key: string]: string } = {
    tco2: "tco2e",
    tco2e: "tco2e",
    co2: "tco2e",
    kwh: "kwh",
    "kwh/h": "kwh",
    kg: "kg",
    liter: "liter",
    "l ": "liter",
    m3: "m3",
    "m³": "m3",
    ton: "ton",
    tonne: "ton",
    ha: "hectare",
    hectare: "hectare",
    person: "person",
    people: "person",
    employee: "person",
    staff: "person",
    animal: "animal",
    head: "animal",
    hour: "hour",
    hr: "hour",
    count: "count",
  };

  for (const key in mapping) {
    if (Object.prototype.hasOwnProperty.call(mapping, key) && combined.includes(key)) {
      const unitKey = mapping[key];
      if (forList && unitKey === "count") return "";
      return getAnswerUnitLabel(unitKey);
    }
  }

  return "";
};

const answerPlaceholder = computed(() => {
  if (!props.control) return "";
  if (props.control.answer_type === "percentage") return "0 – 100";
  if (props.control.answer_type === "number") return t("governance.enter-number");
  return t("governance.enter-answer");
});

const closeModal = () => {
  emit("update:show", false);
  emit("close");
};

const handleSubmit = () => emit("submit");
const handleClear = () => emit("clear");
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0"
                enter-to-class="opacity-100" leave-active-class="transition duration-150"
                leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="show && control"
           class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
           @click="closeModal">

        <Transition enter-active-class="transition duration-200"
                    enter-from-class="scale-95 opacity-0" enter-to-class="scale-100 opacity-100"
                    leave-active-class="transition duration-150"
                    leave-from-class="scale-100 opacity-100" leave-to-class="scale-95 opacity-0">
          <div class="bg-white dark:bg-darkmode-800 rounded-2xl border border-slate-200/80 dark:border-white/8
                       w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col"
               @click.stop>

            <div class="sticky top-0 z-10 bg-white dark:bg-darkmode-800 px-5 pt-3 pb-2
                        border-b border-slate-100 dark:border-white/8">
              <div class="flex items-start justify-between gap-3">
                <div class="flex flex-col gap-1.5 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[11px] font-medium px-2 py-0.5 rounded-full
                                 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400">
                      {{ control.domain_title }}
                    </span>
                  </div>
                </div>
                <button @click="closeModal"
                        class="w-7 h-7 flex-shrink-0 rounded-lg border border-slate-200 dark:border-white/10
                               bg-slate-100 dark:bg-white/8 flex items-center justify-center
                               text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                               hover:bg-slate-200 dark:hover:bg-white/12 transition-colors"
                        :aria-label="t('governance.close')">
                  X
                </button>
              </div>
            </div>

            <div class="px-3 py-3 space-y-4 flex-1">
              <div class="border border-slate-200/80 dark:border-white/8 rounded-xl overflow-hidden" dir="rtl">
                <div class="flex items-center justify-between gap-3 px-4 py-2.5
                            bg-slate-50 dark:bg-white/4 border-b border-slate-100 dark:border-white/8">
                  <span class="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                    {{ control.summary }}
                  </span>
                </div>
                <div class="px-4 py-3 space-y-2">
                  <p class="text-[13px] font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    {{ control.title }}
                  </p>
                  <p class="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {{ control.description }}
                  </p>
                </div>
                <div v-if="control.frameworks?.length"
                     class="flex flex-wrap gap-1.5 px-4 py-2.5 border-t border-slate-100 dark:border-white/8">
                  <span v-for="fw in control.frameworks" :key="fw"
                        class="text-[10px] text-slate-400 dark:text-slate-500
                               bg-slate-100 dark:bg-white/6 rounded px-1.5 py-0.5">
                    {{ fw }}
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-[12px] font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                  {{ t("governance.your-answer") }}
                </label>

                <div v-if="control.answer_type === 'number' || control.answer_type === 'percentage'"
                     class="relative">
                  <FormInput v-model="localAnswer"
                             type="number"
                             dir="ltr"
                             :placeholder="answerPlaceholder"
                             :min="control.answer_type === 'percentage' ? 0 : undefined"
                             :max="control.answer_type === 'percentage' ? 100 : undefined"
                             formInputSize="sm"
                             :class="control.answer_unit ? 'pl-16' : ''" />
                  <span v-if="getDisplayUnit(control)"
                        class="absolute left-4 top-1/2 -translate-y-1/2
                               text-[12px] text-slate-400 dark:text-slate-500 pointer-events-none">
                    {{ getDisplayUnit(control) }}
                  </span>
                </div>

                <FormInput v-else v-model="localAnswer" type="textarea" :rows="4"
                           :placeholder="answerPlaceholder"
                           formInputSize="sm" dir="rtl" />
              </div>
            </div>

            <div class="sticky bottom-0 border-t border-slate-100 dark:border-white/8
                        bg-slate-50 dark:bg-darkmode-900/60 px-5 py-3.5
                        flex items-center justify-between gap-3">
              <button @click="handleClear" :disabled="submitting"
                      class="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg btn-xs
                             text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30
                             border border-red-200 dark:border-red-800/40
                             hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors disabled:opacity-40">
                <i class="ti ti-eraser text-[13px]" aria-hidden="true"></i>
                {{ t("governance.clear") }}
              </button>

              <div class="flex items-center gap-2">
                <button @click="closeModal" :disabled="submitting"
                        class="inline-flex items-center text-[13px] font-medium px-4 py-1.5 rounded-lg
                               text-slate-500 dark:text-slate-400
                               border border-slate-200 dark:border-white/10
                               hover:bg-slate-100 dark:hover:bg-white/8 transition-colors disabled:opacity-40 btn-xs">
                  {{ t("governance.cancel") }}
                </button>
                <Button variant="primary" size="sm" :disabled="submitting" @click="handleSubmit">
                  <i v-if="!submitting" class="ti ti-check text-[14px]" aria-hidden="true"></i>
                  <i v-else class="ti ti-loader-2 text-[14px] animate-spin" aria-hidden="true"></i>
                  {{ submitting ? t("governance.submitting") : t("governance.submit") }}
                </Button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
