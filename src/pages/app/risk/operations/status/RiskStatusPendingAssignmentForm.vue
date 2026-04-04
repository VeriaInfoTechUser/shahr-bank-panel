<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import BaseDatePicker from '@/core/ui/base/BaseDatePicker.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import {
  resolveOperationsRiskProgressId,
  resolveOperationsTaskRowId,
} from '@/composables/taskClauseNavigation';
import { RISK_PENDING_ASSIGNMENT_FORM_ID } from './riskPendingAssignmentFormId';

const props = defineProps<{
  row: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { t } = useI18n();

const memberOptions = ref<{ value: string; label: string }[]>([]);
const membersLoading = ref(true);
const submitting = ref(false);

function ymdToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const validationSchema = computed(() =>
  yup.object({
    referral_type: yup
      .string()
      .oneOf(['single', 'group'])
      .required(),
    liaison_single: yup.string().when('referral_type', {
      is: 'single',
      then: (s) => s.required(t('compliance-page.referral-validation-liaison')),
      otherwise: (s) => s.optional(),
    }),
    liaison_group: yup.array().when('referral_type', {
      is: 'group',
      then: (s) =>
        s
          .of(yup.string())
          .min(1, t('compliance-page.referral-validation-liaison'))
          .required(),
      otherwise: (s) => s.optional(),
    }),
    time_deadline: yup
      .string()
      .required(t('compliance-page.referral-validation-deadline'))
      .test(
        'min-today',
        t('compliance-page.referral-validation-deadline-past'),
        (v) => {
          if (!v || typeof v !== 'string') return false;
          return v >= ymdToday();
        }
      ),
    comment: yup.string().optional(),
  })
);

const initialValues = {
  referral_type: 'single',
  liaison_single: '',
  liaison_group: [] as string[],
  time_deadline: '',
  comment: '',
};

function onReferralChange(
  next: 'single' | 'group',
  setFieldValue: (f: string, v: unknown) => void
) {
  setFieldValue('referral_type', next);
  if (next === 'single') {
    setFieldValue('liaison_group', []);
  } else {
    setFieldValue('liaison_single', '');
  }
}

function mapMembers(list: Record<string, unknown>[]): { value: string; label: string }[] {
  return list
    .map((m) => {
      const id = m.id ?? m.user_id;
      if (id == null) return null;
      const label =
        [m.name, m.full_name, m.email, m.mobile]
          .find((x) => typeof x === 'string' && String(x).trim()) ?? String(id);
      return { value: String(id), label: String(label).trim() };
    })
    .filter((x): x is { value: string; label: string } => x != null);
}

onMounted(async () => {
  membersLoading.value = true;
  try {
    const res = await ermRepo.memberList({ page: 1, limit: 500 });
    const list = res?.data?.list ?? [];
    memberOptions.value = mapMembers(
      Array.isArray(list) ? (list as Record<string, unknown>[]) : []
    );
  } catch {
    toast(t('compliance-page.referral-members-load-error'), { type: 'error' });
    memberOptions.value = [];
  } finally {
    membersLoading.value = false;
  }
});

async function onSubmit(values: Record<string, unknown>) {
  const taskId = resolveOperationsTaskRowId(props.row);
  if (taskId == null) {
    toast(t('compliance-page.status-modal-no-task-data'), { type: 'error' });
    return;
  }

  const progressIdRaw = resolveOperationsRiskProgressId(props.row);
  const progressId = progressIdRaw != null ? progressIdRaw : null;

  const referralType = values.referral_type as string;
  const userId =
    referralType === 'single'
      ? String(values.liaison_single ?? '').trim()
      : (values.liaison_group as string[])
          .map((x) => String(x).trim())
          .filter(Boolean)
          .join(',');

  const progressType = referralType === 'group' ? 'parent' : 'single';

  const payload: Record<string, unknown> = {
    task_id: taskId,
    user_id: userId,
    level: 'todo',
    risk_intensity: null,
    risk_threat: null,
    risk_damage: null,
    risk_response_type: null,
    risk_execution_percent: null,
    risk_proposed_action: null,
    risk_effect: null,
    type: progressType,
    time_deadline: String(values.time_deadline ?? '').trim(),
    comment: String(values.comment ?? '').trim(),
    progress_id: progressId,
  };

  submitting.value = true;
  try {
    const result = await ermRepo.riskProgress(payload);
    if (result?.result) {
      toast(t('risk-operations.pending-assignment-submit-success'), { type: 'success' });
      emit('success');
    } else {
      toast(
        String(
          result?.error?.message ?? t('risk-operations.pending-assignment-submit-error')
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error ? e.message : t('risk-operations.pending-assignment-submit-error'),
      { type: 'error' }
    );
  } finally {
    submitting.value = false;
  }
}

defineExpose({
  submitting,
  membersLoading,
});
</script>

<template>
  <div class="mt-4 border-t border-slate-200 pt-3 dark:border-darkmode-600">
    <p
      class="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500"
    >
      {{ t('compliance-page.referral-section-title') }}
    </p>

    <div
      v-if="membersLoading"
      class="py-4 text-center text-xs text-slate-500"
    >
      {{ t('general.loading') }}
    </div>

    <Form
      v-else
      :id="RISK_PENDING_ASSIGNMENT_FORM_ID"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-3"
      @submit="onSubmit"
      v-slot="{ values, setFieldValue }"
    >
      <div class="space-y-1.5">
        <span
          class="text-xs font-medium text-slate-600 dark:text-slate-300"
        >
          {{ t('compliance-page.referral-type-label') }}
          <span class="text-error">*</span>
        </span>
        <div class="flex flex-wrap gap-4">
          <label
            class="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-200"
          >
            <input
              type="radio"
              name="referral_type_risk"
              class="h-3.5 w-3.5 border-slate-300 text-primary focus:ring-primary"
              :checked="values.referral_type === 'single'"
              @change="onReferralChange('single', setFieldValue)"
            />
            {{ t('compliance-page.referral-type-single') }}
          </label>
          <label
            class="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-200"
          >
            <input
              type="radio"
              name="referral_type_risk"
              class="h-3.5 w-3.5 border-slate-300 text-primary focus:ring-primary"
              :checked="values.referral_type === 'group'"
              @change="onReferralChange('group', setFieldValue)"
            />
            {{ t('compliance-page.referral-type-group') }}
          </label>
        </div>
      </div>

      <BaseSelect
        v-if="values.referral_type === 'single'"
        name="liaison_single"
        :label="t('compliance-page.referral-liaison-label')"
        :options="memberOptions"
        :placeholder="t('rule.form-select-placeholder')"
        :required="true"
        :disabled="memberOptions.length === 0"
        :filter="true"
      />

      <BaseMultiSelect
        v-else
        name="liaison_group"
        :label="t('compliance-page.referral-liaison-label')"
        :options="memberOptions"
        :placeholder="t('rule.form-select-placeholder')"
        :required="true"
        :disabled="memberOptions.length === 0"
      />

      <BaseDatePicker
        name="time_deadline"
        :label="t('compliance-page.referral-deadline-label')"
        :required="true"
      />

      <BaseInput
        name="comment"
        type="textarea"
        :rows="2"
        :label="t('risk-operations.pending-assignment-comment-label')"
        :placeholder="t('risk-operations.pending-assignment-comment-placeholder')"
      />
    </Form>
  </div>
</template>
