<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue3-toastify';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import Button from '@/base-components/Button';
import { ermRepo } from '@/core/repositories/ermRepo';
import {
  resolveOperationsRiskProgressId,
  resolveOperationsTaskRowId,
} from '@/composables/taskClauseNavigation';
import { useUserStore } from '@/stores/user';
import RiskTodoRiskScorePreview from '../operations/status/RiskTodoRiskScorePreview.vue';
import { getRisk, getRiskStateKeyForLabel } from '../operations/riskStatusHelpers';
import { RISK_DOING_TASK_FORM_ID } from './riskDoingTaskFormId';

const props = defineProps<{
  row: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { t } = useI18n();
const router = useRouter();
const userStore = useUserStore();

const responseTypeOptions = ref<{ value: string; label: string }[]>([]);
const responseTypesLoading = ref(true);
const submitting = ref(false);

const scaleOptions = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: String(n),
}));

function mapResponseTypes(
  list: Record<string, unknown>[]
): { value: string; label: string }[] {
  return list
    .map((item) => {
      const value = item.value;
      if (value == null || value === '') return null;
      const title = item.title ?? item.label ?? value;
      return {
        value: String(value),
        label: typeof title === 'string' ? title : String(title),
      };
    })
    .filter((x): x is { value: string; label: string } => x != null);
}

function strField(v: unknown): string {
  if (v == null || v === '') return '';
  return String(v).trim();
}

function numToStr(v: unknown): string {
  if (v == null || v === '') return '';
  if (typeof v === 'number' && Number.isFinite(v)) return String(Math.trunc(v));
  return String(v).trim();
}

function buildInitialValues(row: Record<string, unknown>): Record<string, string> {
  const r = getRisk(row);
  const base = {
    risk_threat: '',
    risk_damage: '',
    risk_intensity: '',
    risk_effect: '',
    risk_response_type: '',
    risk_execution_percent: '',
    risk_proposed_action: '',
    comment: '',
  };
  if (!r) return base;
  return {
    risk_threat: strField(r.risk_threat),
    risk_damage: strField(r.risk_damage),
    risk_intensity: numToStr(r.risk_intensity),
    risk_effect: numToStr(r.risk_effect),
    risk_response_type: strField(r.risk_response_type),
    risk_execution_percent:
      r.risk_execution_percent != null && r.risk_execution_percent !== ''
        ? String(r.risk_execution_percent)
        : '',
    risk_proposed_action: strField(r.risk_proposed_action),
    comment: strField(r.comment),
  };
}

function resolveRiskUserId(row: Record<string, unknown>): string | null {
  const risk = row.risk as Record<string, unknown> | undefined;
  if (!risk) return null;
  const u = risk.user;
  if (u != null && typeof u === 'object' && !Array.isArray(u)) {
    const o = u as Record<string, unknown>;
    const id = o.id ?? o.user_id;
    if (id != null && id !== '') return String(id);
  }
  const uid = risk.user_id;
  if (uid != null && uid !== '') return String(uid);
  return null;
}

function resolveSubmitUserId(row: Record<string, unknown>): string {
  const fromRisk = resolveRiskUserId(row);
  if (fromRisk) return fromRisk;
  const cu = userStore.currentUser as Record<string, unknown> | null | undefined;
  if (cu?.id != null && cu.id !== '') return String(cu.id);
  return '';
}

function resolveRiskProgressPayloadLevel(row: Record<string, unknown>): string {
  const r = getRisk(row);
  if (!r) return 'todo';
  const key = getRiskStateKeyForLabel(r);
  if (key === 'doing') return 'done';
  return 'todo';
}

const validationSchema = computed(() =>
  yup.object({
    risk_threat: yup
      .string()
      .required(t('risk-operations.todo-validation-required')),
    risk_damage: yup
      .string()
      .required(t('risk-operations.todo-validation-required')),
    risk_intensity: yup
      .string()
      .oneOf(['1', '2', '3', '4', '5'])
      .required(t('risk-operations.todo-validation-required')),
    risk_effect: yup
      .string()
      .oneOf(['1', '2', '3', '4', '5'])
      .required(t('risk-operations.todo-validation-required')),
    risk_response_type: yup
      .string()
      .required(t('risk-operations.todo-validation-required')),
    risk_execution_percent: yup
      .string()
      .required(t('risk-operations.todo-validation-required'))
      .test(
        'percent-range',
        t('risk-operations.todo-validation-percent-range'),
        (v) => {
          if (v == null || v === '') return false;
          const n = Number(v);
          return Number.isFinite(n) && n >= 0 && n <= 100;
        }
      ),
    risk_proposed_action: yup
      .string()
      .required(t('risk-operations.todo-validation-required')),
    comment: yup
      .string()
      .required(t('risk-operations.todo-validation-required')),
  })
);

const initialValues = computed(() => buildInitialValues(props.row));

onMounted(async () => {
  responseTypesLoading.value = true;
  try {
    const res = await ermRepo.riskResponseTypeList({ page: 1, limit: 50 });
    const list = res?.data?.list ?? [];
    responseTypeOptions.value = mapResponseTypes(
      Array.isArray(list) ? (list as Record<string, unknown>[]) : []
    );
  } catch {
    toast(t('risk-operations.todo-response-type-load-error'), { type: 'error' });
    responseTypeOptions.value = [];
  } finally {
    responseTypesLoading.value = false;
  }
});

