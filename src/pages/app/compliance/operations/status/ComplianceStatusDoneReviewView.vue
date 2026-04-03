<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { ermRepo } from '@/core/repositories/ermRepo';
import { resolveOperationsTaskRowId } from '@/composables/taskClauseNavigation';
import { getProgress, getProgressExecutorLabel } from '../complianceStatusHelpers';

const props = defineProps<{
  row: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { t } = useI18n();
const submitting = ref(false);

const liaisonNameDisplay = computed(() =>
  getProgressExecutorLabel(props.row)
);

/** فقط ۰ / ۵۰ / ۱۰۰؛ بقیه → بدون رنگ‌بندی */
function parseAnswerScoreBand(
  row: Record<string, unknown>
): 'red' | 'yellow' | 'green' | null {
  const p = getProgress(row);
  if (!p) return null;
  const s = p.answer_score;
  if (s == null || s === '') return null;
  const n =
    typeof s === 'number' ? s : Number(String(s).replace(/,/g, '.').trim());
  if (!Number.isFinite(n)) return null;
  if (n === 0) return 'red';
  if (n === 50) return 'yellow';
  if (n === 100) return 'green';
  return null;
}

const answerScoreBand = computed(() => parseAnswerScoreBand(props.row));

const answerScorePanelClass = computed(() => {
  switch (answerScoreBand.value) {
    case 'red':
      return 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40';
    case 'yellow':
      return 'border-amber-200 bg-amber-50 dark:border-amber-900/45 dark:bg-amber-950/35';
    case 'green':
      return 'border-green-200 bg-green-50 dark:border-green-900/45 dark:bg-green-950/35';
    default:
      return 'border-slate-200/90 bg-slate-50/80 dark:border-darkmode-600 dark:bg-darkmode-900/40';
  }
});

const answerScoreValueClass = computed(() => {
  switch (answerScoreBand.value) {
    case 'red':
      return 'text-xs font-semibold tabular-nums text-red-800 dark:text-red-200';
    case 'yellow':
      return 'text-xs font-semibold tabular-nums text-amber-900 dark:text-amber-200';
    case 'green':
      return 'text-xs font-semibold tabular-nums text-green-800 dark:text-green-200';
    default:
      return 'text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-100';
  }
});

const answerScoreColDividerClass = computed(() => {
  switch (answerScoreBand.value) {
    case 'red':
      return 'md:border-red-200/80 dark:md:border-red-900/40';
    case 'yellow':
      return 'md:border-amber-200/80 dark:md:border-amber-900/40';
    case 'green':
      return 'md:border-green-200/80 dark:md:border-green-900/40';
    default:
      return 'md:border-slate-200/80 dark:md:border-darkmode-600';
  }
});

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

function displayAnswerNote(row: Record<string, unknown>): string {
  const p = getProgress(row);
  if (!p) return '—';
  const n = p.answer_note;
  if (n == null || n === '') return '—';
  return typeof n === 'string' ? n : String(n);
}

function displayAnswerValue(row: Record<string, unknown>): string {
  const p = getProgress(row);
  if (!p) return '—';
  const v = p.answer_value;
  if (v == null || v === '') return '—';
  return typeof v === 'string' ? v : String(v);
}

function displayAnswerScore(row: Record<string, unknown>): string {
  const p = getProgress(row);
  if (!p) return '—';
  const s = p.answer_score;
  if (s == null || s === '') return '—';
  return typeof s === 'number' ? String(s) : String(s);
}

function buildProgressPayload(
  row: Record<string, unknown>,
  level: 'approve' | 'reject' | 'doing'
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
  if (uid == null) throw new Error('no user');

  const as = progress.answer_score;
  const av = progress.answer_value;
  const an = progress.answer_note;

  return {
    task_id: taskId,
    file_id: null,
    progress_id: Number.isFinite(pid) ? pid : null,
    level,
    user_id: uid,
    company_id: resolveCompanyId(progress),
    answer_score: as != null && as !== '' ? String(as) : '',
    answer_value: av != null ? String(av) : '',
    answer_note: an != null && an !== '' ? String(an) : '',
    type: progress.type === 'parent' ? 'parent' : 'single',
    target: null,
    time_deadline: '',
    comment: '',
  };
}

async function submitReview(level: 'approve' | 'reject') {
  const progress = getProgress(props.row);
  if (!progress) {
    toast(t('compliance-page.status-modal-no-task-data'), { type: 'error' });
    return;
  }
  submitting.value = true;
  try {
    const payload = buildProgressPayload(props.row, level);
    const result = await ermRepo.complianceProgress(payload);
    if (result?.result) {
      toast(
        level === 'approve'
          ? t('compliance-page.done-review-approve-success')
          : t('compliance-page.done-review-reject-success'),
        { type: 'success' }
      );
      emit('success');
    } else {
      toast(
        String(result?.error?.message ?? t('compliance-page.done-review-error')),
        { type: 'error' }
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'no user') {
      toast(t('compliance-page.doing-no-user'), { type: 'error' });
    } else {
      toast(
        e instanceof Error ? e.message : t('compliance-page.done-review-error'),
        { type: 'error' }
      );
    }
  } finally {
    submitting.value = false;
  }
}

async function submitRestartToDoing() {
  const progress = getProgress(props.row);
  if (!progress) {
    toast(t('compliance-page.status-modal-no-task-data'), { type: 'error' });
    return;
  }
  submitting.value = true;
  try {
    const payload = buildProgressPayload(props.row, 'doing');
    const result = await ermRepo.complianceProgress(payload);
    if (result?.result) {
      toast(t('compliance-page.reject-restart-success'), { type: 'success' });
      emit('success');
    } else {
      toast(
        String(result?.error?.message ?? t('compliance-page.reject-restart-error')),
        { type: 'error' }
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'no user') {
      toast(t('compliance-page.doing-no-user'), { type: 'error' });
    } else {
      toast(
        e instanceof Error ? e.message : t('compliance-page.reject-restart-error'),
        { type: 'error' }
      );
    }
  } finally {
    submitting.value = false;
  }
}

defineExpose({
  submitting,
  submitReview,
  submitRestartToDoing,
});
</script>

<template>
  <div class="mt-4 border-t border-slate-200 pt-3 dark:border-darkmode-600">
    <p
      class="mb-3 text-[11px] font-semibold tracking-[0.06em] text-slate-400 dark:text-slate-500"
    >
      <span>{{ t('compliance-page.done-review-section-title-prefix') }}</span>
      <span
        class="ms-1 inline font-bold text-slate-900 normal-case dark:text-slate-50"
      >{{ liaisonNameDisplay }}</span>
    </p>

    <div class="space-y-3">
      <div
        class="rounded-md border border-slate-200/90 bg-slate-50/80 px-2.5 py-2 dark:border-darkmode-600 dark:bg-darkmode-900/40"
      >
        <p
          class="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
        >
          {{ t('compliance-page.done-label-answer-note') }}
        </p>
        <p
          class="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-800 dark:text-slate-100"
        >
          {{ displayAnswerNote(row) }}
        </p>
      </div>

      <div
        class="grid grid-cols-1 gap-3 rounded-md border px-2.5 py-2 md:grid-cols-2 md:gap-4"
        :class="answerScorePanelClass"
      >
        <div class="min-w-0">
          <p
            class="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
          >
            {{ t('compliance-page.done-label-answer-value') }}
          </p>
          <p
            class="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-800 dark:text-slate-100"
          >
            {{ displayAnswerValue(row) }}
          </p>
        </div>
        <div
          class="min-w-0 md:border-s md:ps-4"
          :class="answerScoreColDividerClass"
        >
          <p
            class="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
          >
            {{ t('compliance-page.done-label-answer-score') }}
          </p>
          <p :class="answerScoreValueClass">
            {{ displayAnswerScore(row) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
