<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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

/* ---------------------------------------------------------------------- */
/* Tab state                                                               */
/* ---------------------------------------------------------------------- */
type Tab = 'chunk' | 'meta' | 'vector';
const activeTab = ref<Tab>('chunk');

const meta = computed(() => (props.chunk?.metadata as Record<string, unknown>) ?? {});
const vector = computed(() => (props.chunk?.vector as Record<string, unknown>) ?? {});
const hasVector = computed(() => Object.keys(vector.value).length > 0);

/* ---------------------------------------------------------------------- */
/* Status presentation                                                    */
/* ---------------------------------------------------------------------- */
const STATUS_META: Record<string, { label: string; dot: string; badge: string }> = {
  indexed: {
    label: 'documents.status-indexed',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  },
  processing: {
    label: 'documents.status-processing',
    dot: 'bg-primary animate-pulse',
    badge: 'bg-primary/10 text-primary border border-primary/20 dark:bg-primary/10 dark:text-primary dark:border-primary/20',
  },
  pending: {
    label: 'documents.status-pending',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  },
  failed: {
    label: 'documents.status-failed',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  },
};

const statusMeta = computed(() => {
  const key = String(props.chunk?.embeddingStatus ?? '').toLowerCase();
  return STATUS_META[key] ?? {
    label: key || '—',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-darkmode-600 dark:text-slate-300 dark:border-darkmode-500',
  };
});

/* ---------------------------------------------------------------------- */
/* Field groups                                                           */
/* ---------------------------------------------------------------------- */
type Field = { label: string; value: unknown; dir?: 'ltr' | 'rtl'; mono?: boolean; icon?: string };

const chunkFields = computed<Field[]>(() => [
  { label: 'ID', value: props.chunk?.id, dir: 'ltr', mono: true, icon: 'Hash' },
  { label: 'Slug', value: props.chunk?.slug, dir: 'ltr', mono: true, icon: 'Link' },
  { label: 'File Slug', value: props.chunk?.fileSlug, dir: 'ltr', mono: true, icon: 'File' },
  { label: t('documents.chunk-index'), value: props.chunk?.chunkIndex, icon: 'Layers' },
  { label: t('documents.chunk-model'), value: props.chunk?.embeddingModel, dir: 'ltr', mono: true, icon: 'Cpu' },
  { label: t('documents.chunk-created'), value: formatDate(String(props.chunk?.createdAt ?? '')), icon: 'Calendar' },
  { label: t('documents.chunk-updated'), value: formatDate(String(props.chunk?.updatedAt ?? '')), icon: 'Clock' },
]);

function buildRecordFields(source: Record<string, unknown>): Field[] {
  return [
    { label: 'Record Title', value: source.recordTitle, icon: 'FileText' },
    { label: 'Record Slug', value: source.recordSlug, dir: 'ltr', mono: true, icon: 'Link' },
    { label: 'Record Type', value: source.recordType, icon: 'Tag' },
    { label: 'User ID', value: source.userId ?? '—', dir: 'ltr', mono: true, icon: 'User' },
    { label: 'Tenant ID', value: source.tenantId ?? '—', dir: 'ltr', mono: true, icon: 'Building' },
    { label: 'Block Index', value: source.blockIndex, icon: 'Box' },
    { label: 'Chunk Index', value: source.chunkIndex, icon: 'Layers' },
    { label: 'Total Blocks', value: source.totalBlocks, icon: 'Package' },
    { label: 'Total Chunks', value: source.totalChunks, icon: 'Stack' },
    { label: 'Total Characters', value: source.totalCharacters, icon: 'Type' },
    { label: 'Prev Chunk Slug', value: source.prevChunkSlug, dir: 'ltr', mono: true, icon: 'ArrowLeft' },
  ];
}

const metaFields = computed<Field[]>(() => buildRecordFields(meta.value));

