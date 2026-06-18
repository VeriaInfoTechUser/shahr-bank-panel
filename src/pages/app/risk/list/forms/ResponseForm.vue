<script setup lang="ts">
import { computed, ref } from 'vue';
import { Form, useFormContext } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import RegistrationSection from '../sections/RegistrationSection.vue';
import AnalysisSection from '../sections/AnalysisSection.vue';
import ResponseSection from '../sections/ResponseSection.vue';
import type { RiskTask } from '../useRisk';

const props = defineProps<{
  formKey: number;
  initialValues: Record<string, unknown>;
  risk: Record<string, unknown>;
  categoryOptions: { value: string; label: string }[];
  subCategoryOptions: { value: string; label: string }[];
  memberOptions: { value: string; label: string }[];
  selectedCategorySlug: string;
  tasks: RiskTask[];
  savingTasks: boolean;
  saving: boolean;
  transitioning: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', values: Record<string, unknown>): void;
  (e: 'update:tasks', tasks: RiskTask[]): void;
  (e: 'transition', to: string): void;
}>();

const { t } = useI18n();

const accordionOpen = ref({
  registration: false,
  analysis: false,
  response: true,
});

const validationSchema = computed(() => yup.object({
  treatmentStrategy: yup.string().required(t('validation.required')),
}));

function toggleAccordion(section: 'registration' | 'analysis' | 'response') {
  accordionOpen.value[section] = !accordionOpen.value[section];
}

async function onSubmit(values: Record<string, unknown>) {
  emit('submit', values);
}

async function handleTransition(to: string) {
  const { validate } = useFormContext();
  const { valid } = await validate();
  if (!valid) return;
  emit('transition', to);
}
</script>

<template>
  <Form
    :key="formKey"
    id="risk-detail-form"
    :validation-schema="validationSchema"
    :initial-values="initialValues"
    class="space-y-3"
    @submit="onSubmit"
  >
    <div class="rounded-lg border border-slate-200 dark:border-darkmode-600">
      <button
        type="button"
        class="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-darkmode-700"
        @click="toggleAccordion('registration')"
      >
        <span>{{ t('risk.section-registration') }}</span>
        <Lucide :icon="accordionOpen.registration ? 'ChevronUp' : 'ChevronDown'" class="!h-4 !w-4 text-slate-400" />
      </button>
      <div v-if="accordionOpen.registration" class="border-t border-slate-200 px-4 py-3 dark:border-darkmode-600">
        <RegistrationSection
          mode="readonly"
          :category-options="categoryOptions"
          :sub-category-options="subCategoryOptions"
          :member-options="memberOptions"
          :show-draft-description="false"
          :show-register-description="true"
        />
      </div>
    </div>

    <div class="rounded-lg border border-slate-200 dark:border-darkmode-600">
      <button
        type="button"
        class="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-darkmode-700"
        @click="toggleAccordion('analysis')"
      >
        <span>{{ t('risk.section-analysis') }}</span>
        <Lucide :icon="accordionOpen.analysis ? 'ChevronUp' : 'ChevronDown'" class="!h-4 !w-4 text-slate-400" />
      </button>
      <div v-if="accordionOpen.analysis" class="border-t border-slate-200 px-4 py-3 dark:border-darkmode-600">
        <AnalysisSection
          mode="readonly"
          :risk-type="risk.riskType as string"
          :impact-factor="risk.impactFactor as number | null"
          :impact="risk.impact as number | null"
          :likelihood="risk.likelihood as number | null"
          :inherent-score="risk.inherentScore as number | null"
          :risk-level="risk.riskLevel as string | null"
        />
      </div>
    </div>

    <div class="rounded-lg border border-slate-200 dark:border-darkmode-600">
      <button
        type="button"
        class="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-darkmode-700"
        @click="toggleAccordion('response')"
      >
        <span>{{ t('risk.section-response') }}</span>
        <Lucide :icon="accordionOpen.response ? 'ChevronUp' : 'ChevronDown'" class="!h-4 !w-4 text-slate-400" />
      </button>
      <div v-if="accordionOpen.response" class="border-t border-slate-200 px-4 py-3 dark:border-darkmode-600">
        <ResponseSection
          mode="editable"
          :risk-type="risk.riskType as string"
          :tasks="tasks"
          :saving-tasks="savingTasks"
          @update:tasks="emit('update:tasks', $event)"
        />
      </div>
    </div>

    <div class="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-darkmode-600">
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        :disabled="saving"
      >
        {{ t('risk.action.save-response') }}
      </Button>
    </div>
  </Form>
</template>
