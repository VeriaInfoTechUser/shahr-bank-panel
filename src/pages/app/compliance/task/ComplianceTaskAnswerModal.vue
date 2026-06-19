<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Form, useField, useForm } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { grcRepo } from '@/core/repositories/grcRepo';

interface AnswerOption {
  key: string;
  score: number;
  title: string;
  description: string | null;
}

interface AnswerOptionView extends AnswerOption {
  percent: number;
  dashoffset: number;
  tone: 'success' | 'warning' | 'danger';
}

const props = defineProps<{
  show: boolean;
  task: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const saving = ref(false);

// Gauge geometry — radius 16 circle
const GAUGE_RADIUS = 16;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

const answerOptions = computed<AnswerOption[]>(() => {
  const raw = props.task?.answerList;
  if (!Array.isArray(raw)) return [];
  return raw as AnswerOption[];
});

// Percentage is relative to the highest score among the available options
// for this control (highest score => 100%). Adjust here if `score` is
// already a 0-100 value and should be shown as-is.
const maxScore = computed(() => {
  const scores = answerOptions.value.map((o) => o.score ?? 0);
  return Math.max(1, ...scores);
});

function toneFor(percent: number): AnswerOptionView['tone'] {
  if (percent >= 66) return 'success';
  if (percent >= 33) return 'warning';
  return 'danger';
}

const answerOptionsView = computed<AnswerOptionView[]>(() =>
    answerOptions.value.map((opt) => {
      const percent = Math.max(
          0,
          Math.min(100, Math.round(((opt.score ?? 0) / maxScore.value) * 100))
      );
      const dashoffset =
          GAUGE_CIRCUMFERENCE - (GAUGE_CIRCUMFERENCE * percent) / 100;
      return { ...opt, percent, dashoffset, tone: toneFor(percent) };
    })
);

const taskTitle = computed(() => {
  if (!props.task) return '';
  return String(props.task.title ?? props.task.controlTitle ?? '');
});

const taskState = computed(() => {
  if (!props.task) return null;
  return String(props.task.state ?? '').trim().toLowerCase() || null;
});

const showStartButton = computed(() => taskState.value === 'todo');
const showDoneButton = computed(() => taskState.value === 'in_progress');
const showApproveRejectButtons = computed(() => taskState.value === 'done');
const showReopenButton = computed(() => taskState.value === 'rejected');

const stateBadge = computed(() => {
  switch (taskState.value) {
    case 'todo':
      return { label: t('task-transition.state-todo') ?? 'To do', tone: 'slate' };
    case 'in_progress':
      return { label: t('task-transition.state-in-progress') ?? 'In progress', tone: 'blue' };
    case 'done':
      return { label: t('task-transition.state-done') ?? 'Done', tone: 'emerald' };
    case 'rejected':
      return { label: t('task-transition.state-rejected') ?? 'Rejected', tone: 'rose' };
    default:
      return null;
  }
});

const validationSchema = computed(() =>
    yup.object({
      answer_key: yup.string().trim().optional(),
      comment: yup.string().trim().optional(),
    })
);

function buildInitialValues(task: Record<string, unknown> | null) {
  return {
    answer_key: String(task?.answerKey ?? ''),
    comment: String(task?.comment ?? ''),
  };
}

const { values, setFieldError, resetForm, handleSubmit } = useForm({
  validationSchema,
  initialValues: buildInitialValues(props.task),
});

const { value: answerKeyValue, errorMessage: answerKeyError } =
    useField<string>('answer_key');

watch(
    () => [props.show, props.task] as const,
    ([show, task]) => {
      if (!show || !task) return;
      resetForm({ values: buildInitialValues(task) });
    },
    { immediate: true }
);

function selectAnswer(key: string) {
  answerKeyValue.value = key;
  setFieldError('answer_key', undefined);
}

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
  if (!v) emit('close');
}

function getSlug(): string | null {
  if (!props.task) return null;
  const slug = String(props.task.slug ?? '');
  return slug || null;
}