async function onSubmit(values: Record<string, unknown>) {
  const taskId = resolveOperationsTaskRowId(props.row);
  if (taskId == null) {
    toast(t('compliance-page.status-modal-no-task-data'), { type: 'error' });
    return;
  }

  const userId = resolveSubmitUserId(props.row);
  if (!userId) {
    toast(t('risk-operations.todo-validation-user'), { type: 'error' });
    return;
  }

  const progressIdRaw = resolveOperationsRiskProgressId(props.row);
  const progressId = progressIdRaw != null ? progressIdRaw : null;

  const pct = Number(values.risk_execution_percent);
  const intensity = Number(values.risk_intensity);
  const effect = Number(values.risk_effect);

  const r = getRisk(props.row);
  const typ = r?.type === 'parent' ? 'parent' : 'single';

  const payload: Record<string, unknown> = {
    task_id: taskId,
    user_id: userId,
    progress_id: progressId,
    level: resolveRiskProgressPayloadLevel(props.row),
    type: typ,
    risk_threat: String(values.risk_threat ?? '').trim(),
    risk_damage: String(values.risk_damage ?? '').trim(),
    risk_intensity: Number.isFinite(intensity) ? intensity : null,
    risk_effect: Number.isFinite(effect) ? effect : null,
    risk_response_type: String(values.risk_response_type ?? '').trim(),
    risk_execution_percent: Number.isFinite(pct) ? pct : null,
    risk_proposed_action: String(values.risk_proposed_action ?? '').trim(),
    comment: String(values.comment ?? '').trim(),
    time_deadline: '',
  };

  submitting.value = true;
  try {
    const result = await ermRepo.riskProgress(payload);
    if (result?.result) {
      toast(t('risk-operations.todo-submit-success'), { type: 'success' });
      emit('success');
    } else {
      toast(
        String(result?.error?.message ?? t('risk-operations.todo-submit-error')),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error ? e.message : t('risk-operations.todo-submit-error'),
      { type: 'error' }
    );
  } finally {
    submitting.value = false;
  }
}

function goBackToOperations() {
  void router.push({ name: 'app-risk-operations' });
}

const formRowKey = computed(() => {
  const id = resolveOperationsRiskProgressId(props.row);
  return id != null ? String(id) : 'no-risk';
});

defineExpose({
  submitting,
  responseTypesLoading,
});
</script>

<template>
  <div
    class="mt-6 border-t border-slate-200 pt-4 dark:border-darkmode-600"
  >
    <p
      class="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500"
    >
      {{ t('risk-operations.doing-task-form-section-title') }}
    </p>

    <div
      v-if="responseTypesLoading"
      class="py-4 text-center text-xs text-slate-500"
    >
      {{ t('general.loading') }}
    </div>

    <Form
      v-else
      :id="RISK_DOING_TASK_FORM_ID"
      :key="formRowKey"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-3"
      @submit="onSubmit"
    >
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <BaseInput
          name="risk_threat"
          type="textarea"
          :rows="2"
          :label="t('risk-operations.todo-field-threat')"
          :required="true"
        />
        <BaseInput
          name="risk_damage"
          type="textarea"
          :rows="2"
          :label="t('risk-operations.todo-field-damage')"
          :required="true"
        />
        <BaseSelect
          name="risk_intensity"
          :label="t('risk-operations.todo-field-intensity')"
          :options="scaleOptions"
          :placeholder="t('rule.form-select-placeholder')"
          :required="true"
          :filter="false"
        />
        <BaseSelect
          name="risk_effect"
          :label="t('risk-operations.todo-field-effect')"
          :options="scaleOptions"
          :placeholder="t('rule.form-select-placeholder')"
          :required="true"
          :filter="false"
        />
        <RiskTodoRiskScorePreview />
        <BaseSelect
          name="risk_response_type"
          :label="t('risk-operations.todo-field-strategy')"
          :options="responseTypeOptions"
          :placeholder="t('rule.form-select-placeholder')"
          :required="true"
          :disabled="responseTypeOptions.length === 0"
          :filter="true"
        />
        <BaseInput
          name="risk_execution_percent"
          type="number"
          :min="0"
          :max="100"
          :label="t('risk-operations.todo-field-execution-percent')"
          :placeholder="'0–100'"
          :required="true"
        />
      </div>

      <BaseInput
        name="risk_proposed_action"
        type="textarea"
        :rows="2"
        :label="t('risk-operations.todo-field-proposed-action')"
        :required="true"
      />

      <BaseInput
        name="comment"
        type="textarea"
        :rows="2"
        :label="t('risk-operations.todo-field-comment')"
        :placeholder="t('risk-operations.todo-comment-placeholder')"
        :required="true"
      />

      <div
        class="mt-4 flex w-full flex-wrap justify-end gap-2 border-t border-slate-200 pt-3 dark:border-darkmode-600"
      >
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          :disabled="submitting"
          @click="goBackToOperations"
        >
          {{ t('risk-operations.doing-task-form-back') }}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          :disabled="submitting"
        >
          {{ t('risk-operations.todo-submit') }}
        </Button>
      </div>
    </Form>
  </div>
</template>
