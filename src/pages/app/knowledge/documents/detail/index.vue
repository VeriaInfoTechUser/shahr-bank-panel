<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import ChunkDetailModal from './ChunkDetailModal.vue';
import { grcHttp } from '@/core/api/grcHttp';
import { endpoints } from '@/core/api/endpoints';
import Lucide from '@/base-components/Lucide';

const route = useRoute();
const { t } = useI18n();

const loading = ref(true);
const error = ref('');
const doc = ref<Record<string, unknown> | null>(null);

const slug = route.params.slug as string;

// ── Chunk detail modal ──────────────────────────────────────────────────────
const showChunkModal = ref(false);
const selectedChunk = ref<Record<string, unknown> | null>(null);

function openChunk(row: Record<string, unknown>) {
  selectedChunk.value = row;
  showChunkModal.value = true;
}

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

// ── Chunks table ────────────────────────────────────────────────────────────
const fetchChunks: FetchFn = async ({ page, limit }) => {
  const res = await grcHttp.get(`${endpoints.rag.documents.chunks}/${slug}/chunks`, {
    params: { page, limit },
  });
  const envelope = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
  const inner = envelope?.data as Record<string, unknown> | undefined;
  const list = (inner?.list ?? []) as Record<string, unknown>[];
  const count = (inner?.paginator as Record<string, unknown>)?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count: Number(count) };
};

const table = useDataTable({
  fetchFn: fetchChunks,
  columns: [
    createColumn({
      key: 'index',
      label: t('documents.chunk-index'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => row.chunkIndex ?? row.id ?? '—',
    }),
    createColumn({
      key: 'content',
      label: t('documents.chunk-content'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => {
        const text = String(row.content ?? row.text ?? '');
        return text.length > 120 ? text.slice(0, 120) + '…' : text || '—';
      },
    }),
    createColumn({
      key: 'detail',
      label: '',
      sortable: false,
    }),
  ],
  selectable: false,
  exportEnabled: false,
  cacheKey: `chunks-${slug}`,
  listCacheStaleTime: 0,
});

// ── Load document info ──────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const res = await grcHttp.get(`${endpoints.rag.documents.get}/${slug}`);
    const envelope = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
    doc.value = (envelope?.data as Record<string, unknown>) ?? null;
    table.fetch();
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

      <!-- Chunks table -->
      <div class="col-span-12">
        <BaseTable
          :table="table"
          :selectable="false"
          :empty-message="t('documents.chunks-empty')"
          :actions="false"
          :show-search="false"
        >
          <template #cell-content="{ row }">
            <span class="block max-w-[40rem] truncate text-xs text-slate-600 dark:text-slate-300" :title="String(row.content ?? row.text ?? '')">
              {{ (() => { const t = String(row.content ?? row.text ?? ''); return t.length > 120 ? t.slice(0, 120) + '…' : t || '—'; })() }}
            </span>
          </template>
          <template #cell-detail="{ row }">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
              @click="openChunk(row)"
            >
              جزئیات
            </button>
          </template>
        </BaseTable>

        <!-- Chunk Detail Modal -->
        <ChunkDetailModal
          :visible="showChunkModal"
          :chunk="selectedChunk"
          @update:visible="showChunkModal = $event"
        />
      </div>
    </template>
  </div>
</template>