const onSubmit = handleSubmit(async (formValues) => {
  const slug = getSlug();
  if (!slug) return;

  saving.value = true;
  try {
    const selectedKey = String(formValues.answer_key ?? '').trim();
    const selectedOption = selectedKey
        ? answerOptions.value.find((o) => o.key === selectedKey)
        : undefined;

    const payload: Record<string, unknown> = {};

    const note = String(formValues.comment ?? '').trim();
    if (note) {
      payload.comment = note;
    }

    if (selectedKey) {
      payload.answerKey = selectedKey;
      payload.answer = selectedKey;
      if (selectedOption) {
        payload.answerScore = selectedOption.score;
        payload.answerTitle = selectedOption.title;
        if (selectedOption.description) {
          payload.answerDescription = selectedOption.description;
        }
      }
    }

    const res = await grcRepo.taskStart(slug, payload);
    if (res?.result) {
      toast(t('task-transition.start-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(res?.error?.[0] ?? t('task-transition.start-error'), { type: 'error' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('general.error');
    toast(message, { type: 'error' });
  } finally {
    saving.value = false;
  }
});

async function onUpdate() {
  const slug = getSlug();
  if (!slug) return;

  saving.value = true;
  try {
    const selectedKey = answerKeyValue.value || '';
    const selectedOption = selectedKey
        ? answerOptions.value.find((o) => o.key === selectedKey)
        : undefined;

    const payload: Record<string, unknown> = {};

    const note = values.comment?.trim();
    if (note) {
      payload.comment = note;
    }

    if (selectedKey) {
      payload.answerKey = selectedKey;
      payload.answer = selectedKey;
      if (selectedOption) {
        payload.answerScore = selectedOption.score;
        payload.answerTitle = selectedOption.title;
        if (selectedOption.description) {
          payload.answerDescription = selectedOption.description;
        }
      }
    }

    const res = await grcRepo.complianceTaskUpdate(slug, payload);
    if (res?.result) {
      toast(t('task-transition.update-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(res?.error?.[0] ?? t('task-transition.update-error'), { type: 'error' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('general.error');
    toast(message, { type: 'error' });
  } finally {
    saving.value = false;
  }
}

async function onDone() {
  const slug = getSlug();
  if (!slug) return;

  if (!answerKeyValue.value) {
    setFieldError('answer_key', t('compliance-task.answer-select-hint'));
    return;
  }

  saving.value = true;
  try {
    const res = await grcRepo.taskDone(slug);
    if (res?.result) {
      toast(t('task-transition.done-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(res?.error?.[0] ?? t('task-transition.done-error'), { type: 'error' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('general.error');
    toast(message, { type: 'error' });
  } finally {
    saving.value = false;
  }
}

async function onApprove() {
  const slug = getSlug();
  if (!slug) return;

  saving.value = true;
  try {
    const selectedKey = answerKeyValue.value || '';
    const selectedOption = selectedKey
        ? answerOptions.value.find((o) => o.key === selectedKey)
        : undefined;

    const payload: Record<string, unknown> = {};

    const note = values.comment?.trim();
    if (note) {
      payload.comment = note;
    }

    if (selectedKey) {
      payload.answer = selectedKey;
      payload.answerKey = selectedKey;
      if (selectedOption) {
        payload.answerScore = selectedOption.score;
        payload.answerTitle = selectedOption.title;
        if (selectedOption.description) {
          payload.answerDescription = selectedOption.description;
        }
      }
    }

    const res = await grcRepo.taskApprove(slug, payload);
    if (res?.result) {
      toast(t('task-transition.approve-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(res?.error?.[0] ?? t('task-transition.approve-error'), { type: 'error' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('general.error');
    toast(message, { type: 'error' });
  } finally {
    saving.value = false;
  }
}

async function onReject() {
  const slug = getSlug();
  if (!slug) return;

  saving.value = true;
  try {
    const payload: Record<string, unknown> = {};

    const note = values.comment?.trim();
    if (note) {
      payload.comment = note;
    }

    const res = await grcRepo.taskReject(slug, payload);
    if (res?.result) {
      toast(t('task-transition.reject-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(res?.error?.[0] ?? t('task-transition.reject-error'), { type: 'error' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('general.error');
    toast(message, { type: 'error' });
  } finally {
    saving.value = false;
  }
}

async function onReopen() {
  const slug = getSlug();
  if (!slug) return;

  saving.value = true;
  try {
    const res = await grcRepo.taskReopen(slug);
    if (res?.result) {
      toast(t('task-transition.reopen-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(res?.error?.[0] ?? t('task-transition.reopen-error'), { type: 'error' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('general.error');
    toast(message, { type: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
      :visible="show"
      :title="taskTitle"
      size="md"
      panel-class="glass-panel"
      @update:visible="onDialogVisible"
  >
    <div v-if="!task" class="flex flex-col items-center gap-2 py-12 text-center">
      <Lucide icon="Inbox" class="h-8 w-8 text-slate-300 dark:text-slate-600" />
      <p class="text-xs text-slate-400">{{ t('general.no-data') }}</p>
    </div>

    <template v-else>
      <!-- Header: section label + status badge -->
      <div class="mb-5 flex items-center justify-between">
     <span class="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {{ t('compliance-task.answer-options-label') }}
              <span class="text-rose-500">*</span>
            </span>
        <span
            v-if="stateBadge"
            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset"
            :class="{
            'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300': stateBadge.tone === 'slate',
            'bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300': stateBadge.tone === 'blue',
            'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300': stateBadge.tone === 'emerald',
            'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300': stateBadge.tone === 'rose',
          }"
        >
          <span
              class="h-1.5 w-1.5 rounded-full"
              :class="{
              'bg-slate-500': stateBadge.tone === 'slate',
              'bg-blue-500': stateBadge.tone === 'blue',
              'bg-emerald-500': stateBadge.tone === 'emerald',
              'bg-rose-500': stateBadge.tone === 'rose',
            }"
          />
          {{ stateBadge.label }}
        </span>
      </div>

      <div class="space-y-4">
        <!-- Control summary card -->
        <div
            v-if="task.controlSummary"
            class="rounded-xl border border-white/60 bg-white/50 px-4 py-3 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-white/[0.03]"
        >
          <p class="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
            <Lucide icon="FileText" class="h-3 w-3" />
            {{ t('compliance-task.answer-control-description') }}
          </p>
          <p class="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
            {{ task.controlSummary }}
          </p>
        </div>

        <!-- Answer options -->
        <div v-if="answerOptionsView.length" class="space-y-2">
          <div class="flex items-center justify-between">
            <span
                v-if="!answerKeyValue"
                class="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400"
            >
              <Lucide icon="MousePointerClick" class="h-3 w-3" />
              {{ t('compliance-task.answer-select-hint') ?? 'یک گزینه را انتخاب کنید' }}
            </span>
          </div>

          <div class="flex flex-col gap-2.5">
            <label
                v-for="opt in answerOptionsView"
                :key="opt.key"
                class="group relative flex cursor-pointer items-center gap-3.5 overflow-hidden rounded-xl border px-4 py-3.5 backdrop-blur-md transition-all duration-200"
                :class="[
                answerKeyValue === opt.key
                  ? 'border-primary/60 bg-primary/10 shadow-[0_4px_18px_-4px_rgba(59,130,246,0.35)] dark:border-primary/40 dark:bg-primary/10'
                  : 'border-white/60 bg-white/40 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-white/65 hover:shadow-md dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/15 dark:hover:bg-white/[0.05]',
              ]"
            >
              <!-- left accent bar -->
              <span
                  class="absolute inset-y-0 left-0 w-1 rounded-r-full transition-opacity"
                  :class="[
                  answerKeyValue === opt.key ? 'opacity-100' : 'opacity-30 group-hover:opacity-60',
                  {
                    'bg-emerald-500': opt.tone === 'success',
                    'bg-amber-500': opt.tone === 'warning',
                    'bg-rose-500': opt.tone === 'danger',
                  },
                ]"
              />

              <!-- Custom radio indicator -->
              <span class="relative shrink-0">
                <span
                    class="flex h-5.5 w-5.5 items-center justify-center rounded-full border-2 transition-all duration-200"
                    :class="
                    answerKeyValue === opt.key
                      ? 'scale-105 border-primary bg-primary'
                      : 'border-slate-300 bg-white/80 group-hover:border-primary/50 dark:border-slate-600 dark:bg-transparent'
                  "
                >
                  <Lucide
                      v-if="answerKeyValue === opt.key"
                      icon="Check"
                      class="h-3 w-3 text-white"
                      style="animation: pop-in 0.18s ease-out"
                  />
                </span>
              </span>
              <input
                  type="radio"
                  name="answer_key"
                  class="sr-only"
                  :checked="answerKeyValue === opt.key"
                  @change="selectAnswer(opt.key)"
              />

              <!-- Title + description -->
              <div class="min-w-0 flex-1">
                <div class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {{ opt.title }}
                </div>
                <div
                    v-if="opt.description"
                    class="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400"
                >
                  {{ opt.description }}
                </div>
              </div>

              <!-- Percentage gauge -->
              <div class="relative flex shrink-0 items-center justify-center">
                <svg width="42" height="42" viewBox="0 0 40 40" class="-rotate-90">
                  <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke-width="3.5"
                      class="stroke-slate-200 dark:stroke-white/10"
                  />
                  <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke-width="3.5"
                      stroke-linecap="round"
                      :stroke-dasharray="2 * Math.PI * 16"
                      :stroke-dashoffset="opt.dashoffset"
                      class="transition-all duration-500"
                      :class="{
                      'stroke-emerald-500': opt.tone === 'success',
                      'stroke-amber-500': opt.tone === 'warning',
                      'stroke-rose-500': opt.tone === 'danger',
                    }"
                  />
                </svg>
                <span
                    class="absolute text-[10px] font-bold tabular-nums"
                    :class="{
                    'text-emerald-600 dark:text-emerald-400': opt.tone === 'success',
                    'text-amber-600 dark:text-amber-400': opt.tone === 'warning',
                    'text-rose-600 dark:text-rose-400': opt.tone === 'danger',
                  }"
                >
                  {{ opt.percent }}%
                </span>
              </div>
            </label>
          </div>

          <p v-if="answerKeyError" class="flex items-center gap-1 text-xs text-error">
            <Lucide icon="AlertCircle" class="h-3 w-3" />
            {{ answerKeyError }}
          </p>
        </div>

        <!-- No options warning -->
        <div
            v-else
            class="flex items-start gap-2 rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-2.5 text-xs text-amber-800 backdrop-blur-md dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200"
        >
          <Lucide icon="AlertTriangle" class="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {{ t('compliance-task.answer-no-options') }}
        </div>

        <BaseInput
            name="comment"
            type="textarea"
            :rows="3"
            :label="t('compliance-task.answer-note-label')"
            :placeholder="t('compliance-task.answer-note-placeholder')"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            :disabled="saving"
            @click="close"
        >
          {{ t('general.cancel') }}
        </Button>

        <Button
            v-if="showStartButton"
            type="button"
            variant="primary"
            size="sm"
            :disabled="saving"
            @click="onSubmit"
        >
          <Lucide v-if="saving" icon="Loader2" class="mr-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="Save" class="mr-1 h-3.5 w-3.5" />
          {{ t('button.save') }}
        </Button>

        <Button
            v-if="showDoneButton"
            type="button"
            variant="primary"
            size="sm"
            :disabled="saving"
            @click="onUpdate"
        >
          <Lucide v-if="saving" icon="Loader2" class="mr-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="Save" class="mr-1 h-3.5 w-3.5" />
          {{ t('button.save') }}
        </Button>

        <Button
            v-if="showDoneButton"
            type="button"
            variant="success"
            size="sm"
            :disabled="saving"
            @click="onDone"
        >
          <Lucide v-if="saving" icon="Loader2" class="mr-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="CheckCircle" class="mr-1 h-3.5 w-3.5" />
          {{ t('task-transition.action-done') }}
        </Button>

        <Button
            v-if="showApproveRejectButtons"
            type="button"
            variant="danger"
            size="sm"
            :disabled="saving"
            @click="onReject"
        >
          <Lucide v-if="saving" icon="Loader2" class="mr-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="X" class="mr-1 h-3.5 w-3.5" />
          {{ t('task-transition.action-reject') }}
        </Button>

        <Button
            v-if="showApproveRejectButtons"
            type="button"
            variant="success"
            size="sm"
            :disabled="saving"
            @click="onApprove"
        >
          <Lucide v-if="saving" icon="Loader2" class="mr-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="Check" class="mr-1 h-3.5 w-3.5" />
          {{ t('task-transition.action-approve') }}
        </Button>

        <Button
            v-if="showReopenButton"
            type="button"
            variant="warning"
            size="sm"
            :disabled="saving"
            @click="onReopen"
        >
          <Lucide v-if="saving" icon="Loader2" class="mr-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="RotateCcw" class="mr-1 h-3.5 w-3.5" />
          {{ t('task-transition.action-reopen') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
:deep(.glass-panel) {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
      0 8px 32px rgba(15, 23, 42, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.dark :deep(.glass-panel) {
  background: rgba(30, 35, 48, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

@keyframes pop-in {
  from {
    transform: scale(0.4);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>