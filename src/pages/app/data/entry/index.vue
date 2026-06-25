<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { grc_base_url } from '@/constants/config';

const { t } = useI18n();

const fileInputRef = ref<HTMLInputElement | null>(null);

const cards = [
  {
    key: 'json',
    title: () => t('data-entry.json-title'),
    description: () => t('data-entry.json-description'),
    sample: '{ "title": "Asset 1", "type": "facility" }',
    badge: () => t('data-entry.json-badge'),
    actionLabel: () => t('data-entry.action-json'),
    color: 'text-primary',
    bg: 'bg-primary-muted',
    onClick: () => openJsonDialog(),
  },
  {
    key: 'excel',
    title: () => t('data-entry.excel-title'),
    description: () => t('data-entry.excel-description'),
    sample: '.xlsx, .csv',
    badge: () => t('data-entry.excel-badge'),
    actionLabel: () => t('data-entry.action-excel'),
    color: 'text-success',
    bg: 'bg-success',
    onClick: () => openFilePicker(),
  },
  {
    key: 'api',
    title: () => t('data-entry.api-title'),
    description: () => t('data-entry.api-description'),
    sample: `${grc_base_url}governance`,
    badge: () => t('data-entry.api-badge'),
    actionLabel: () => t('data-entry.action-api'),
    color: 'text-info',
    bg: 'bg-info',
    onClick: () => copyApiUrl(),
  },
  {
    key: 'workflow',
    title: () => t('data-entry.workflow-title'),
    description: () => t('data-entry.workflow-description'),
    sample: t('data-entry.workflow-sample'),
    badge: () => t('data-entry.workflow-badge'),
    actionLabel: () => t('data-entry.action-workflow'),
    color: 'text-warning',
    bg: 'bg-warning',
    onClick: () => startWorkflow(),
  },
];

const showJsonModal = ref(false);
const jsonInput = ref('');

function openJsonDialog() {
  jsonInput.value = '';
  showJsonModal.value = true;
}

function submitJson() {
  if (!jsonInput.value.trim()) {
    toast(t('data-entry.json-empty-error'), { type: 'error' });
    return;
  }
  try {
    JSON.parse(jsonInput.value);
    toast(t('data-entry.json-submit-success'), { type: 'success' });
    showJsonModal.value = false;
  } catch {
    toast(t('data-entry.json-invalid-error'), { type: 'error' });
  }
}

function openFilePicker() {
  fileInputRef.value?.click();
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    toast(t('data-entry.file-selected', { name: file.name }), { type: 'success' });
    input.value = '';
  }
}

function copyApiUrl() {
  const url = `${grc_base_url}governance`;
  navigator.clipboard.writeText(url).then(() => {
    toast(t('data-entry.api-copied'), { type: 'success' });
  });
}

function startWorkflow() {
  toast(t('data-entry.workflow-started'), { type: 'info' });
}
</script>

<template>
  <div class="grid grid-cols-12 gap-4 p-4">
    <input
      ref="fileInputRef"
      type="file"
      accept=".csv,.xlsx,.xls"
      class="hidden"
      @change="onFileSelected"
    />

    <div class="col-span-12 mb-2">
      <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
        {{ t('menu.data-entry') }}
      </h2>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {{ t('data-entry.page-description') }}
      </p>
    </div>

    <div
      v-for="card in cards"
      :key="card.key"
      class="col-span-12 md:col-span-6"
    >
      <div
        class="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-darkmode-700 dark:bg-darkmode-800"
      >
        <div class="mb-4 flex items-start justify-between">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-lg"
            :class="card.bg"
          >
            <svg
              v-if="card.key === 'json'"
              class="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 6h2a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2 2 2 0 0 0-2 2v1a2 2 0 0 1-2 2H4" />
              <path d="M20 6h-2a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2 2 2 0 0 1 2 2v1a2 2 0 0 0 2 2h2" />
            </svg>
            <svg
              v-else-if="card.key === 'excel'"
              class="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M8 13h2" /><path d="M8 17h2" />
              <path d="M14 13h2" /><path d="M14 17h2" />
            </svg>
            <svg
              v-else-if="card.key === 'api'"
              class="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <svg
              v-else-if="card.key === 'workflow'"
              class="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="6" y1="3" x2="6" y2="15" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 9a9 9 0 0 1-9 9" />
            </svg>
          </div>
          <span
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            :class="card.bg"
          >
            {{ card.badge() }}
          </span>
        </div>

        <h3 class="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          {{ card.title() }}
        </h3>

        <p class="mb-4 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {{ card.description() }}
        </p>

        <div class="mb-4 rounded-lg border border-slate-200 px-3 py-2 dark:border-darkmode-600">
          <p class="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {{ t('data-entry.sample-label') }}
          </p>
          <code class="mt-1 block truncate text-xs text-slate-600 dark:text-slate-300">
            {{ card.sample }}
          </code>
        </div>

        <div class="flex justify-end">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90"
            @click="card.onClick"
          >
            <svg
              class="h-3.5 w-3.5 rtl:rotate-180"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            {{ card.actionLabel() }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showJsonModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showJsonModal = false"
    >
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-darkmode-800">
        <h3 class="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
          {{ t('data-entry.json-modal-title') }}
        </h3>
        <textarea
          v-model="jsonInput"
          rows="10"
          class="w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-700 focus:border-primary focus:ring-primary dark:border-darkmode-600 dark:bg-darkmode-700 dark:text-slate-200"
          :placeholder="t('data-entry.json-placeholder')"
        />
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-darkmode-600 dark:text-slate-300 dark:hover:bg-darkmode-700"
            @click="showJsonModal = false"
          >
            {{ t('rule.form-cancel') }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90"
            @click="submitJson"
          >
            {{ t('data-entry.json-submit') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
