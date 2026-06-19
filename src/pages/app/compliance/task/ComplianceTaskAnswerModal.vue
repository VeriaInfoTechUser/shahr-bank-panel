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

const answerOptions = computed<AnswerOption[]>(() => {
  const raw = props.task?.answerList;
  if (!Array.isArray(raw)) return [];
  return raw as AnswerOption[];
});

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

const validationSchema = computed(() =>
  yup.object({
    answer_key: yup.string().trim().optional(),
    comment: yup.string().trim().optional(),
  })
);

function buildInitialValues(task: Record<string, unknown> | null) {
  return {
    answer_key: String(task?.answerKey ?? ''),
    comment: '',
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

async function onDone() {
  const slug = getSlug();
  if (!slug) return;

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
    @update:visible="onDialogVisible"
  >
    <div v-if="!task" class="py-8 text-center text-xs text-slate-400">
      {{ t('general.no-data') }}
    </div>

    <template v-else>
      <div class="mb-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          {{ t('compliance-task.answer-section-title') }}
        </p>
      </div>

      <div class="space-y-4">
        <div
          v-if="task.controlSummary"
          class="rounded-md border border-slate-200/90 bg-slate-50/80 px-3 py-2.5 dark:border-darkmode-600 dark:bg-darkmode-900/40"
        >
          <p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
            {{ t('compliance-task.answer-control-description') }}
          </p>
          <p class="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            {{ task.controlSummary }}
          </p>
        </div>

        <div v-if="answerOptions.length" class="space-y-1.5">
          <span class="text-xs font-medium text-slate-600 dark:text-slate-300">
            {{ t('compliance-task.answer-options-label') }}
          </span>
          <div class="flex flex-col gap-2">
            <label
              v-for="opt in answerOptions"
              :key="opt.key"
              class="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition"
              :class="[
                answerKeyValue === opt.key
                  ? 'border-primary/40 bg-primary/5 dark:border-primary/30 dark:bg-primary/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-darkmode-600 dark:bg-darkmode-800 dark:hover:border-darkmode-500',
              ]"
            >
              <input
                type="radio"
                name="answer_key"
                class="mt-0.5 h-4 w-4 shrink-0 border-slate-300 text-primary focus:ring-primary"
                :checked="answerKeyValue === opt.key"
                @change="selectAnswer(opt.key)"
              />
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {{ opt.title }}
                </div>
                <div
                  v-if="opt.description"
                  class="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400"
                >
                  {{ opt.description }}
                </div>
                <div class="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                  {{ t('compliance-task.answer-score-label') }}: {{ opt.score }}
                </div>
              </div>
            </label>
          </div>
          <p v-if="answerKeyError" class="text-xs text-error">
            {{ answerKeyError }}
          </p>
        </div>

        <div
          v-else
          class="rounded-md border border-amber-200/90 bg-amber-50/80 px-2.5 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
        >
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
      <div class="flex flex-wrap justify-end gap-2">
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