const vectorFields = computed<Field[]>(() => [
  { label: 'Embedding Model', value: vector.value.embedding_model, dir: 'ltr', mono: true, icon: 'Cpu' },
  ...buildRecordFields(vector.value),
  { label: 'Time Created', value: vector.value.timeCreate ? new Date(Number(vector.value.timeCreate) * 1000).toLocaleString('fa-IR') : '—', icon: 'Calendar' },
  { label: 'Time Updated', value: vector.value.timeUpdate ? new Date(Number(vector.value.timeUpdate) * 1000).toLocaleString('fa-IR') : '—', icon: 'Clock' },
]);

const tabs = computed(() => [
  { key: 'chunk' as Tab, label: t('documents.chunk-fields'), icon: 'Box' as const },
  { key: 'meta' as Tab, label: t('documents.chunk-meta'), icon: 'Info' as const },
  { key: 'vector' as Tab, label: t('documents.chunk-vector'), icon: 'Cpu' as const, disabled: !hasVector.value },
]);

/* ---------------------------------------------------------------------- */
/* Utils                                                                  */
/* ---------------------------------------------------------------------- */
function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

const copiedField = ref<string | null>(null);
async function copyValue(label: string, value: unknown) {
  if (value === undefined || value === null) return;
  try {
    await navigator.clipboard.writeText(String(value));
    copiedField.value = label;
    setTimeout(() => {
      if (copiedField.value === label) copiedField.value = null;
    }, 1500);
  } catch {
    /* clipboard unavailable */
  }
}

function displayValue(v: unknown): string {
  if (v === undefined || v === null) return '—';
  return String(v);
}

/* Reset tab when chunk changes */
watch(() => props.chunk?.id, () => {
  activeTab.value = 'chunk';
});
</script>

