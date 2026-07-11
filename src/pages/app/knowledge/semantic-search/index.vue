<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import Lucide from '@/base-components/Lucide';
import Button from '@/base-components/Button';
import { grcHttp } from '@/core/api/grcHttp';
import { endpoints } from '@/core/api/endpoints';

const { t } = useI18n();

/* ---------------------------------------------------------------------- */
/* State                                                                   */
/* ---------------------------------------------------------------------- */
const query = ref('');
const searching = ref(false);
const searched = ref(false);
const results = ref<SearchResult[]>([]);
const selectedResult = ref<SearchResult | null>(null);

interface SearchResult {
  id: string;
  score: number;
  content: string;
  chunkIndex?: number;
  fileSlug?: string;
  recordTitle?: string;
  metadata?: Record<string, unknown>;
}

/* ---------------------------------------------------------------------- */
/* Search                                                                  */
/* ---------------------------------------------------------------------- */
async function doSearch() {
  const q = query.value.trim();
  if (!q) return;

  searching.value = true;
  results.value = [];
  selectedResult.value = null;

  try {
    const res = await grcHttp.post(endpoints.rag.documents.search, { query: q, limit: 20 });
    const envelope = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
    const data = envelope?.data as Record<string, unknown> | undefined;
    const list = (data?.results ?? data?.list ?? []) as Record<string, unknown>[];
    results.value = list.map((r) => ({
      id: String(r.id ?? r.chunkId ?? ''),
      score: Number(r.score ?? 0),
      content: String(r.content ?? r.text ?? ''),
      chunkIndex: r.chunkIndex as number | undefined,
      fileSlug: r.fileSlug as string | undefined,
      recordTitle: r.recordTitle as string | undefined,
      metadata: (r.metadata ?? {}) as Record<string, unknown>,
    }));
    searched.value = true;
  } catch {
    toast(t('semantic-search.error'), { type: 'error' });
  } finally {
    searching.value = false;
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    doSearch();
  }
}

function selectResult(r: SearchResult) {
  selectedResult.value = selectedResult.value?.id === r.id ? null : r;
}

function scorePercent(score: number) {
  return Math.round(score * 100);
}

function scoreColor(score: number) {
  if (score >= 0.8) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20';
  if (score >= 0.5) return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20';
  return 'text-slate-500 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-darkmode-600 dark:border-darkmode-500';
}

function highlightQuery(text: string, q: string): string {
  if (!q.trim()) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="bg-primary/15 text-primary rounded px-0.5 dark:bg-primary/25">$1</mark>');
}

/* ---------------------------------------------------------------------- */
/* Copy                                                                    */
/* ---------------------------------------------------------------------- */
const copiedId = ref<string | null>(null);
async function copyText(id: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copiedId.value = id;
    setTimeout(() => { if (copiedId.value === id) copiedId.value = null; }, 1500);
  } catch { /* ignore */ }
}
</script>

