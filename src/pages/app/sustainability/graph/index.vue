<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { OrgChart } from 'd3-org-chart';
import { grcRepo } from '@/core/repositories/grcRepo';
import Lucide from '@/base-components/Lucide';
import Button from '@/base-components/Button';

const { t } = useI18n();

interface ApiNode {
  id: string | number;
  slug: string;
  type: string;
  title: string;
  parentSlug?: string | null;
  children?: ApiNode[];
  description?: string | null;
  version?: string | null;
  information?: any;
  [key: string]: unknown;
}

interface FlatNode {
  id: string;
  parentId: string | null;
  title: string;
  type: string;
  childrenCount?: number;
}

const chartContainer = ref<HTMLDivElement | null>(null);
const loading = ref(false);
const error = ref('');
const treeData = ref<ApiNode[]>([]);
let chart: InstanceType<typeof OrgChart> | null = null;

const selectedNode = ref<any>(null);
const breadcrumb = ref<string[]>([]);

const ROOT_ID = '__sustainability_root__';

const TYPE_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  capital: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
    icon: 'Coins',
  },
  domain: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    icon: 'FolderOpen',
  },
  component: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-300',
    icon: 'Settings',
  },
  capability: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-300',
    icon: 'Target',
  },
  sustainability: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    icon: 'Leaf',
  },
};

const typeLabel = (type: string) => t(`sustainability-graph-page.type-${type}` as any);

const LUCIDE_SVGS: Record<string, string> = {
  Coins: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>',
  FolderOpen: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>',
  Settings: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  Target: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  Leaf: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
};

function getIconSvg(iconName: string): string {
  return LUCIDE_SVGS[iconName] || '';
}

const stats = computed(() => {
  const counts: Record<string, number> = { capital: 0, domain: 0, component: 0, capability: 0 };
  const flatten = (nodes: ApiNode[]) => {
    nodes.forEach(n => {
      if (n.type in counts) counts[n.type as keyof typeof counts]++;
      if (n.children) flatten(n.children);
    });
  };
  flatten(treeData.value);
  return counts;
});

function countChildren(node: ApiNode): number {
  let count = 0;
  const recurse = (n: ApiNode) => {
    count += (n.children?.length || 0);
    n.children?.forEach(recurse);
  };
  recurse(node);
  return count;
}

function flattenAllNodes(nodes: ApiNode[], parentId: string | null = null): FlatNode[] {
  const result: FlatNode[] = [];
  nodes.forEach(node => {
    result.push({
      id: node.slug,
      parentId,
      title: node.title,
      type: node.type,
      childrenCount: countChildren(node),
    });
    if (node.children?.length) {
      result.push(...flattenAllNodes(node.children, node.slug));
    }
  });
  return result;
}

async function fetchData() {
  loading.value = true;
  error.value = '';
  try {
    const res = await grcRepo.capitalTree({ level: 6 });
    if (res?.result && Array.isArray(res.data)) {
      treeData.value = res.data as ApiNode[];
    }
  } catch (e) {
    error.value = t('sustainability-graph-page.error-message');
  } finally {
    loading.value = false;
  }
}

function buildChartData(): FlatNode[] {
  if (!treeData.value.length) return [];
  const flatNodes = flattenAllNodes(treeData.value);
  const root: FlatNode = {
    id: ROOT_ID,
    parentId: null,
    title: t('menu.sustainability'),
    type: 'sustainability',
  };
  return [root, ...flatNodes.map(n => ({
    ...n,
    parentId: n.parentId === null ? ROOT_ID : n.parentId,
  }))];
}

