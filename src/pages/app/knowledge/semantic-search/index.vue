<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { Form } from 'vee-validate';
import Lucide from '@/base-components/Lucide';
import Button from '@/base-components/Button';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import InputText from 'primevue/inputtext';
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
const selectedItems = ref<SearchResult[]>([]);
const wizardStep = ref<1 | 2 | 3>(1);

const promptOptions = ref<{ value: string; label: string; text: string }[]>([]);
const selectedPromptSlug = ref('');
const selectedPromptText = computed(() => {
  const p = promptOptions.value.find((o) => o.value === selectedPromptSlug.value);
  return p?.text ?? '';
});
const generating = ref(false);

const steps = computed(() => [
  { id: 1, label: t('semantic-search.step-1-label') },
  { id: 2, label: t('semantic-search.step-2-label') },
  { id: 3, label: t('semantic-search.step-3-label') }
]);

interface SearchResult {
  chunkSlug: string;
  fileSlug: string;
  recordTitle: string;
  contentPreview: string;
  score: number | null;
  tags: string[];
  blockIndex: number;
  chunkIndex: number;
  embeddingStatus: string;
  source: 'vector' | 'text';
}

/* ---------------------------------------------------------------------- */
/* Prompts                                                                 */
/* ---------------------------------------------------------------------- */
async function fetchPrompts() {
  try {
    const res = await grcHttp.get(endpoints.rag.prompts.list, { params: { page: 1, limit: 100, promptType: 'agent' } });
    const body = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
    const inner = body?.data as Record<string, unknown> | undefined;
    const list = (inner?.list ?? []) as Record<string, unknown>[];
    promptOptions.value = list.map((p) => ({
      value: String(p.slug ?? ''),
      label: String(p.title ?? ''),
      text: String(p.text ?? ''),
    }));
  } catch {
    promptOptions.value = [];
  }
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

    const vectorResults = ((data?.vectorResults ?? []) as Record<string, unknown>[]).map((r) => ({
      chunkSlug: String(r.chunkSlug ?? ''),
      fileSlug: String(r.fileSlug ?? ''),
      recordTitle: String(r.recordTitle ?? ''),
      contentPreview: String(r.contentPreview ?? ''),
      score: r.score != null ? Number(r.score) : null,
      tags: (r.tags ?? []) as string[],
      blockIndex: Number(r.blockIndex ?? 0),
      chunkIndex: Number(r.chunkIndex ?? 0),
      embeddingStatus: String(r.embeddingStatus ?? ''),
      source: 'vector' as const,
    }));

    const textResults = ((data?.textResults ?? []) as Record<string, unknown>[]).map((r) => ({
      chunkSlug: String(r.chunkSlug ?? ''),
      fileSlug: String(r.fileSlug ?? ''),
      recordTitle: String(r.recordTitle ?? ''),
      contentPreview: String(r.contentPreview ?? ''),
      score: r.score != null ? Number(r.score) : null,
      tags: (r.tags ?? []) as string[],
      blockIndex: Number(r.blockIndex ?? 0),
      chunkIndex: Number(r.chunkIndex ?? 0),
      embeddingStatus: String(r.embeddingStatus ?? ''),
      source: 'text' as const,
    }));

    results.value = [...vectorResults, ...textResults];
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
  selectedResult.value = selectedResult.value?.chunkSlug === r.chunkSlug ? null : r;
}

function toggleSelection(r: SearchResult) {
  const idx = selectedItems.value.findIndex((item) => item.chunkSlug === r.chunkSlug);
  if (idx >= 0) {
    selectedItems.value.splice(idx, 1);
  } else {
    selectedItems.value.push(r);
  }
}

function isSelected(r: SearchResult) {
  return selectedItems.value.some((item) => item.chunkSlug === r.chunkSlug);
}

function goToStep2() {
  if (selectedItems.value.length === 0) return;
  wizardStep.value = 2;
}

function backToStep1() {
  wizardStep.value = 1;
}

function goToStep3() {
  if (!selectedPromptSlug.value) return;
  wizardStep.value = 3;
}

function backToStep2() {
  wizardStep.value = 2;
}

