<script setup lang="ts">
import { computed, ref, unref, watch } from 'vue';
import { useField, useForm } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue3-toastify';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import Button from '@/base-components/Button';
import { ermRepo } from '@/core/repositories/ermRepo';
import { resolveOperationsTaskRowId } from '@/composables/taskClauseNavigation';
import {
  extractRuleAnswerOptions,
  getProgress,
  getTaskDescription,
  type RuleAnswerOption,
} from '../operations/complianceStatusHelpers';

const props = defineProps<{
  row: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { t } = useI18n();
const router = useRouter();
const submitting = ref(false);

const answerOptions = computed(() => extractRuleAnswerOptions(props.row));
const taskDescription = computed(() => getTaskDescription(props.row));

const notePlaceholder = computed(() =>
  taskDescription.value
    ? t('compliance-page.doing-note-placeholder-supplement')
    : t('compliance-page.doing-note-placeholder')
);

function serializeOption(opt: RuleAnswerOption): string {
  return JSON.stringify({ score: opt.score, value: opt.value });
}

function parseChoice(s: string): { score: string; value: string } | null {
  if (!s || typeof s !== 'string') return null;
  try {
    const o = JSON.parse(s) as { score?: unknown; value?: unknown };
    if (!o || typeof o !== 'object') return null;
    return {
      score: String(o.score ?? ''),
      value: String(o.value ?? ''),
    };
  } catch {
    return null;
  }
}

function buildInitialValues(row: Record<string, unknown>): {
  answer_note: string;
  answer_choice: string;
  answer_score_manual: string;
} {
  const progress = getProgress(row);
  const opts = extractRuleAnswerOptions(row);
  let answer_choice = '';
  if (progress && opts.length > 0) {
    const rawVal = progress.answer_value;
    const valueStr =
      typeof rawVal === 'string' ? rawVal.trim() : String(rawVal ?? '').trim();

    if (valueStr !== '') {
      const byValue = opts.find((o) => String(o.value) === valueStr);
      if (byValue) {
        answer_choice = serializeOption(byValue);
      } else {
        const rawScore = progress.answer_score;
        const scoreStr =
          rawScore === null || rawScore === undefined || rawScore === ''
            ? ''
            : String(rawScore);
        if (scoreStr !== '') {
          const byScore = opts.find((o) => String(o.score) === scoreStr);
          if (byScore) answer_choice = serializeOption(byScore);
        }
      }
    }
  }

  let answer_note = '';
  if (progress && progress.answer_note != null && progress.answer_note !== '') {
    const n = progress.answer_note;
    answer_note = typeof n === 'string' ? n : String(n);
  }

  let answer_score_manual = '';
  if (progress && progress.answer_score != null && progress.answer_score !== '') {
    answer_score_manual = String(progress.answer_score);
  }

  return { answer_note, answer_choice, answer_score_manual };
}

const validationSchema = computed(() =>
  yup.object({
    answer_note: yup.string().optional(),
    answer_choice: yup.string().optional(),
    answer_score_manual: yup.string().optional(),
  })
);

const { values, setFieldError, resetForm } = useForm({
  validationSchema,
  initialValues: buildInitialValues(props.row),
});

function clearAnswerFieldErrors() {
  setFieldError('answer_note', undefined);
  setFieldError('answer_choice', undefined);
  setFieldError('answer_score_manual', undefined);
}

watch(
  () => props.row,
  (row) => {
    if (!row || typeof row !== 'object') return;
    resetForm({ values: buildInitialValues(row) });
  },
  { deep: true, immediate: true }
);

const { value: answerChoice, errorMessage: answerChoiceError } =
  useField<string>('answer_choice');
const { value: answerScoreManual, errorMessage: answerScoreManualError } =
  useField<string>('answer_score_manual');

function resolveUserId(progress: Record<string, unknown>): number | null {
  const u = progress.user;
  if (u && typeof u === 'object' && !Array.isArray(u)) {
    const o = u as Record<string, unknown>;
    const id = o.id ?? o.user_id;
    if (id != null && id !== '') {
      const n = typeof id === 'number' ? id : Number(id);
      if (Number.isFinite(n)) return n;
    }
  }
  const u2 = progress.user_id;
  if (u2 != null && u2 !== '') {
    const n = typeof u2 === 'number' ? u2 : Number(u2);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function resolveCompanyId(progress: Record<string, unknown>): number | null {
  const c = progress.company_id;
  if (c == null || c === '') return null;
  const n = typeof c === 'number' ? c : Number(c);
  return Number.isFinite(n) ? n : null;
}

/**
 * امتیاز/مقدار پاسخ: اگر فیلد عددی پر باشد همان برای answer_score و answer_value؛
 * وگرنه از گزینهٔ رادیویی.
 */
function buildPayload(
  row: Record<string, unknown>,
  vals: {
    answer_note: string;
    answer_choice: string;
    answer_score_manual: string;
  },
  level: 'doing' | 'done'
) {
  const progress = getProgress(row);
  if (!progress) throw new Error('no progress');
  const taskId = resolveOperationsTaskRowId(row);
  if (taskId == null) throw new Error('no task');
  const pidRaw = progress.id;
  const pid =
    pidRaw != null && pidRaw !== ''
      ? Number(pidRaw)
      : NaN;
  const uid = resolveUserId(progress);
  if (uid == null) {
    throw new Error('no user');
  }
  const typ =
    progress.type === 'parent' ? 'parent' : 'single';

  const parsed = parseChoice(vals.answer_choice);
  const manual = String(vals.answer_score_manual ?? '').trim();
  let answer_score = '';
  let answer_value = '';
  if (manual !== '') {
    answer_score = manual;
    answer_value = manual;
  } else {
    answer_score = parsed ? parsed.score : '';
    answer_value = parsed ? parsed.value : '';
  }

  return {
    task_id: taskId,
    file_id: null,
    progress_id: Number.isFinite(pid) ? pid : null,
    level,
    user_id: uid,
    company_id: resolveCompanyId(progress),
    answer_score,
    answer_value,
    answer_note: String(vals.answer_note ?? '').trim(),
    type: typ,
    target: null,
    time_deadline: '',
    comment: '',
  };
}

async function runSubmit(
  level: 'doing' | 'done',
  vals: {
    answer_note: string;
    answer_choice: string;
    answer_score_manual: string;
  }
) {
  const progress = getProgress(props.row);
  if (!progress) {
    toast(t('compliance-page.status-modal-no-task-data'), { type: 'error' });
    return;
  }
  submitting.value = true;
  try {
    const payload = buildPayload(props.row, vals, level);
    const result = await ermRepo.complianceProgress(payload);
    if (result?.result) {
      toast(
        level === 'done'
          ? t('compliance-page.doing-send-success')
          : t('compliance-page.doing-register-success'),
        { type: 'success' }
      );
      emit('success');
    } else {
      toast(
        String(result?.error?.message ?? t('compliance-page.doing-submit-error')),
        { type: 'error' }
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'no user') {
      toast(t('compliance-page.doing-no-user'), { type: 'error' });
    } else {
      toast(
        e instanceof Error ? e.message : t('compliance-page.doing-submit-error'),
        { type: 'error' }
      );
    }
  } finally {
    submitting.value = false;
  }
}

async function submitRegister() {
  clearAnswerFieldErrors();
  const v = unref(values) as Record<string, unknown>;
  await runSubmit('doing', {
    answer_note: String(v.answer_note ?? ''),
    answer_choice: String(v.answer_choice ?? ''),
    answer_score_manual: String(v.answer_score_manual ?? ''),
  });
}

async function submitSend() {
  clearAnswerFieldErrors();
  const v = unref(values) as Record<string, unknown>;
  const note = String(v.answer_note ?? '').trim();
  const choice = String(v.answer_choice ?? '').trim();
  const scoreManual = String(v.answer_score_manual ?? '').trim();

  let invalid = false;
  if (!note) {
    setFieldError(
      'answer_note',
      t('compliance-page.doing-validation-note-required-send')
    );
    invalid = true;
  }
  if (!choice) {
    setFieldError(
      'answer_choice',
      t('compliance-page.doing-validation-status-required')
    );
    invalid = true;
  }
  if (!scoreManual) {
    setFieldError(
      'answer_score_manual',
      t('compliance-page.doing-task-validation-score-required')
    );
    invalid = true;
  }
  if (invalid) return;

  if (!answerOptions.value.length) {
    setFieldError(
      'answer_choice',
      t('compliance-page.doing-no-answer-options')
    );
    return;
  }

  if (Number.isNaN(Number(scoreManual.replace(',', '.')))) {
    setFieldError(
      'answer_score_manual',
      t('compliance-page.doing-task-validation-score-number')
    );
    return;
  }

  await runSubmit('done', {
    answer_note: note,
    answer_choice: choice,
    answer_score_manual: scoreManual,
  });
}

function goBackToOperations() {
  void router.push({ name: 'app-compliance-operations' });
}

defineExpose({
  submitting,
  submitRegister,
  submitSend,
});
</script>

<template>
  <div
    class="mt-6 border-t border-slate-200 pt-4 dark:border-darkmode-600"
  >
    <div
      v-if="!answerOptions.length"
      class="mb-3 rounded-md border border-amber-200/90 bg-amber-50/80 px-2.5 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
    >
      {{ t('compliance-page.doing-no-answer-options-hint') }}
    </div>

    <div class="space-y-3">
      <div
        v-if="taskDescription"
        class="rounded-md border border-slate-200/90 bg-slate-50/80 px-2.5 py-2 dark:border-darkmode-600 dark:bg-darkmode-900/40"
      >
        <p
          class="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
        >
          {{ t('compliance-page.doing-task-description-title') }}
        </p>
        <p
          class="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 dark:text-slate-200"
        >
          {{ taskDescription }}
        </p>
      </div>

      <BaseInput
        name="answer_note"
        type="textarea"
        :rows="4"
        :label="t('compliance-page.doing-note-label')"
        :placeholder="notePlaceholder"
      />

      <div v-if="answerOptions.length" class="space-y-1.5">
        <span class="text-xs font-medium text-slate-600 dark:text-slate-300">
          {{ t('compliance-page.doing-status-label') }}
          <span class="text-error">*</span>
        </span>
        <div class="flex flex-col gap-2">
          <label
            v-for="(opt, idx) in answerOptions"
            :key="`${opt.score}-${opt.value}-${idx}`"
            class="flex cursor-pointer items-start gap-2 text-xs text-slate-700 dark:text-slate-200"
          >
            <input
              type="radio"
              name="answer_choice_doing_task"
              class="mt-0.5 h-3.5 w-3.5 shrink-0 border-slate-300 text-primary focus:ring-primary"
              :checked="answerChoice === serializeOption(opt)"
              @change="
                () => {
                  answerChoice = serializeOption(opt);
                  setFieldError('answer_choice', undefined);
                }
              "
            />
            <span class="leading-snug">{{ opt.label }}</span>
          </label>
        </div>
        <p
          v-if="answerChoiceError"
          class="text-xs text-error"
        >
          {{ answerChoiceError }}
        </p>
      </div>

      <BaseInput
        name="answer_score_manual"
        type="number"
        :label="t('compliance-page.doing-task-form-score-label')"
        :placeholder="t('compliance-page.doing-task-form-score-placeholder')"
      />
      <p
        v-if="answerScoreManualError"
        class="text-xs text-error"
      >
        {{ answerScoreManualError }}
      </p>
      <p class="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
        {{ t('compliance-page.doing-task-form-score-hint') }}
      </p>
    </div>

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
        {{ t('compliance-page.doing-task-form-back') }}
      </Button>
      <Button
        type="button"
        variant="outline-primary"
        size="sm"
        :disabled="submitting"
        @click="submitRegister()"
      >
        {{ t('compliance-page.doing-footer-register') }}
      </Button>
      <Button
        type="button"
        variant="primary"
        size="sm"
        :disabled="submitting"
        @click="submitSend()"
      >
        {{ t('compliance-page.doing-footer-send') }}
      </Button>
    </div>
  </div>
</template>
