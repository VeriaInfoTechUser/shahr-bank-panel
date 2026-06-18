<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { useTaskTransitionActions, type TaskTransitionAction } from '@/composables/useTaskTransitionActions';
import type { TaskTransitionType } from '@/composables/useTaskTransition';
import TaskTransitionModal from './TaskTransitionModal.vue';

const props = defineProps<{
  task: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { t } = useI18n();

const taskState = () => {
  const state = props.task?.state;
  return typeof state === 'string' ? state : null;
};

const { availableActions, hasActions, isTerminal } = useTaskTransitionActions(taskState);

const showModal = ref(false);
const selectedTransition = ref<TaskTransitionType | null>(null);

function openTransitionModal(action: TaskTransitionAction) {
  selectedTransition.value = action.type;
  showModal.value = true;
}

function onModalClose() {
  selectedTransition.value = null;
}

function onSuccess() {
  emit('success');
}
</script>

<template>
  <div v-if="hasActions && !isTerminal" class="flex flex-wrap gap-2">
    <Button
      v-for="action in availableActions"
      :key="action.type"
      :variant="action.variant"
      size="sm"
      @click="openTransitionModal(action)"
    >
      <Lucide :icon="action.icon" class="mr-1 h-3.5 w-3.5" />
      {{ action.label }}
    </Button>
  </div>

  <div
    v-else-if="isTerminal"
    class="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
  >
    <Lucide icon="CheckCircle" class="h-3.5 w-3.5" />
    {{ t('task-transition.status-terminal') }}
  </div>

  <TaskTransitionModal
    v-if="selectedTransition"
    :show="showModal"
    :task="task"
    :transition="selectedTransition"
    @update:show="showModal = $event"
    @close="onModalClose"
    @success="onSuccess"
  />
</template>