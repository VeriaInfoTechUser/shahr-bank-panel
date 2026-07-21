<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { OrgChart } from 'd3-org-chart';
import { grcRepo } from '@/core/repositories/grcRepo';

const { t } = useI18n();

interface ApiNode {
  id: string | number;
  slug: string;
  type: string;
  title: string;
  parentSlug?: string | null;
  children?: ApiNode[];
  [key: string]: unknown;
}

interface FlatNode {
  id: string;
  parentId: string | null;
  title: string;
  type: string;
}

const chartContainer = ref<HTMLDivElement | null>(null);
const loading = ref(false);
const error = ref('');
const treeData = ref<ApiNode[]>([]);
let chart: InstanceType<typeof OrgChart> | null = null;

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  sustainability:    { bg: 'bg-blue-50 dark:bg-blue-900/30',  border: 'border-blue-300 dark:border-blue-700',  text: 'text-blue-700 dark:text-blue-300' },
  domain:     { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-300' },
  component:  { bg: 'bg-violet-50 dark:bg-violet-900/30', border: 'border-violet-300 dark:border-violet-700', text: 'text-violet-700 dark:text-violet-300' },
  capability: { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-300' },
  claim:      { bg: 'bg-rose-50 dark:bg-rose-900/30', border: 'border-rose-300 dark:border-rose-700', text: 'text-rose-700 dark:text-rose-300' },
  indicator:  { bg: 'bg-cyan-50 dark:bg-cyan-900/30', border: 'border-cyan-300 dark:border-cyan-700', text: 'text-cyan-700 dark:text-cyan-300' },
};

const ROOT_ID = '__sustainability_root__';

function flattenAllNodes(nodes: ApiNode[]): FlatNode[] {
  const result: FlatNode[] = [];
  for (const node of nodes) {
    result.push({
      id: node.slug,
      parentId: node.parentSlug ?? null,
      title: node.title ?? node.slug,
      type: node.type ?? 'unknown',
    });
    if (node.children?.length) {
      result.push(...flattenAllNodes(node.children));
    }
  }
  return result;
}

function typeLabel(type: string): string {
  const key = `sustainability-graph-page.type-${type}` as const;
  return t(key);
}

async function fetchData() {
  loading.value = true;
  error.value = '';
  try {
    const res = await grcRepo.capitalTree({ level: 6 });
    if (res?.result && Array.isArray(res.data)) {
      treeData.value = res.data as ApiNode[];
    } else {
      treeData.value = [];
    }
  } catch {
    error.value = t('sustainability-graph-page.error-message');
  } finally {
    loading.value = false;
  }
}

function buildChartData(): FlatNode[] {
  if (treeData.value.length === 0) return [];

  const allNodes = flattenAllNodes(treeData.value);

  const root: FlatNode = {
    id: ROOT_ID,
    parentId: null,
    title: 'پایداری',
    type: 'root',
  };

  const nodesWithRoot: FlatNode[] = allNodes.map((n) => ({
    ...n,
    parentId: n.parentId === null ? ROOT_ID : n.parentId,
  }));

  return [root, ...nodesWithRoot];
}

function renderChart() {
  if (!chartContainer.value) return;

  const flat = buildChartData();
  if (flat.length === 0) return;

  if (chart) {
    chart.data(flat).render();
    return;
  }

  chart = new OrgChart()
    .container(chartContainer.value)
    .data(flat)
    .nodeWidth(() => 220)
    .nodeHeight(() => 80)
    .compact(false)
    .nodeContent((node: FlatNode) => {
      if (node.id === ROOT_ID) {
        return `
          <div class="flex flex-col items-center justify-center w-full h-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-2 cursor-pointer select-none"
               style="font-family: 'IRANSans', 'Vazirmatn', Tahoma, sans-serif;"
               dir="rtl">
            <div class="w-full truncate text-center text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
              ${node.title}
            </div>
            <div class="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium text-slate-500 dark:text-slate-400">
              ${flat.length - 1} سرمایه
            </div>
          </div>
        `;
      }
      const colors = TYPE_COLORS[node.type] ?? TYPE_COLORS.sustainability;
      const title = node.title ?? node.id;
      const truncated = title.length > 28 ? title.slice(0, 26) + '…' : title;
      return `
        <div class="flex flex-col items-center justify-center w-full h-full rounded-lg border ${colors.border} ${colors.bg} px-3 py-2 cursor-pointer select-none"
             style="font-family: 'IRANSans', 'Vazirmatn', Tahoma, sans-serif;"
             dir="rtl">
          <div class="w-full truncate text-center text-[11px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">
            ${truncated}
          </div>
          <div class="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium ${colors.text} ${colors.bg} border ${colors.border}">
            ${typeLabel(node.type)}
          </div>
        </div>
      `;
    })
    .onNodeClick((_event: unknown, node: FlatNode) => {
      if (!chart || node.id === ROOT_ID) return;
      const data = chart.data();
      const datum = data.find((d: FlatNode) => d.id === node.id);
      if (datum) {
        if (datum._children) {
          datum._children = null;
        }
      }
    })
    .render();

  chart.collapseAll();
}

function collapseAll() {
  chart?.collapseAll();
}

function expandAll() {
  chart?.expandAll();
}

onMounted(async () => {
  await fetchData();
  await nextTick();
  renderChart();
});

onBeforeUnmount(() => {
  if (chart) {
    chart = null;
  }
  if (chartContainer.value) {
    chartContainer.value.innerHTML = '';
  }
});
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12">
      <div class="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
        <!-- Header -->
        <div class="border-b border-slate-200/60 bg-slate-50/80 px-4 py-3 dark:border-darkmode-700/60 dark:bg-darkmode-800/80">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                <svg class="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="6" y1="3" x2="6" y2="15" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <path d="M18 9a9 9 0 0 1-9 9" />
                </svg>
              </div>
              <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {{ t('menu.sustainability-graph') }}
              </span>
            </div>
            <div v-if="!loading && !error" class="flex items-center gap-1.5">
              <button
                type="button"
                class="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700"
                @click="collapseAll"
              >
                {{ t('sustainability-graph-page.collapse-all') }}
              </button>
              <button
                type="button"
                class="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700"
                @click="expandAll"
              >
                {{ t('sustainability-graph-page.expand-all') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <div class="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
          <span class="mt-3 text-xs text-slate-500 dark:text-slate-400">{{ t('sustainability-graph-page.loading') }}</span>
        </div>

        <div v-else-if="error" class="flex flex-col items-center justify-center py-20">
          <span class="text-sm text-danger">{{ t('sustainability-graph-page.error-title') }}</span>
          <span class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ error }}</span>
          <button
            type="button"
            class="mt-3 inline-flex h-8 items-center gap-1 rounded-md border border-primary bg-primary px-3 text-xs font-medium text-white transition hover:opacity-90"
            @click="fetchData"
          >
            {{ t('sustainability-graph-page.retry') }}
          </button>
        </div>

        <div
          v-else
          ref="chartContainer"
          class="min-h-[500px] overflow-auto p-2"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.org-chart) {
  display: flex;
  justify-content: center;
}

:deep(.node) {
  cursor: pointer;
}

:deep(.links) {
  stroke: #cbd5e1;
  stroke-width: 1.5;
}

:deep(.node rect) {
  rx: 8;
  ry: 8;
}
</style>