<template>
  <BaseModal
    :visible="visible"
    :title="t('documents.chunk-detail-title')"
    size="xl"
    :content-class="'p-0'"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="chunk" class="flex max-h-[80vh] flex-col">
      <!-- ── Header ──────────────────────────────────────────────────── -->
      <div class="border-b border-slate-100 px-6 pb-4 pt-5 dark:border-darkmode-600">
        <div class="flex items-start gap-4">
          <!-- Icon -->
          <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <Lucide icon="Hash" class="h-5 w-5" />
          </div>

          <!-- Title + subtitle -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-3">
              <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">
                {{ t('documents.chunk-index') }} #{{ chunk.chunkIndex ?? chunk.id }}
              </h3>
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                :class="statusMeta.badge"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="statusMeta.dot" />
                {{ t(statusMeta.label) }}
              </span>
            </div>
            <p class="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
              {{ meta.recordTitle ?? '—' }}
            </p>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="(meta.tags as string[])?.length" class="mt-3 flex flex-wrap gap-1.5">
          <span
            v-for="tag in (meta.tags as string[])"
            :key="tag"
            class="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-primary dark:border-primary/20 dark:bg-primary/10 dark:text-primary"
          >
            <Lucide icon="Tag" class="h-2.5 w-2.5" />
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- ── Content preview ─────────────────────────────────────────── -->
      <div class="px-6 pt-4">
        <div class="flex items-center justify-between">
          <h4 class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Lucide icon="FileText" class="h-3.5 w-3.5" />
            {{ t('documents.chunk-content') }}
          </h4>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
            @click="copyValue('content', chunk.content)"
          >
            <transition
              enter-active-class="transition-all duration-200"
              leave-active-class="transition-all duration-150"
              enter-from-class="scale-90 opacity-0"
              leave-to-class="scale-90 opacity-0"
              mode="out-in"
            >
              <span :key="copiedField === 'content' ? 'check' : 'copy'" class="inline-flex items-center gap-1">
                <Lucide :icon="copiedField === 'content' ? 'Check' : 'Copy'" class="h-3 w-3" :class="copiedField === 'content' ? 'text-emerald-500' : ''" />
                {{ copiedField === 'content' ? t('documents.copied') : t('documents.copy') }}
              </span>
            </transition>
          </button>
        </div>
        <div class="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-150 bg-slate-50/80 p-4 scrollbar-thin dark:border-darkmode-500 dark:bg-darkmode-700/50">
          <pre class="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300">{{ chunk.content ?? '—' }}</pre>
        </div>
      </div>

      <!-- ── Tabs ─────────────────────────────────────────────────────── -->
      <div class="mt-4 px-6">
        <nav class="flex gap-0.5 border-b border-slate-100 dark:border-darkmode-600">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :disabled="tab.disabled"
            class="group relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30"
            :class="activeTab === tab.key
              ? 'text-primary'
              : 'text-slate-450 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200'"
            @click="!tab.disabled && (activeTab = tab.key)"
          >
            <Lucide :icon="tab.icon" class="h-3.5 w-3.5" :class="activeTab === tab.key ? 'text-primary' : ''" />
            {{ tab.label }}
            <span
              v-if="activeTab === tab.key"
              class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
            />
          </button>
        </nav>
      </div>

      <!-- ── Tab content ─────────────────────────────────────────────── -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <div
            v-for="f in activeTab === 'chunk' ? chunkFields : activeTab === 'meta' ? metaFields : vectorFields"
            :key="f.label"
            class="group relative rounded-xl border border-slate-100 bg-white px-3.5 py-3 transition-all hover:border-slate-200 hover:shadow-sm dark:border-darkmode-600 dark:bg-darkmode-700 dark:hover:border-darkmode-500"
          >
            <div class="flex items-center gap-1.5">
              <Lucide v-if="f.icon" :icon="f.icon" class="h-3 w-3 text-slate-350 dark:text-darkmode-400" />
              <span class="text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ f.label }}</span>
            </div>
            <p
              class="mt-1 truncate text-xs font-medium text-slate-800 dark:text-slate-100"
              :class="{ 'font-mono text-[11px]': f.mono }"
              :dir="f.dir"
            >
              {{ displayValue(f.value) }}
            </p>
            <button
              v-if="f.value !== undefined && f.value !== null && f.value !== '—'"
              type="button"
              class="absolute end-2 top-2 rounded-md p-1 text-slate-300 opacity-0 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
              @click="copyValue(f.label, f.value)"
            >
              <transition
                enter-active-class="transition-all duration-150"
                leave-active-class="transition-all duration-100"
                enter-from-class="scale-75 opacity-0"
                leave-to-class="scale-75 opacity-0"
                mode="out-in"
              >
                <Lucide
                  :key="copiedField === f.label ? 'check' : 'copy'"
                  :icon="copiedField === f.label ? 'Check' : 'Copy'"
                  class="h-3 w-3"
                  :class="copiedField === f.label ? 'text-emerald-500' : ''"
                />
              </transition>
            </button>
          </div>
        </div>

        <!-- Vector text (only inside vector tab) -->
        <div v-if="activeTab === 'vector' && vector.text" class="mt-4">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-medium text-slate-400 dark:text-slate-500">Text (stored in Qdrant payload)</span>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
              @click="copyValue('vector-text', vector.text)"
            >
              <Lucide :icon="copiedField === 'vector-text' ? 'Check' : 'Copy'" class="h-3 w-3" :class="copiedField === 'vector-text' ? 'text-emerald-500' : ''" />
              {{ copiedField === 'vector-text' ? t('documents.copied') : t('documents.copy') }}
            </button>
          </div>
          <div class="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-150 bg-slate-50/80 p-3 scrollbar-thin dark:border-darkmode-500 dark:bg-darkmode-700/50">
            <pre class="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 dark:text-slate-300">{{ vector.text }}</pre>
          </div>
        </div>

        <!-- Empty vector state -->
        <div
          v-if="activeTab === 'vector' && !hasVector"
          class="flex flex-col items-center justify-center gap-3 py-12 text-center"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 dark:bg-darkmode-600 dark:text-slate-500">
            <Lucide icon="CpuOff" class="h-6 w-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ t('documents.chunk-vector-empty') }}</p>
            <p class="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{{ t('documents.chunk-vector-empty-hint') }}</p>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
