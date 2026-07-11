<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import Lucide from '@/base-components/Lucide';

const props = defineProps<{
  visible: boolean;
  chunk: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
}>();

const { t } = useI18n();

const meta = computed(() => {
  const m = props.chunk?.metadata as Record<string, unknown> | undefined;
  return m ?? {};
});

const vector = computed(() => {
  const v = props.chunk?.vector as Record<string, unknown> | undefined;
  return v ?? {};
});

const chunkFields = computed(() => [
  { label: 'id', value: props.chunk?.id },
  { label: 'slug', value: props.chunk?. slug, dir: 'ltr' },
  { label: 'fileSlug', value: props.chunk?.fileSlug, dir: 'ltr' },
  { label: t('documents.chunk-index'), value: props.chunk?.chunkIndex },
  { label: t('documents.chunk-model'), value: props.chunk?.embeddingModel, dir: 'ltr' },
  { label: t('documents.chunk-status'), value: props.chunk?.embeddingStatus },
  { label: t('documents.chunk-created'), value: formatDate(String(props.chunk?.createdAt ?? '')) },
  { label: t('documents.chunk-updated'), value: formatDate(String(props.chunk?.updatedAt ?? '')) },
]);

const metaFields = computed(() => [
  { label: 'recordTitle', value: meta.value.recordTitle },
  { label: 'recordSlug', value: meta.value.recordSlug, dir: 'ltr' },
  { label: 'recordType', value: meta.value.recordType },
  { label: 'userId', value: meta.value.userId ?? '—' },
  { label: 'tenantId', value: meta.value.tenantId ?? '—' },
  { label: 'blockIndex', value: meta.value.blockIndex },
  { label: 'chunkIndex', value: meta.value.chunkIndex },
  { label: 'totalBlocks', value: meta.value.totalBlocks },
  { label: 'totalChunks', value: meta.value.totalChunks },
  { label: 'totalCharacters', value: meta.value.totalCharacters },
  { label: 'prevChunkSlug', value: meta.value.prevChunkSlug, dir: 'ltr' },
]);

const vectorFields = computed(() => [
  { label: 'embedding_model', value: vector.value.embedding_model, dir: 'ltr' },
  { label: 'recordTitle', value: vector.value.recordTitle },
  { label: 'recordSlug', value: vector.value.recordSlug, dir: 'ltr' },
  { label: 'recordType', value: vector.value.recordType },
  { label: 'userId', value: vector.value.userId ?? '—' },
  { label: 'tenantId', value: vector.value.tenantId ?? '—' },
  { label: 'blockIndex', value: vector.value.blockIndex },
  { label: 'chunkIndex', value: vector.value.chunkIndex },
  { label: 'totalBlocks', value: vector.value.totalBlocks },
  { label: 'totalChunks', value: vector.value.totalChunks },
  { label: 'totalCharacters', value: vector.value.totalCharacters },
  { label: 'prevChunkSlug', value: vector.value.prevChunkSlug, dir: 'ltr' },
  { label: 'timeCreate', value: vector.value.timeCreate ? new Date(Number(vector.value.timeCreate) * 1000).toLocaleString('fa-IR') : '—' },
  { label: 'timeUpdate', value: vector.value.timeUpdate ? new Date(Number(vector.value.timeUpdate) * 1000).toLocaleString('fa-IR') : '—' },
]);

function formatDate(iso: string) {
  if (!iso || iso === '—') return '—';
  try {
    return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}
</script>

<template>
  <BaseModal
    :visible="visible"
    :title="t('documents.chunk-detail-title')"
    root-class="w-[min(100%,56rem)] max-w-[56rem] rounded-xl border border-slate-200 bg-white shadow-xl dark:border-darkmode-600 dark:bg-darkmode-800"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="chunk" class="space-y-5">
      <!-- Header -->
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Lucide icon="Hash" class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {{ t('documents.chunk-index') }} {{ chunk.chunkIndex ?? chunk.id }}
          </h3>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {{ meta.recordTitle ?? '—' }}
          </p>
        </div>
        <span
          class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
          :class="chunk.embeddingStatus === 'indexed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'"
        >
          <span class="h-1.5 w-1.5 rounded-full" :class="chunk.embeddingStatus === 'indexed' ? 'bg-success' : 'bg-warning'" />
          {{ chunk.embeddingStatus ?? '—' }}
        </span>
      </div>

      <!-- Tags -->
      <div v-if="meta.tags?.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="tag in (meta.tags as string[])"
          :key="tag"
          class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
        >
          {{ tag }}
        </span>
      </div>

      <!-- Content -->
      <div>
        <h4 class="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Lucide icon="FileText" class="h-3.5 w-3.5" />
          {{ t('documents.chunk-content') }}
        </h4>
        <div class="max-h-60 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-darkmode-600 dark:bg-darkmode-700">
          <pre class="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 dark:text-slate-300">{{ chunk.content ?? '—' }}</pre>
        </div>
      </div>

      <!-- Chunk fields -->
      <div>
        <h4 class="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Lucide icon="Box" class="h-3.5 w-3.5" />
          {{ t('documents.chunk-fields') }}
        </h4>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div v-for="f in chunkFields" :key="f.label" class="rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-darkmode-600 dark:bg-darkmode-700">
            <span class="text-[11px] text-slate-500 dark:text-slate-400">{{ f.label }}</span>
            <p class="mt-0.5 truncate text-xs font-medium text-slate-800 dark:text-slate-100" :dir="f.dir">{{ f.value ?? '—' }}</p>
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div>
        <h4 class="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Lucide icon="Info" class="h-3.5 w-3.5" />
          {{ t('documents.chunk-meta') }}
        </h4>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div v-for="f in metaFields" :key="f.label" class="rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-darkmode-600 dark:bg-darkmode-700">
            <span class="text-[11px] text-slate-500 dark:text-slate-400">{{ f.label }}</span>
            <p class="mt-0.5 truncate text-xs font-medium text-slate-800 dark:text-slate-100" :dir="f.dir">{{ f.value ?? '—' }}</p>
          </div>
        </div>
      </div>

      <!-- Vector data -->
      <div>
        <h4 class="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Lucide icon="Cpu" class="h-3.5 w-3.5" />
          {{ t('documents.chunk-vector') }}
        </h4>

        <!-- Vector text -->
        <div v-if="vector.text" class="mb-3">
          <span class="mb-1 block text-[11px] text-slate-500 dark:text-slate-400">text</span>
          <div class="max-h-40 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-darkmode-600 dark:bg-darkmode-700">
            <pre class="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 dark:text-slate-300">{{ vector.text }}</pre>
          </div>
        </div>

        <!-- Vector fields -->
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div v-for="f in vectorFields" :key="f.label" class="rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-darkmode-600 dark:bg-darkmode-700">
            <span class="text-[11px] text-slate-500 dark:text-slate-400">{{ f.label }}</span>
            <p class="mt-0.5 truncate text-xs font-medium text-slate-800 dark:text-slate-100" :dir="f.dir">{{ f.value ?? '—' }}</p>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