function generateOutput() {
  if (!selectedPromptSlug.value) return;
  generating.value = true;
  setTimeout(() => {
    generating.value = false;
    goToStep3();
  }, 500);
}

function removeFromSelected(r: SearchResult) {
  const idx = selectedItems.value.findIndex((item) => item.chunkSlug === r.chunkSlug);
  if (idx >= 0) {
    selectedItems.value.splice(idx, 1);
  }
}

function resetWizard() {
  wizardStep.value = 1;
  selectedItems.value = [];
  selectedResult.value = null;
  selectedPromptSlug.value = '';
  query.value = '';
  results.value = [];
  searched.value = false;
}

function scorePercent(score: number | null) {
  if (score == null) return null;
  return Math.round(score * 100);
}

function scoreColor(score: number | null) {
  if (score == null) return 'text-slate-500 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-darkmode-600 dark:border-darkmode-500';
  if (score >= 0.8) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20';
  if (score >= 0.5) return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20';
  return 'text-slate-500 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-darkmode-600 dark:border-darkmode-500';
}

function highlightQuery(text: string, q: string): string {
  if (!q.trim()) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="bg-primary/15 text-primary rounded px-0.5 dark:bg-primary/25">$1</mark>');
}

/* ---------------------------------------------------------------------- */
/* Copy                                                                    */
/* ---------------------------------------------------------------------- */
const copiedSlug = ref<string | null>(null);
async function copyText(slug: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copiedSlug.value = slug;
    setTimeout(() => { if (copiedSlug.value === slug) copiedSlug.value = null; }, 1500);
  } catch { /* ignore */ }
}

const allSelectedText = computed(() => {
  return selectedItems.value.map((item) => item.contentPreview).join('\n\n---\n\n');
});

const copiedAll = ref(false);
async function copyAllSelected() {
  try {
    await navigator.clipboard.writeText(allSelectedText.value);
    copiedAll.value = true;
    setTimeout(() => { copiedAll.value = false; }, 1500);
  } catch { /* ignore */ }
}

const copiedOutput = ref(false);
async function copyOutput() {
  try {
    await navigator.clipboard.writeText(finalOutput.value);
    copiedOutput.value = true;
    setTimeout(() => { copiedOutput.value = false; }, 1500);
  } catch { /* ignore */ }
}

const finalOutput = computed(() => {
  return `${selectedPromptText.value}\n\n---\n\n${allSelectedText.value}`;
});

onMounted(() => {
  fetchPrompts();
});
</script>

