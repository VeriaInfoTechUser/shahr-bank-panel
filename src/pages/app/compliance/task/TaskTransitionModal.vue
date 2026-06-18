<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Form, useField, useForm } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { useTaskTransition, type TaskTransitionType } from '@/composables/useTaskTransition';
import { ermRepo } from '@/core/repositories/ermRepo';

const props = defineProps<{
  show: boolean;
  task: Record<string, unknown> | null;
  transition: TaskTransitionType;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const { submitting, executeTransition } = useTaskTransition();
const formKey = ref(0);
const formId = 'task-transition-form';

const memberOptions = ref<{ value: string; label: string }[]>([]);
const membersLoading = ref(true);

const taskTitle = computed(() => {
  if (!props.task) return '';
  return String(props.task.title ?? props.task.controlTitle ?? '');
});

const taskSlug = computed(() => {
  if (!props.task) return '';
  return String(props.task.slug ?? '');
});

const transitionTitle = computed(() => {
  return t(`task-transition.action-${props.transition}`);
});

function buildValidationSchema() {
  const schema: Record<string, yup.StringSchema> = {};

  if (props.transition === 'start') {
    schema.assigneeId = yup
      .string()
      .trim()
      .required(t('task-transition.error-assignee-required'));
  }

  if (props.transition === 'approve') {
    schema.answer = yup
      .string()
      .trim()
      .required(t('task-transition.error-answer-required'));
    schema.answerDescription = yup.string().trim().optional();
  }

  if (props.transition === 'reject') {
    schema.comment = yup
      .string()
      .trim()
      .required(t('task-transition.error-comment-required'));
    schema.answerDescription = yup.string().trim().optional();
  }

  if (props.transition === 'done' || props.transition === 'reopen') {
    schema.comment = yup.string().trim().optional();
  }

  return yup.object(schema);
}

function buildInitialValues() {
  return {
    assigneeId: '',
    answer: '',
    answerDescription: '',
    comment: '',
  };
}

const validationSchema = computed(() => buildValidationSchema());

const { values, resetForm } = useForm({
  validationSchema,
  initialValues: buildInitialValues(),
});

const { value: assigneeIdValue } = useField<string>('assigneeId');
const { value: answerValue } = useField<string>('answer');
const { value: answerDescriptionValue } = useField<string>('answerDescription');
const { value: commentValue } = useField<string>('comment');

watch(
  () => [props.show, props.task, props.transition] as const,
  ([show]) => {
    if (!show) return;
    resetForm({ values: buildInitialValues() });
    formKey.value += 1;
  },
  { immediate: true }
);

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

watch(
  () => props.show,
  async (show) => {
    if (!show) return;
    if (props.transition === 'start') {
      membersLoading.value = true;
      try {
        const res = await ermRepo.memberList({ page: 1, limit: 500 });
        const list = res?.data?.list ?? [];
        memberOptions.value = mapMembers(
          Array.isArray(list) ? (list as Record<string, unknown>[]) : []
        );
      } catch {
        toast(t('compliance-task.users-load-error'), { type: 'error' });
        memberOptions.value = [];
      } finally {
        membersLoading.value = false;
      }
    }
  }
);

const answerOptions = [
  { value: 'compliant', label: t('task-transition.answer-compliant') },
  { value: 'partially', label: t('task-transition.answer-partially') },
  { value: 'non_compliant', label: t('task-transition.answer-non-compliant') },
];

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
  if (!v) emit('close');
}

async function onSubmit(formValues: Record<string, unknown>) {
  if (!taskSlug.value) {
    toast(t('task-transition.error-no-slug'), { type: 'error' });
    return;
  }

  const payload: Record<string, unknown> = {};

  switch (props.transition) {
    case 'start':
      payload.assigneeId = String(formValues.assigneeId ?? '').trim();
      break;
    case 'approve':
      payload.answer = String(formValues.answer ?? '').trim();
      payload.answerDescription = String(formValues.answerDescription ?? '').trim();
      break;
    case 'reject':
      payload.comment = String(formValues.comment ?? '').trim();
      payload.answerDescription = String(formValues.answerDescription ?? '').trim();
      break;
    case 'done':
    case 'reopen':
      payload.comment = String(formValues.comment ?? '').trim();
      break;
  }

  const success = await executeTransition(taskSlug.value, props.transition, payload);
  if (success) {
    emit('success');
    close();
  }
}

function showAssigneeField() {
  return props.transition === 'start';
}

function showAnswerField() {
  return props.transition === 'approve';
}

function showAnswerDescriptionField() {
  return props.transition === 'approve' || props.transition === 'reject';
}

function showCommentField() {
  return ['done', 'reject', 'reopen'].includes(props.transition);
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="transitionTitle"
    size="md"
    @update:visible="onDialogVisible"
  >
    <div v-if="!task" class="py-8 text-center text-xs text-slate-400">
      {{ t('general.no-data') }}
    </div>

    <template v-else>
      <div class="mb-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          {{ taskTitle }}
        </p>
      </div>

      <Form
        :key="formKey"
        :id="formId"
        :validation-schema="validationSchema"
        :initial-values="buildInitialValues()"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div v-if="showAssigneeField()">
          <div v-if="membersLoading" class="py-4 text-center text-xs text-slate-500">
            {{ t('general.loading') }}
          </div>
          <BaseSelect
            v-else
            name="assigneeId"
            :label="t('task-transition.field-assignee')"
            :options="memberOptions"
            :placeholder="t('rule.form-select-placeholder')"
            :required="true"
            :disabled="memberOptions.length === 0"
            :filter="true"
          />
        </div>

        <div v-if="showAnswerField()">
          <BaseSelect
            name="answer"
            :label="t('task-transition.field-answer')"
            :options="answerOptions"
            :placeholder="t('rule.form-select-placeholder')"
            :required="true"
            :filter="false"
          />
        </div>

        <div v-if="showAnswerDescriptionField()">
          <BaseInput
            name="answerDescription"
            type="textarea"
            :rows="2"
            :label="t('task-transition.field-answer-description')"
            :placeholder="t('task-transition.field-answer-description-placeholder')"
          />
        </div>

        <div v-if="showCommentField()">
          <BaseInput
            name="comment"
            type="textarea"
            :rows="3"
            :label="t('task-transition.field-comment')"
            :placeholder="t('task-transition.field-comment-placeholder')"
            :required="transition === 'reject'"
          />
        </div>
      </Form>
    </template>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          :disabled="submitting"
          @click="close"
        >
          {{ t('general.cancel') }}
        </Button>
        <Button
          type="submit"
          :variant="transition === 'reject' ? 'danger' : 'primary'"
          size="sm"
          :form="formId"
          :disabled="submitting"
        >
          <Lucide v-if="submitting" icon="Loader2" class="mr-1 h-3.5 w-3.5 animate-spin" />
          <Lucide v-else :icon="transition === 'reject' ? 'X' : 'Check'" class="mr-1 h-3.5 w-3.5" />
          {{ transitionTitle }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>