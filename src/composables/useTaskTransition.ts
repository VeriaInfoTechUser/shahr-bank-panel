import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { grcRepo } from '@/core/repositories/grcRepo';

export type TaskTransitionType = 'start' | 'done' | 'approve' | 'reject' | 'reopen';

export interface TaskTransitionPayload {
  assigneeId?: string;
  comment?: string;
  description?: string;
  answer?: string;
  answerKey?: string;
  answerDescription?: string;
  updatedBy?: number;
}

export function useTaskTransition() {
  const { t } = useI18n();
  const submitting = ref(false);

  async function executeTransition(
    slug: string,
    transition: TaskTransitionType,
    payload: TaskTransitionPayload = {}
  ): Promise<boolean> {
    if (!slug) {
      toast(t('task-transition.error-no-slug'), { type: 'error' });
      return false;
    }

    submitting.value = true;
    try {
      let result;

      switch (transition) {
        case 'start':
          if (!payload.assigneeId) {
            toast(t('task-transition.error-assignee-required'), { type: 'error' });
            return false;
          }
          result = await grcRepo.taskStart(slug, {
            assigneeId: payload.assigneeId,
            comment: payload.comment,
            updatedBy: payload.updatedBy,
          });
          break;

        case 'done':
          result = await grcRepo.taskDone(slug, {
            comment: payload.comment,
            description: payload.description,
            updatedBy: payload.updatedBy,
          });
          break;

        case 'approve':
          if (!payload.answer) {
            toast(t('task-transition.error-answer-required'), { type: 'error' });
            return false;
          }
          result = await grcRepo.taskApprove(slug, {
            answer: payload.answer,
            answerKey: payload.answerKey,
            answerDescription: payload.answerDescription,
            comment: payload.comment,
            updatedBy: payload.updatedBy,
          });
          break;

        case 'reject':
          if (!payload.comment) {
            toast(t('task-transition.error-comment-required'), { type: 'error' });
            return false;
          }
          result = await grcRepo.taskReject(slug, {
            comment: payload.comment,
            answer: payload.answer,
            answerDescription: payload.answerDescription,
            updatedBy: payload.updatedBy,
          });
          break;

        case 'reopen':
          result = await grcRepo.taskReopen(slug, {
            comment: payload.comment,
            assigneeId: payload.assigneeId,
            updatedBy: payload.updatedBy,
          });
          break;

        default:
          toast(t('task-transition.error-invalid-transition'), { type: 'error' });
          return false;
      }

      if (result?.result) {
        toast(t(`task-transition.${transition}-success`), { type: 'success' });
        return true;
      } else {
        const errorMsg = result?.error?.[0] ?? t(`task-transition.${transition}-error`);
        toast(errorMsg, { type: 'error' });
        return false;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : t(`task-transition.${transition}-error`);
      toast(message, { type: 'error' });
      return false;
    } finally {
      submitting.value = false;
    }
  }

  return {
    submitting,
    executeTransition,
  };
}