<template>
  <div class="mx-auto max-w-7xl p-4 md:p-6">
    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- WIZARD STEPPER                                                  -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div class="mb-8 flex items-center justify-center">
      <div class="flex items-center gap-2 md:gap-4">
        <template v-for="(step, index) in steps" :key="step.id">
          <div class="flex items-center gap-2">
            <div
                class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
                :class="wizardStep >= step.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-400 dark:bg-darkmode-700 dark:text-slate-500'"
            >
              <Lucide v-if="wizardStep > step.id" icon="Check" class="h-4 w-4" />
              <span v-else>{{ step.id }}</span>
            </div>
            <span
                class="hidden text-sm font-medium md:block"
                :class="wizardStep >= step.id ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'"
            >
              {{ step.label }}
            </span>
          </div>
          <div
              v-if="index < steps.length - 1"
              class="h-px w-8 md:w-16 transition-colors duration-300"
              :class="wizardStep > step.id ? 'bg-primary' : 'bg-slate-200 dark:bg-darkmode-600'"
          ></div>
        </template>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- WIZARD STEP 1 — Search & Select                                -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <template v-if="wizardStep === 1">
      <!-- Search header -->
      <div class="mb-6">
        <div class="relative group">
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500"></div>
          <div class="relative flex items-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-all group-focus-within:border-primary group-focus-within:shadow-md dark:border-darkmode-600 dark:bg-darkmode-800">
            <Lucide icon="Search" class="ms-4 h-5 w-5 text-slate-400 dark:text-slate-500" />
            <InputText
                v-model="query"
                type="text"
                :placeholder="t('semantic-search.placeholder')"
                class="flex-1 border-0 bg-transparent !px-4 !py-4 !text-base !shadow-none focus:!ring-0 dark:text-slate-100"
                @keydown="onKeyDown"
            />
            <Button
                variant="primary"
                size="sm"
                :disabled="!query.trim() || searching"
                class="me-2"
                @click="doSearch"
            >
              <Lucide v-if="searching" icon="Loader2" class="me-1.5 h-4 w-4 animate-spin" />
              <Lucide v-else icon="Search" class="me-1.5 h-4 w-4" />
              {{ t('semantic-search.search-btn') }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Results + detail -->
      <template v-if="results.length > 0 || searched">
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-12 lg:col-span-7 xl:col-span-8">
            <div class="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
              <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-darkmode-600">
                <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {{ results.length }} {{ t('semantic-search.results-count') }}
                </span>
              </div>

              <div class="divide-y divide-slate-100 dark:divide-darkmode-600">
                <div
                    v-for="r in results"
                    :key="r.chunkSlug"
                    class="group relative flex items-start gap-4 p-5 transition-all hover:bg-slate-50/80 dark:hover:bg-darkmode-700/50 cursor-pointer"
                    :class="selectedResult?.chunkSlug === r.chunkSlug ? 'bg-primary/5 ring-1 ring-inset ring-primary/20 dark:bg-primary/5' : ''"
                    @click="selectResult(r)"
                >
                  <div class="mt-1">
                    <input
                        type="checkbox"
                        :checked="isSelected(r)"
                        class="h-5 w-5 rounded-md border-slate-300 text-primary focus:ring-primary/20 dark:border-darkmode-500"
                        @click.stop
                        @change="toggleSelection(r)"
                    />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="mb-1.5 flex flex-wrap items-center gap-2">
                      <span
                          class="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold tabular-nums"
                          :class="scoreColor(r.score)"
                      >
                        {{ scorePercent(r.score) != null ? scorePercent(r.score) + '%' : '—' }}
                      </span>
                      <span v-if="r.recordTitle" class="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                        {{ r.recordTitle }}
                      </span>
                      <span
                          v-if="r.source === 'text'"
                          class="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-darkmode-600 dark:text-slate-400"
                      >
                        <Lucide icon="Type" class="h-2.5 w-2.5" />
                        {{ t('semantic-search.source-text') }}
                      </span>
                    </div>

                    <p
                        class="text-sm leading-relaxed text-slate-700 dark:text-slate-300 line-clamp-2"
                        v-html="highlightQuery(r.contentPreview, query)"
                    />

                    <div class="mt-2 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                      <span class="inline-flex items-center gap-1">
                        <Lucide icon="Layers" class="h-3 w-3" />
                        Chunk #{{ r.chunkIndex }}
                      </span>
                    </div>
                  </div>
                </div>

                <div v-if="searched && results.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
                  <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 dark:bg-darkmode-600 dark:text-slate-500">
                    <Lucide icon="SearchX" class="h-7 w-7" />
                  </div>
                  <p class="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{{ t('semantic-search.no-results') }}</p>
                  <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">{{ t('semantic-search.no-results-hint') }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-12 lg:col-span-5 xl:col-span-4">
            <div class="sticky top-6 rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
              <template v-if="selectedResult">
                <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-darkmode-600">
                  <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ t('semantic-search.detail-title') }}</h3>
                  <button
                      type="button"
                      class="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
                      @click="selectedResult = null"
                  >
                    <Lucide icon="X" class="h-4 w-4" />
                  </button>
                </div>

                <div class="p-6">
                  <div class="mb-5 flex flex-wrap items-center gap-2">
                    <span class="inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums" :class="scoreColor(selectedResult.score)">
                      {{ scorePercent(selectedResult.score) != null ? scorePercent(selectedResult.score) + '%' : '—' }}
                    </span>
                    <span
                        class="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500 dark:bg-darkmode-600 dark:text-slate-400"
                    >
                      {{ selectedResult.source === 'vector' ? t('semantic-search.source-vector') : t('semantic-search.source-text') }}
                    </span>
                  </div>

                  <div class="space-y-4">
                    <div v-if="selectedResult.recordTitle">
                      <span class="mb-1 block text-xs font-medium text-slate-400 dark:text-slate-500">{{ t('semantic-search.record') }}</span>
                      <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ selectedResult.recordTitle }}</span>
                    </div>
                    <div>
                      <span class="mb-1 block text-xs font-medium text-slate-400 dark:text-slate-500">{{ t('semantic-search.chunk-index') }}</span>
                      <span class="text-sm font-medium text-slate-700 dark:text-slate-200">#{{ selectedResult.chunkIndex }} {{ t('semantic-search.block-label') }} {{ selectedResult.blockIndex }}</span>
                    </div>
                    <div v-if="selectedResult.tags?.length">
                      <span class="mb-2 block text-xs font-medium text-slate-400 dark:text-slate-500">{{ t('semantic-search.tags') }}</span>
                      <div class="flex flex-wrap gap-1.5">
                        <span
                            v-for="tag in selectedResult.tags"
                            :key="tag"
                            class="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary dark:border-primary/20 dark:bg-primary/10 dark:text-primary"
                        >
                          {{ tag }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="mt-6">
                    <div class="mb-2 flex items-center justify-between">
                      <span class="text-xs font-medium text-slate-400 dark:text-slate-500">{{ t('documents.chunk-content') }}</span>
                      <button
                          type="button"
                          class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
                          @click="copyText(selectedResult.chunkSlug, selectedResult.contentPreview)"
                      >
                        <Lucide :icon="copiedSlug === selectedResult.chunkSlug ? 'Check' : 'Copy'" class="h-3.5 w-3.5" :class="copiedSlug === selectedResult.chunkSlug ? 'text-emerald-500' : ''" />
                        {{ copiedSlug === selectedResult.chunkSlug ? t('documents.copied') : t('documents.copy') }}
                      </button>
                    </div>
                    <div class="max-h-64 overflow-y-auto rounded-xl border border-slate-150 bg-slate-50/80 p-4 dark:border-darkmode-500 dark:bg-darkmode-700/50">
                      <pre class="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 dark:text-slate-300">{{ selectedResult.contentPreview }}</pre>
                    </div>
                  </div>
                </div>
              </template>

              <div v-else class="flex flex-col items-center justify-center py-16 text-center">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 dark:bg-darkmode-600 dark:text-slate-500">
                  <Lucide icon="MousePointerClick" class="h-7 w-7" />
                </div>
                <p class="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{{ t('semantic-search.select-result') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Next Button -->
        <div
            v-if="selectedItems.length > 0"
            class="sticky bottom-6 z-20 mt-6 flex items-center justify-between rounded-2xl border border-primary/20 bg-white/90 p-4 shadow-xl backdrop-blur-md dark:border-primary/30 dark:bg-darkmode-800/90"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lucide icon="Check" class="h-5 w-5" />
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ selectedItems.length }} {{ t('semantic-search.chunks-selected') }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('semantic-search.ready-to-configure') }}</p>
            </div>
          </div>
          <Button variant="primary" size="sm" @click="goToStep2">
            {{ t('semantic-search.continue') }}
            <Lucide icon="ArrowLeft" class="ms-2 h-4 w-4" />
          </Button>
        </div>
      </template>

      <!-- Initial state -->
      <div v-if="!searched" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-1 ring-primary/10">
          <Lucide icon="Sparkles" class="h-10 w-10" />
        </div>
        <p class="mt-6 text-lg font-semibold text-slate-700 dark:text-slate-200">{{ t('semantic-search.empty-title') }}</p>
        <p class="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{{ t('semantic-search.empty-hint') }}</p>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- WIZARD STEP 2 — Select Prompt                                  -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <template v-if="wizardStep === 2">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left: Selected Items Summary -->
        <div class="lg:col-span-1">
          <div class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ t('semantic-search.selected-context-title') }}</h3>
              <button
                  type="button"
                  class="text-xs font-medium text-primary hover:text-primary/80"
                  @click="backToStep1"
              >
                {{ t('semantic-search.edit') }}
              </button>
            </div>

            <div class="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              <div
                  v-for="item in selectedItems"
                  :key="item.chunkSlug"
                  class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-slate-200 dark:border-darkmode-600 dark:bg-darkmode-700/50 dark:hover:border-darkmode-500"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Lucide icon="FileText" class="h-4 w-4" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{{ item.recordTitle || t('semantic-search.untitled-chunk') }}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ item.contentPreview.slice(0, 50) }}...</p>
                  </div>
                </div>
                <button
                    type="button"
                    class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
                    @click="removeFromSelected(item)"
                >
                  <Lucide icon="X" class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Prompt Selection -->
        <div class="lg:col-span-2">
          <div class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
            <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">{{ t('semantic-search.configure-prompt') }}</h3>

            <Form
                :initial-values="{ promptSlug: '' }"
                class="space-y-5"
            >
              <BaseSelect
                  name="promptSlug"
                  :label="t('semantic-search.select-prompt')"
                  :options="promptOptions"
                  :placeholder="t('semantic-search.prompt-placeholder')"
                  :filter="true"
                  @change="(v: unknown) => selectedPromptSlug = String(v ?? '')"
              />

              <!-- Prompt Preview -->
              <div v-if="selectedPromptText" class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-darkmode-600 dark:bg-darkmode-700/50">
                <div class="mb-2 flex items-center gap-2">
                  <Lucide icon="Eye" class="h-4 w-4 text-slate-400" />
                  <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ t('semantic-search.preview') }}</span>
                </div>
                <pre class="max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-600 dark:text-slate-300">{{ selectedPromptText }}</pre>
              </div>

              <div class="flex justify-end pt-2">
                <Button
                    variant="primary"
                    size="sm"
                    :disabled="!selectedPromptSlug || generating"
                    @click="generateOutput"
                >
                  <Lucide v-if="generating" icon="Loader2" class="me-1.5 h-4 w-4 animate-spin" />
                  <Lucide v-else icon="Sparkles" class="me-1.5 h-4 w-4" />
                  {{ t('semantic-search.generate') }}
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- WIZARD STEP 3 — Output                                        -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <template v-if="wizardStep === 3">
      <div class="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-darkmode-600 bg-slate-50/50 dark:bg-darkmode-700/30">
          <div class="flex items-center gap-3">
            <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
                @click="backToStep2"
            >
              <Lucide icon="ArrowRight" class="h-3.5 w-3.5" />
              {{ t('semantic-search.back-to-prompts') }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline-secondary" size="sm" @click="resetWizard">
              <Lucide icon="RotateCcw" class="me-1.5 h-3.5 w-3.5" />
              {{ t('semantic-search.start-over') }}
            </Button>
            <Button variant="primary" size="sm" @click="copyOutput">
              <Lucide :icon="copiedOutput ? 'Check' : 'Copy'" class="me-1.5 h-3.5 w-3.5" :class="copiedOutput ? 'text-emerald-400' : ''" />
              {{ copiedOutput ? t('documents.copied') : t('documents.copy') }}
            </Button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Prompt Section -->
          <div>
            <div class="mb-3 flex items-center gap-2">
              <div class="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Lucide icon="Bot" class="h-3.5 w-3.5" />
              </div>
              <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('semantic-search.system-instructions') }}</h3>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-darkmode-600 dark:bg-darkmode-700/50">
              <pre class="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300">{{ selectedPromptText }}</pre>
            </div>
          </div>

          <!-- Separator -->
          <div class="flex items-center gap-4">
            <div class="h-px flex-1 bg-slate-200 dark:bg-darkmode-600" />
            <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{{ t('semantic-search.context-separator') }}</span>
            <div class="h-px flex-1 bg-slate-200 dark:bg-darkmode-600" />
          </div>

          <!-- Selected Text Section -->
          <div>
            <div class="mb-3 flex items-center gap-2">
              <div class="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
                <Lucide icon="FileText" class="h-3.5 w-3.5" />
              </div>
              <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('semantic-search.retrieved-context') }}</h3>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-darkmode-600 dark:bg-darkmode-800">
              <pre class="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300">{{ allSelectedText }}</pre>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>