function getNodeFullData(slug: string): ApiNode | null {
  const find = (nodes: ApiNode[]): ApiNode | null => {
    for (const node of nodes) {
      if (node.slug === slug) return node;
      if (node.children) {
        const found = find(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return find(treeData.value);
}

function updateBreadcrumb(node: any) {
  breadcrumb.value = [];
  if (!chart) return;
  const path = chart.getNodePath?.(node.id) || [];
  breadcrumb.value = path.map((n: any) => n.data.title).filter(Boolean);
}

function renderChart() {
  if (!chartContainer.value) return;
  const flat = buildChartData();
  if (!flat.length) return;
  if (chart) {
    chart.data(flat).render();
    return;
  }

  chart = new OrgChart()
    .container(chartContainer.value)
    .data(flat)
    .nodeWidth(() => 240)
    .nodeHeight(() => 100)
    .compact(false)
    .nodeContent((node: any) => {
      const data = node.data as FlatNode;
      if (data.id === ROOT_ID) {
        return `
        <div class="flex items-center gap-3 w-full h-full rounded-xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/30 dark:to-slate-800 shadow-lg px-4 py-3 cursor-pointer">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-800/50">
            <span class="text-emerald-600">${getIconSvg('Leaf')}</span>
          </div>
          <div>
            <div class="font-bold text-base text-slate-800 dark:text-slate-100">${data.title}</div>
            <div class="text-[11px] text-slate-500 mt-0.5">${flat.length - 1} node</div>
          </div>
        </div>`;
      }

      const cfg = TYPE_CONFIG[data.type] || TYPE_CONFIG.sustainability;
      const truncated = data.title.length > 30 ? data.title.slice(0, 27) + '…' : data.title;
      const iconSvg = getIconSvg(cfg.icon);

      return `
      <div class="node-card group relative flex flex-col w-full h-full rounded-xl border ${cfg.border} bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer">
        <div class="flex items-center gap-3 p-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg ${cfg.bg} dark:bg-slate-700 flex-shrink-0">
            <span class="${cfg.text}">${iconSvg}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-xs leading-tight text-slate-800 dark:text-slate-100 line-clamp-2">
              ${truncated}
            </div>
            <div class="mt-1 text-[9px] font-semibold ${cfg.text} uppercase tracking-wider">
              ${typeLabel(data.type)}
            </div>
          </div>
        </div>
        ${data.childrenCount ? `
        <div class="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 text-[10px] font-medium text-slate-500 flex items-center gap-1">
          <span class="text-slate-400">#</span>
          ${data.childrenCount}
        </div>` : ''}
      </div>`;
    })
    .onNodeClick((event: any, node: any) => {
      if (node.data.id === ROOT_ID) return;

      // Expand/collapse on click
      if (node.children?.length) {
        chart?.expand(node.data.id);
      }

      const fullNode = getNodeFullData(node.data.id);
      if (fullNode) {
        selectedNode.value = { ...node.data, ...fullNode };
        updateBreadcrumb(node);
      }
    })
    .render();

  chart.collapseAll();
}

const collapseAll = () => chart?.collapseAll();
const expandAll = () => chart?.expandAll();
const fitScreen = () => chart?.fit?.();
const centerRoot = () => chart?.centerNode?.(ROOT_ID);
const zoomIn = () => chart?.zoomIn?.();
const zoomOut = () => chart?.zoomOut?.();

async function exportPNG() {
  if (!chart) return;
  try {
    await chart.exportImage?.({ filename: 'sustainability-graph' });
  } catch (e) {
    // Export not supported
  }
}

onMounted(async () => {
  await fetchData();
  await nextTick();
  renderChart();
});

onBeforeUnmount(() => {
  if (chart) chart = null;
  if (chartContainer.value) chartContainer.value.innerHTML = '';
});
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
    <!-- Header -->
    <div class="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
            <Lucide icon="GitBranch" class="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 class="text-lg font-bold text-slate-900 dark:text-white">{{ t('menu.sustainability-graph') }}</h1>
            <p class="text-xs text-slate-500">{{ t('sustainability-graph-page.description') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center gap-2">
      <Button variant="outline-secondary" size="sm" @click="expandAll">
        <Lucide icon="ChevronsUpDown" class="h-4 w-4" />
        {{ t('sustainability-graph-page.expand-all') }}
      </Button>
      <Button variant="outline-secondary" size="sm" @click="collapseAll">
        <Lucide icon="Minimize2" class="h-4 w-4" />
        {{ t('sustainability-graph-page.collapse-all') }}
      </Button>
      <div class="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
      <Button variant="outline-secondary" size="sm" @click="zoomIn">
        <Lucide icon="ZoomIn" class="h-4 w-4" />
      </Button>
      <Button variant="outline-secondary" size="sm" @click="zoomOut">
        <Lucide icon="ZoomOut" class="h-4 w-4" />
      </Button>
      <Button variant="outline-secondary" size="sm" @click="fitScreen">
        <Lucide icon="Maximize2" class="h-4 w-4" />
      </Button>
      <Button variant="outline-secondary" size="sm" @click="centerRoot">
        <Lucide icon="Crosshair" class="h-4 w-4" />
      </Button>
      <div class="flex-1"></div>
      <Button variant="outline-secondary" size="sm" @click="exportPNG">
        <Lucide icon="Download" class="h-4 w-4" />
        PNG
      </Button>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Main Chart -->
      <div class="flex-1 flex flex-col relative">
        <!-- Loading -->
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 z-10">
          <div class="flex flex-col items-center gap-3">
            <div class="h-8 w-8 animate-spin rounded-full border-3 border-slate-300 border-t-primary"></div>
            <span class="text-sm text-slate-500">{{ t('general.loading') }}</span>
          </div>
        </div>
        <!-- Error -->
        <div v-if="error && !loading" class="absolute inset-0 flex items-center justify-center z-10">
          <div class="flex flex-col items-center gap-3 text-center">
            <div class="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <Lucide icon="AlertTriangle" class="h-6 w-6 text-red-500" />
            </div>
            <p class="text-sm text-slate-600">{{ error }}</p>
            <Button variant="primary" size="sm" @click="fetchData">
              <Lucide icon="RefreshCw" class="h-4 w-4" />
              {{ t('sustainability-graph-page.retry') }}
            </Button>
          </div>
        </div>
        <!-- Chart -->
        <div
          ref="chartContainer"
          class="flex-1 overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:20px_20px]"
        />
      </div>

      <!-- Side Panel -->
      <Transition name="slide-panel">
        <div v-if="selectedNode" class="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-auto flex-shrink-0">
          <div class="p-5">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-start gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                  :class="TYPE_CONFIG[selectedNode.type]?.bg || 'bg-slate-100'"
                >
                  <Lucide
                    :icon="TYPE_CONFIG[selectedNode.type]?.icon || 'Circle'"
                    class="h-5 w-5"
                    :class="TYPE_CONFIG[selectedNode.type]?.text || 'text-slate-700'"
                  />
                </div>
                <div class="min-w-0">
                  <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">{{ selectedNode.title }}</h2>
                  <p class="text-xs text-slate-500 mt-0.5">{{ typeLabel(selectedNode.type) }}</p>
                </div>
              </div>
              <button @click="selectedNode = null" class="text-slate-400 hover:text-slate-600 p-1">
                <Lucide icon="X" class="h-4 w-4" />
              </button>
            </div>

            <div class="space-y-4">
              <div v-if="selectedNode.description">
                <h4 class="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">{{ t('sustainability-fundamental-capitals-page.col-description') }}</h4>
                <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{{ selectedNode.description }}</p>
              </div>

              <div v-if="selectedNode.version">
                <h4 class="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">{{ t('sustainability-graph-page.version') }}</h4>
                <span class="inline-block px-2 py-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">{{ selectedNode.version }}</span>
              </div>

              <div>
                <h4 class="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Slug</h4>
                <code class="block text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-600 dark:text-slate-400 break-all">{{ selectedNode.slug }}</code>
              </div>

              <div v-if="selectedNode.information">
                <h4 class="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">{{ t('sustainability-graph-page.details') }}</h4>
                <div class="space-y-2">
                  <template v-for="(val, key) in selectedNode.information" :key="key">
                    <div v-if="val != null && val !== ''" class="flex justify-between text-xs">
                      <span class="text-slate-500">{{ key }}</span>
                      <span class="text-slate-700 dark:text-slate-300 font-medium text-left max-w-[60%] truncate">{{ val }}</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
