<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { grc_base_url } from '@/constants/config';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';

const { t } = useI18n();

const fileInputRef = ref<HTMLInputElement | null>(null);

interface CardDef {
  key: string;
  title: () => string;
  description: () => string;
  sample: string;
  badge: () => string;
  actionLabel: () => string;
  icon: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  onClick: () => void;
}

const cards = ref<CardDef[]>([
  {
    key: 'json',
    title: () => t('data-entry.json-title'),
    description: () => t('data-entry.json-description'),
    sample: '{ "title": "Asset 1", "type": "facility" }',
    badge: () => t('data-entry.json-badge'),
    actionLabel: () => t('data-entry.action-json'),
    icon: 'Braces',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-50 dark:bg-violet-500/10',
    badgeText: 'text-violet-600 dark:text-violet-400',
    onClick: () => openJsonDialog(),
  },
  {
    key: 'excel',
    title: () => t('data-entry.excel-title'),
    description: () => t('data-entry.excel-description'),
    sample: '.xlsx, .csv',
    badge: () => t('data-entry.excel-badge'),
    actionLabel: () => t('data-entry.action-excel'),
    icon: 'FileSpreadsheet',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    onClick: () => openFilePicker(),
  },
  {
    key: 'api',
    title: () => t('data-entry.api-title'),
    description: () => t('data-entry.api-description'),
    sample: `${grc_base_url}governance`,
    badge: () => t('data-entry.api-badge'),
    actionLabel: () => t('data-entry.action-api'),
    icon: 'Globe',
    iconBg: 'bg-sky-50 dark:bg-sky-500/10',
    iconColor: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-50 dark:bg-sky-500/10',
    badgeText: 'text-sky-600 dark:text-sky-400',
    onClick: () => copyApiUrl(),
  },
  {
    key: 'workflow',
    title: () => t('data-entry.workflow-title'),
    description: () => t('data-entry.workflow-description'),
    sample: t('data-entry.workflow-sample'),
    badge: () => t('data-entry.workflow-badge'),
    actionLabel: () => t('data-entry.action-workflow'),
    icon: 'Workflow',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-500/10',
    badgeText: 'text-amber-600 dark:text-amber-400',
    onClick: () => startWorkflow(),
  },
]);

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
  <div class="mx-auto max-w-5xl px-1 pb-6 pt-4 md:px-2">
    <input
      ref="fileInputRef"
      type="file"
      accept=".csv,.xlsx,.xls"
      class="hidden"
      @change="onFileSelected"
    />

    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Lucide icon="Database" class="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-slate-800 dark:text-slate-100">
            {{ t('menu.data-entry') }}
          </h1>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {{ t('data-entry.page-description') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Cards grid -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div
        v-for="card in cards"
        :key="card.key"
        class="group rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:border-slate-300/60 hover:shadow-md dark:border-darkmode-700/60 dark:bg-darkmode-800 dark:hover:border-darkmode-600"
      >
        <!-- Top: icon + badge -->
        <div class="mb-4 flex items-start justify-between">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
            :class="card.iconBg"
          >
            <Lucide :icon="card.icon" class="h-5 w-5" :class="card.iconColor" />
          </div>
          <span
            class="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold"
            :class="[card.badgeBg, card.badgeText]"
          >
            {{ card.badge() }}
          </span>
        </div>

        <!-- Title + description -->
        <h3 class="mb-1.5 text-sm font-bold text-slate-800 dark:text-slate-100">
          {{ card.title() }}
        </h3>
        <p class="mb-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {{ card.description() }}
        </p>

        <!-- Sample code -->
        <div class="mb-4 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 dark:border-darkmode-700 dark:bg-darkmode-900/50">
          <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {{ t('data-entry.sample-label') }}
          </p>
          <code class="block truncate text-xs font-medium text-slate-600 dark:text-slate-300">
            {{ card.sample }}
          </code>
        </div>

        <!-- Action button -->
        <div class="flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="sm"
            class="!gap-1.5 !px-4 !text-xs"
            @click="card.onClick"
          >
            <Lucide icon="ArrowLeft" class="h-3.5 w-3.5 rtl:hidden" />
            <Lucide icon="ArrowRight" class="h-3.5 w-3.5 ltr:hidden" />
            {{ card.actionLabel() }}
          </Button>
        </div>
      </div>
    </div>

    <!-- JSON Modal -->
    <div
      v-if="showJsonModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showJsonModal = false"
    >
      <div class="mx-4 w-full max-w-lg rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xl dark:border-darkmode-700 dark:bg-darkmode-800">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/10">
            <Lucide icon="Braces" class="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">
            {{ t('data-entry.json-modal-title') }}
          </h3>
        </div>
        <textarea
          v-model="jsonInput"
          rows="10"
          dir="ltr"
          class="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 font-mono text-xs text-slate-700 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary dark:border-darkmode-600 dark:bg-darkmode-900/50 dark:text-slate-200 dark:placeholder:text-slate-500"
          :placeholder="t('data-entry.json-placeholder')"
        />
        <div class="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            @click="showJsonModal = false"
          >
            {{ t('rule.form-cancel') }}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            @click="submitJson"
          >
            {{ t('data-entry.json-submit') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