<template>
  <div class="grid grid-cols-12 gap-4 p-2">
    <!-- ── Search header ───────────────────────────────────────────── -->
    <div class="col-span-12">
      <div class="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <Lucide icon="Search" class="h-5 w-5" />
          </div>
          <div>
            <h1 class="text-base font-semibold text-slate-800 dark:text-slate-100">
              {{ t('semantic-search.title') }}
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ t('semantic-search.subtitle') }}
            </p>
          </div>
        </div>

        <!-- Search input -->
        <div class="flex gap-2">
          <div class="relative flex-1">
            <Lucide icon="Search" class="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              v-model="query"
              type="text"
              :placeholder="t('semantic-search.placeholder')"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pe-4 ps-10 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-darkmode-600 dark:bg-darkmode-700 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-primary dark:focus:bg-darkmode-800"
              @keydown="onKeyDown"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            :disabled="!query.trim() || searching"
            @click="doSearch"
          >
            <Lucide v-if="searching" icon="Loader2" class="me-1.5 h-3.5 w-3.5 animate-spin" />
            <Lucide v-else icon="Search" class="me-1.5 h-3.5 w-3.5" />
            {{ t('semantic-search.search-btn') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- ── Results + detail ────────────────────────────────────────── -->
    <template v-if="results.length > 0 || searched">
      <!-- Results list -->
      <div class="col-span-12 lg:col-span-7 xl:col-span-8">
        <div class="rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
          <!-- Results header -->
          <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-darkmode-600">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {{ results.length }} {{ t('semantic-search.results-count') }}
            </span>
          </div>

          <!-- Results -->
          <div class="divide-y divide-slate-100 dark:divide-darkmode-600">
            <div
              v-for="r in results"
              :key="r.id"
              class="cursor-pointer px-5 py-3.5 transition-all hover:bg-slate-50/80 dark:hover:bg-darkmode-700/50"
              :class="selectedResult?.id === r.id ? 'bg-primary/5 border-e-2 border-e-primary dark:bg-primary/5' : ''"
              @click="selectResult(r)"
            >
              <div class="flex items-start gap-3">
                <!-- Score badge -->
                <span
                  class="inline-flex flex-shrink-0 items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold tabular-nums"
                  :class="scoreColor(r.score)"
                >
                  {{ scorePercent(r.score) }}%
                </span>

                <!-- Content -->
                <div class="min-w-0 flex-1">
                  <p
                    class="line-clamp-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                    v-html="highlightQuery(r.content, query)"
                  />
                  <div class="mt-1.5 flex flex-wrap items-center gap-2">
                    <span v-if="r.recordTitle" class="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                      <Lucide icon="FileText" class="h-3 w-3" />
                      {{ r.recordTitle }}
                    </span>
                    <span v-if="r.chunkIndex !== undefined" class="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                      <Lucide icon="Layers" class="h-3 w-3" />
                      #{{ r.chunkIndex }}
                    </span>
                    <span v-if="r.fileSlug" class="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                      <Lucide icon="File" class="h-3 w-3" />
                      {{ r.fileSlug }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="searched && results.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 dark:bg-darkmode-600 dark:text-slate-500">
                <Lucide icon="SearchX" class="h-6 w-6" />
              </div>
              <p class="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{{ t('semantic-search.no-results') }}</p>
              <p class="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{{ t('semantic-search.no-results-hint') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail panel -->
      <div class="col-span-12 lg:col-span-5 xl:col-span-4">
        <div class="sticky top-4 rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
          <template v-if="selectedResult">
            <!-- Detail header -->
            <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-darkmode-600">
              <h3 class="text-xs font-semibold text-slate-700 dark:text-slate-200">{{ t('semantic-search.detail-title') }}</h3>
              <button
                type="button"
                class="rounded-md p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
                @click="selectedResult = null"
              >
                <Lucide icon="X" class="h-3.5 w-3.5" />
              </button>
            </div>

            <div class="p-5">
              <!-- Score -->
              <div class="mb-4 flex items-center gap-2">
                <span class="text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ t('semantic-search.relevance') }}</span>
                <span class="inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold tabular-nums" :class="scoreColor(selectedResult.score)">
                  {{ scorePercent(selectedResult.score) }}%
                </span>
              </div>

              <!-- Metadata -->
              <div class="space-y-3">
                <div v-if="selectedResult.recordTitle">
                  <span class="mb-0.5 block text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ t('semantic-search.record') }}</span>
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ selectedResult.recordTitle }}</span>
                </div>
                <div v-if="selectedResult.fileSlug">
                  <span class="mb-0.5 block text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ t('semantic-search.file') }}</span>
                  <span class="font-mono text-sm text-slate-700 dark:text-slate-200">{{ selectedResult.fileSlug }}</span>
                </div>
                <div v-if="selectedResult.chunkIndex !== undefined">
                  <span class="mb-0.5 block text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ t('semantic-search.chunk-index') }}</span>
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-200">#{{ selectedResult.chunkIndex }}</span>
                </div>
              </div>

              <!-- Content -->
              <div class="mt-4">
                <div class="mb-1.5 flex items-center justify-between">
                  <span class="text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ t('documents.chunk-content') }}</span>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
                    @click="copyText(selectedResult.id, selectedResult.content)"
                  >
                    <Lucide :icon="copiedId === selectedResult.id ? 'Check' : 'Copy'" class="h-3 w-3" :class="copiedId === selectedResult.id ? 'text-emerald-500' : ''" />
                    {{ copiedId === selectedResult.id ? t('documents.copied') : t('documents.copy') }}
                  </button>
                </div>
                <div class="max-h-60 overflow-y-auto rounded-xl border border-slate-150 bg-slate-50/80 p-3 dark:border-darkmode-500 dark:bg-darkmode-700/50">
                  <pre class="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 dark:text-slate-300">{{ selectedResult.content }}</pre>
                </div>
              </div>
            </div>
          </template>

          <!-- No selection -->
          <div v-else class="flex flex-col items-center justify-center py-12 text-center">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 dark:bg-darkmode-600 dark:text-slate-500">
              <Lucide icon="MousePointerClick" class="h-6 w-6" />
            </div>
            <p class="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{{ t('semantic-search.select-result') }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Initial state ───────────────────────────────────────────── -->
    <div v-if="!searched" class="col-span-12 flex flex-col items-center justify-center py-16 text-center">
      <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
        <Lucide icon="Sparkles" class="h-8 w-8" />
      </div>
      <p class="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">{{ t('semantic-search.empty-title') }}</p>
      <p class="mt-1 max-w-sm text-xs text-slate-400 dark:text-slate-500">{{ t('semantic-search.empty-hint') }}</p>
    </div>
  </div>
</template>
