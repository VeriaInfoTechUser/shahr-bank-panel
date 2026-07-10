<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { grcHttp } from '@/core/api/grcHttp';
import { endpoints } from '@/core/api/endpoints';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const error = ref('');
const doc = ref<Record<string, unknown> | null>(null);

const slug = route.params.slug as string;

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
    const res = await grcHttp.get(endpoints.rag.documents.list, {
      params: { slug },
    });
    const body = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
    const inner = body?.data as Record<string, unknown> | undefined;
    const list = (inner?.list ?? []) as Record<string, unknown>[];
    doc.value = list[0] ?? null;
  } catch {
    error.value = t('documents.detail-load-error');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12 rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            @click="router.push({ name: 'app-knowledge-documents' })"
          >
            <Lucide icon="ArrowRight" class="ms-1 h-4 w-4" />
            {{ t('general.back') }}
          </Button>
          <h1 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {{ doc?.title ?? t('documents.detail-title') }}
          </h1>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        {{ t('general.loading') }}
      </div>

      <!-- Error -->
      <div v-else-if="error" class="py-12 text-center text-sm text-danger">
        {{ error }}
      </div>

      <!-- Empty -->
      <div v-else-if="!doc" class="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        {{ t('general.no-data') }}
      </div>

      <!-- Detail -->
      <div v-else class="space-y-4">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('documents.col-title') }}</span>
            <p class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{{ doc.title ?? '—' }}</p>
          </div>
          <div>
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('documents.col-file-name') }}</span>
            <p class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{{ doc.fileName ?? '—' }}</p>
          </div>
          <div>
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('documents.col-type') }}</span>
            <p class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{{ doc.mimeType ?? '—' }}</p>
          </div>
          <div>
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('documents.col-size') }}</span>
            <p class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{{ formatSize(Number(doc.fileSize ?? 0)) }}</p>
          </div>
          <div>
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('documents.col-chunks') }}</span>
            <p class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{{ doc.chunkCount ?? '—' }}</p>
          </div>
          <div>
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('documents.col-status') }}</span>
            <p class="mt-1">
              <span
                class="inline-block rounded px-2 py-0.5 text-xs font-medium"
                :class="Number(doc.status) === 1 ? 'bg-success/15 text-success' : 'bg-slate-100 text-slate-500 dark:bg-darkmode-600 dark:text-slate-400'"
              >
                {{ Number(doc.status) === 1 ? t('documents.status-active') : t('documents.status-inactive') }}
              </span>
            </p>
          </div>
        </div>

        <div>
          <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('documents.col-storage-path') }}</span>
          <p class="mt-1 break-all text-sm font-medium text-slate-800 dark:text-slate-100" dir="ltr">{{ doc.storagePath ?? '—' }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('documents.col-created-at') }}</span>
            <p class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{{ formatDate(String(doc.createdAt ?? '')) }}</p>
          </div>
          <div>
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('documents.col-updated-at') }}</span>
            <p class="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{{ formatDate(String(doc.updatedAt ?? '')) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
