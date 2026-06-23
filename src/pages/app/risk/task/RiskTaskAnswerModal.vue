<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { grcRepo } from '@/core/repositories/grcRepo';

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

const taskTitle = computed(() => {
  if (!props.task) return '';
  return String(props.task.title ?? '');
});

const taskState = computed(() => {
  if (!props.task) return null;
  return String(props.task.state ?? '').trim().toLowerCase() || null;
});

const showStartButton = computed(() => taskState.value === 'todo');
const showDoneButton = computed(() => taskState.value === 'in_progress');
const showApproveRejectButtons = computed(() => taskState.value === 'done');
const showReopenButton = computed(() => taskState.value === 'rejected');
const commentReadonly = computed(() => taskState.value === 'approved');

const stateBadge = computed(() => {
  switch (taskState.value) {
    case 'todo':
      return { label: t('task-transition.state-todo'), tone: 'slate' };
    case 'in_progress':
      return { label: t('task-transition.state-in-progress'), tone: 'blue' };
    case 'done':
      return { label: t('task-transition.state-done'), tone: 'emerald' };
    case 'rejected':
      return { label: t('task-transition.state-rejected'), tone: 'rose' };
    default:
      return null;
  }
});

const validationSchema = computed(() =>
  yup.object({
    comment: yup.string().trim().required(t('validation.required')),
  })
);

function buildInitialValues(task: Record<string, unknown> | null) {
  return {
    comment: String(task?.comment ?? ''),
  };
}

const { values, resetForm, validate: validateForm } = useForm({
  validationSchema,
  initialValues: buildInitialValues(props.task),
});

watch(
  () => [props.show, props.task] as const,
  ([show, task]) => {
    if (!show || !task) return;
    resetForm({ values: buildInitialValues(task) });
  },
  { immediate: true }
);

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

function buildPayload(): Record<string, unknown> {
  return { comment: String(values.comment ?? '') };
}

