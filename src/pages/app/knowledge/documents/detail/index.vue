<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { grcHttp } from '@/core/api/grcHttp';
import { endpoints } from '@/core/api/endpoints';
import Lucide from '@/base-components/Lucide';

const route = useRoute();
const { t } = useI18n();

const loading = ref(true);
const error = ref('');
const doc = ref<Record<string, unknown> | null>(null);

const slug = route.params.slug as string;

const chunks = computed(() => {
  const raw = doc.value?.chunks;
  if (!Array.isArray(raw)) return [];
  return raw as Record<string, unknown>[];
});

const content = computed(() => {
  return chunks.value.map((c) => String(c.content ?? c.text ?? '')).join('\n\n');
});

function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fa-IR');
  } catch {
    return iso;
  }
}

function formatSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

onMounted(async () => {
  try {
    const res = await grcHttp.get(`${endpoints.rag.documents.get}/${slug}`);
    const envelope = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
    doc.value = (envelope?.data as Record<string, unknown>) ?? null;
  } catch {
    error.value = t('documents.detail-load-error');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="grid grid-cols-12 gap-4 p-2">
    <!-- Loading -->
    <div v-if="loading" class="col-span-12 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
      {{ t('general.loading') }}
    </div>

    <!-- Error -->
    <div v-else-if="error" class="col-span-12 py-16 text-center text-sm text-danger">
      {{ error }}
    </div>

    <!-- Empty -->
    <div v-else-if="!doc" class="col-span-12 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
      {{ t('general.no-data') }}
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Metadata row -->
      <div class="col-span-12 rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          <span class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ doc.title }}</span>
          <span class="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Lucide icon="FileType" class="h-3 w-3" />
            {{ doc.mimeType }}
          </span>
          <span class="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Lucide icon="HardDrive" class="h-3 w-3" />
            {{ formatSize(Number(doc.fileSize ?? 0)) }}
          </span>
          <span
            class="inline-flex items-center gap-1 text-xs font-medium"
            :class="Number(doc.status) === 1 ? 'text-success' : 'text-slate-500 dark:text-slate-400'"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="Number(doc.status) === 1 ? 'bg-success' : 'bg-slate-400'" />
            {{ Number(doc.status) === 1 ? t('documents.status-active') : t('documents.status-inactive') }}
          </span>
          <span class="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Lucide icon="Layers" class="h-3 w-3" />
            {{ doc.chunkCount ?? 0 }} {{ t('documents.col-chunks') }}
          </span>
          <span class="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Lucide icon="Calendar" class="h-3 w-3" />
            {{ formatDate(String(doc.createdAt ?? '')) }}
          </span>
        </div>
      </div>

      <!-- Markdown content -->
      <div class="col-span-12 rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
        <div class="border-b border-slate-100 px-5 py-3 dark:border-darkmode-700">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ doc.fileName }}</h3>
        </div>
        <div class="prose prose-sm dark:prose-invert max-w-none p-5" dir="ltr">
          <pre class="whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:bg-darkmode-700 dark:text-slate-300">{{ content }}</pre>
        </div>
      </div>
    </template>
  </div>
</template>
