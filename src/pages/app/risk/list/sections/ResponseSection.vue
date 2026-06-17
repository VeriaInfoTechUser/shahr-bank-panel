<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import type { RiskTask } from '../useRisk';

const props = defineProps<{
  mode: 'editable' | 'readonly';
  riskType: string;
  tasks: RiskTask[];
  savingTasks: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:tasks', tasks: RiskTask[]): void;
}>();

const { t } = useI18n();
const newTaskTitle = ref('');

const disabled = computed(() => props.mode === 'readonly');

const threatStrategyOptions = computed(() => [
  { value: 'reduce', label: t('risk.strategy-reduce') },
  { value: 'accept', label: t('risk.strategy-accept') },
  { value: 'transfer', label: t('risk.strategy-transfer') },
  { value: 'avoid', label: t('risk.strategy-avoid') },
]);

const opportunityStrategyOptions = computed(() => [
  { value: 'exploit', label: t('risk.strategy-exploit') },
  { value: 'share', label: t('risk.strategy-share') },
  { value: 'enhance', label: t('risk.strategy-enhance') },
]);

const strategyOptions = computed(() =>
  props.riskType === 'opportunity' ? opportunityStrategyOptions.value : threatStrategyOptions.value
);

const taskStatusOptions = computed(() => [
  { value: 'todo', label: t('risk.task-todo') },
  { value: 'in-progress', label: t('risk.task-in-progress') },
  { value: 'done', label: t('risk.task-done') },
]);

function addTask() {
  const title = newTaskTitle.value.trim();
  if (!title) return;
  const updated = [...props.tasks, { title, status: 'todo' as const }];
  emit('update:tasks', updated);
  newTaskTitle.value = '';
}

function removeTask(index: number) {
  const updated = props.tasks.filter((_, i) => i !== index);
  emit('update:tasks', updated);
}

function toggleTaskStatus(index: number) {
  const current = props.tasks[index];
  if (!current) return;
  const next = current.status === 'todo' ? 'in-progress' : current.status === 'in-progress' ? 'done' : 'todo';
  const updated = props.tasks.map((t, i) => i === index ? { ...t, status: next as RiskTask['status'] } : t);
  emit('update:tasks', updated);
}

function taskStatusBadgeClass(status: string): string {
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[9px] font-semibold leading-snug shadow-sm cursor-pointer select-none';
  switch (status) {
    case 'todo': return `${base} bg-orange-100 text-orange-800 border border-orange-200`;
    case 'in-progress': return `${base} bg-violet-100 text-violet-800 border border-violet-200`;
    case 'done': return `${base} bg-sky-100 text-sky-800 border border-sky-200`;
    default: return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
      <BaseSelect
        name="treatmentStrategy"
        :label="t('risk.field-treatment-strategy')"
        :options="strategyOptions"
        :required="true"
        :disabled="disabled"
      />
      <BaseInput
        name="framework"
        :label="t('risk.field-framework')"
        :disabled="disabled"
        :placeholder="t('risk.field-framework-placeholder')"
      />
      <BaseInput
        name="control"
        :label="t('risk.field-control')"
        :disabled="disabled"
        :placeholder="t('risk.field-control-placeholder')"
      />
    </div>

    <div v-if="mode === 'editable'" class="space-y-2">
      <label class="label min-h-0 py-1">
        <span class="label-text text-sm font-normal leading-snug">{{ t('risk.field-tasks') }}</span>
      </label>
      <div class="flex gap-2">
        <input
          v-model="newTaskTitle"
          type="text"
          class="input input-bordered flex-1 !h-8 !min-h-0 px-2.5 text-xs font-light leading-snug placeholder:text-slate-400"
          :placeholder="t('risk.task-add-placeholder')"
          @keydown.enter.prevent="addTask"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          class="!h-8"
          :disabled="!newTaskTitle.trim()"
          @click="addTask"
        >
          <Lucide icon="Plus" class="!h-3.5 !w-3.5" />
        </Button>
      </div>
      <div v-if="props.tasks.length > 0" class="space-y-1">
        <div
          v-for="(task, index) in props.tasks"
          :key="index"
          class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-darkmode-600 dark:bg-darkmode-800"
        >
          <span class="flex-1 text-slate-700 dark:text-slate-200">{{ task.title }}</span>
          <span :class="taskStatusBadgeClass(task.status)" @click="toggleTaskStatus(index)">
            {{ t(`risk.task-${task.status}`) }}
          </span>
          <button
            type="button"
            class="text-slate-400 hover:text-red-500 transition"
            :disabled="props.savingTasks"
            @click="removeTask(index)"
          >
            <Lucide icon="Trash2" class="!h-3 !w-3" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