async function onStart() {
  const slug = getSlug();
  if (!slug) return;
  saving.value = true;
  try {
    const res = await grcRepo.riskTaskUpdate(slug, {
      comment: String(values.comment ?? ''),
      state: 'in_progress',
    });
    if (res?.result) {
      toast(t('task-transition.start-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(res?.error?.[0] ?? t('task-transition.start-error'), { type: 'error' });
    }
  } catch (err: unknown) {
    toast(err instanceof Error ? err.message : t('general.error'), { type: 'error' });
  } finally {
    saving.value = false;
  }
}

async function onUpdate() {
  const slug = getSlug();
  if (!slug) return;
  saving.value = true;
  try {
    const res = await grcRepo.riskTaskUpdate(slug, buildPayload());
    if (res?.result) {
      toast(t('task-transition.update-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(res?.error?.[0] ?? t('task-transition.update-error'), { type: 'error' });
    }
  } catch (err: unknown) {
    toast(err instanceof Error ? err.message : t('general.error'), { type: 'error' });
  } finally {
    saving.value = false;
  }
}

async function onDone() {
  const slug = getSlug();
  if (!slug) return;
  const { valid } = await validateForm();
  if (!valid) return;
  saving.value = true;
  try {
    const res = await grcRepo.riskTaskUpdate(slug, {
      comment: String(values.comment ?? ''),
      state: 'done',
    });
    if (res?.result) {
      toast(t('task-transition.done-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(res?.error?.[0] ?? t('task-transition.done-error'), { type: 'error' });
    }
  } catch (err: unknown) {
    toast(err instanceof Error ? err.message : t('general.error'), { type: 'error' });
  } finally {
    saving.value = false;
  }
}

async function onApprove() {
  const slug = getSlug();
  if (!slug) return;
  saving.value = true;
  try {
    const res = await grcRepo.riskTaskUpdate(slug, {
      comment: String(values.comment ?? ''),
      state: 'approved',
    });
    if (res?.result) {
      toast(t('task-transition.approve-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(res?.error?.[0] ?? t('task-transition.approve-error'), { type: 'error' });
    }
  } catch (err: unknown) {
    toast(err instanceof Error ? err.message : t('general.error'), { type: 'error' });
  } finally {
    saving.value = false;
  }
}

async function onReject() {
  const slug = getSlug();
  if (!slug) return;
  saving.value = true;
  try {
    const res = await grcRepo.riskTaskUpdate(slug, {
      comment: String(values.comment ?? ''),
      state: 'rejected',
    });
    if (res?.result) {
      toast(t('task-transition.reject-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(res?.error?.[0] ?? t('task-transition.reject-error'), { type: 'error' });
    }
  } catch (err: unknown) {
    toast(err instanceof Error ? err.message : t('general.error'), { type: 'error' });
  } finally {
    saving.value = false;
  }
}

async function onReopen() {
  const slug = getSlug();
  if (!slug) return;
  saving.value = true;
  try {
    const res = await grcRepo.riskTaskUpdate(slug, {
      comment: String(values.comment ?? ''),
      state: 'in_progress',
    });
    if (res?.result) {
      toast(t('task-transition.reopen-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(res?.error?.[0] ?? t('task-transition.reopen-error'), { type: 'error' });
    }
  } catch (err: unknown) {
    toast(err instanceof Error ? err.message : t('general.error'), { type: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="taskTitle"
    size="sm"
    @update:visible="onDialogVisible"
  >
    <div v-if="!task" class="flex flex-col items-center gap-2 py-12 text-center">
      <Lucide icon="Inbox" class="h-8 w-8 text-slate-300 dark:text-slate-600" />
      <p class="text-xs text-slate-400">{{ t('general.no-data') }}</p>
    </div>

    <template v-else>
      <div class="mb-4 flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {{ t('risk-task.comment-section-title') }}
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
        <div
          v-if="task.description"
          class="rounded-xl border border-white/60 bg-white/50 px-4 py-3 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-white/[0.03]"
        >
          <p class="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
            <Lucide icon="FileText" class="h-3 w-3" />
            {{ t('risk-task.task-description-label') }}
          </p>
          <p class="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
            {{ task.description }}
          </p>
        </div>

        <BaseInput
          name="comment"
          type="textarea"
          :rows="4"
          :disabled="commentReadonly"
          :label="t('risk-task.comment-label')"
          :placeholder="t('risk-task.comment-placeholder')"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline-secondary" size="sm" :disabled="saving" @click="close">
          {{ t('general.cancel') }}
        </Button>

        <Button v-if="showStartButton" type="button" variant="primary" size="sm" :disabled="saving" @click="onStart">
          <Lucide v-if="saving" icon="Loader2" class="mr-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="Save" class="mr-1 h-3.5 w-3.5" />
          {{ t('button.save') }}
        </Button>

        <Button v-if="showDoneButton" type="button" variant="primary" size="sm" :disabled="saving" @click="onUpdate">
          <Lucide v-if="saving" icon="Loader2" class="mr-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="Save" class="mr-1 h-3.5 w-3.5" />
          {{ t('button.save') }}
        </Button>

        <Button v-if="showDoneButton" type="button" variant="success" size="sm" class="text-white" :disabled="saving" @click="onDone">
          <Lucide v-if="saving" icon="Loader2" class="mr-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="CheckCircle" class="mr-1 h-3.5 w-3.5" />
          {{ t('task-transition.action-done') }}
        </Button>

        <Button v-if="showApproveRejectButtons" type="button" variant="danger" size="sm" :disabled="saving" @click="onReject">
          <Lucide v-if="saving" icon="Loader2" class="mr-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="X" class="mr-1 h-3.5 w-3.5" />
          {{ t('task-transition.action-reject') }}
        </Button>

        <Button v-if="showApproveRejectButtons" type="button" variant="success" size="sm" class="text-white" :disabled="saving" @click="onApprove">
          <Lucide v-if="saving" icon="Loader2" class="mr-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="Check" class="mr-1 h-3.5 w-3.5" />
          {{ t('task-transition.action-approve') }}
        </Button>

        <Button v-if="showReopenButton" type="button" variant="warning" size="sm" :disabled="saving" @click="onReopen">
          <Lucide v-if="saving" icon="Loader2" class="mr-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else icon="RotateCcw" class="mr-1 h-3.5 w-3.5" />
          {{ t('task-transition.action-reopen') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
