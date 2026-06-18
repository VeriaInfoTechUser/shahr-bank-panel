import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TaskTransitionType } from './useTaskTransition';

export interface TaskTransitionAction {
  type: TaskTransitionType;
  label: string;
  variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  icon: string;
  requiresInput: boolean;
  inputType?: 'assignee' | 'answer' | 'comment';
}

export function useTaskTransitionActions(taskState: () => string | null | undefined) {
  const { t } = useI18n();

  const availableActions = computed<TaskTransitionAction[]>(() => {
    const state = taskState();

    switch (state) {
      case 'todo':
        return [];

      case 'in-progress':
        return [
          {
            type: 'done',
            label: t('task-transition.action-done'),
            variant: 'success',
            icon: 'CheckCircle',
            requiresInput: false,
          },
        ];

      case 'done':
        return [
          {
            type: 'approve',
            label: t('task-transition.action-approve'),
            variant: 'success',
            icon: 'Check',
            requiresInput: true,
            inputType: 'answer',
          },
          {
            type: 'reject',
            label: t('task-transition.action-reject'),
            variant: 'danger',
            icon: 'X',
            requiresInput: true,
            inputType: 'comment',
          },
        ];

      case 'reject':
        return [
          {
            type: 'reopen',
            label: t('task-transition.action-reopen'),
            variant: 'warning',
            icon: 'RotateCcw',
            requiresInput: false,
          },
        ];

      case 'approve':
        return [];

      default:
        return [];
    }
  });

  const hasActions = computed(() => availableActions.value.length > 0);
  const isTerminal = computed(() => taskState() === 'approve');

  return {
    availableActions,
    hasActions,
    isTerminal,
  };
}