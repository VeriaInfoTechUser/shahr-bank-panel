<script setup lang="ts">
import { computed, ref } from 'vue';
import { Form, useForm } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import RegistrationSection from '../sections/RegistrationSection.vue';
import AnalysisSection from '../sections/AnalysisSection.vue';

const props = defineProps<{
  formKey: number;
  initialValues: Record<string, unknown>;
  risk: Record<string, unknown>;
  categoryOptions: { value: string; label: string }[];
  subCategoryOptions: { value: string; label: string }[];
  memberOptions: { value: string; label: string }[];
  selectedCategorySlug: string;
  saving: boolean;
  transitioning: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', values: Record<string, unknown>): void;
  (e: 'categoryChange', value: unknown): void;
  (e: 'transition', to: string): void;
}>();

const { t } = useI18n();
const { setFieldValue, validate } = useForm();

const accordionOpen = ref({
  registration: true,
  analysis: true,
});

const validationSchema = computed(() => yup.object({
  title: yup.string().trim().required(t('validation.required')),
  riskType: yup.string().trim().required(t('validation.required')),
  categorySlug: yup.string().trim().required(t('validation.required')),
  subCategorySlug: yup.string().trim().required(t('validation.required')),
  impact: yup.string().required(t('validation.required')),
  likelihood: yup.string().required(t('validation.required')),
}));

function toggleAccordion(section: 'registration' | 'analysis') {
  accordionOpen.value[section] = !accordionOpen.value[section];
}

function onScoreUpdate(score: number | null) {
  setFieldValue('inherentScore', score != null ? String(score) : '');
}

function onLevelUpdate(level: string) {
  setFieldValue('riskLevel', level);
}

async function onSubmit(values: Record<string, unknown>) {
  emit('submit', values);
}

async function handleTransition(to: string) {
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
          mode="editable"
          :risk-type="risk.riskType as string"
          :impact-factor="risk.impactFactor as number | null"
          :impact="risk.impact as number | null"
          :likelihood="risk.likelihood as number | null"
          :inherent-score="risk.inherentScore as number | null"
          :risk-level="risk.riskLevel as string | null"
          @update:score="onScoreUpdate"
          @update:level="onLevelUpdate"
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
        {{ t('risk.action.save-analysis') }}
      </Button>
      <Button
        type="button"
        variant="primary"
        size="sm"
        :disabled="saving || transitioning"
        @click="handleTransition('response')"
      >
        {{ t('risk.action-send-response') }}
      </Button>
    </div>
  </Form>
</template>
