<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue';
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
const searchQuery = ref('');
const breadcrumb = ref<string[]>([]);

const ROOT_ID = '__sustainability_root__';

const TYPE_COLORS: Record<string, { border: string; topBorder: string; text: string; icon: string }> = {
  capital: { border: 'border-blue-200', topBorder: 'bg-blue-600', text: 'text-blue-700', icon: '💰' },
  domain: { border: 'border-emerald-200', topBorder: 'bg-emerald-600', text: 'text-emerald-700', icon: '📁' },
  component: { border: 'border-violet-200', topBorder: 'bg-violet-600', text: 'text-violet-700', icon: '⚙️' },
  capability: { border: 'border-amber-200', topBorder: 'bg-amber-600', text: 'text-amber-700', icon: '🎯' },
  sustainability: { border: 'border-slate-200', topBorder: 'bg-slate-700', text: 'text-slate-700', icon: '🌳' },
};

const typeLabel = (type: string) => t(`sustainability-graph-page.type-${type}` as any);

// Statistics
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
    title: 'پایداری',
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
      .nodeWidth(() => 260)
      .nodeHeight(() => 110)
      .compact(false)
      .nodeContent((node: any) => {
        const data = node.data as FlatNode;
        if (data.id === ROOT_ID) {
          return `
          <div class="flex flex-col items-center justify-center w-full h-full rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm px-4 py-3 cursor-pointer">
            <div class="text-3xl mb-1">🌳</div>
            <div class="font-bold text-lg text-slate-800 dark:text-slate-100">${data.title}</div>
            <div class="text-xs text-slate-500 mt-1">${flat.length - 1} سرمایه</div>
          </div>`;
        }

        const colors = TYPE_COLORS[data.type] || TYPE_COLORS.sustainability;
        const truncated = data.title.length > 35 ? data.title.slice(0, 32) + '…' : data.title;

        return `
        <div class="node-card group relative flex flex-col w-full h-full rounded-2xl border ${colors.border} bg-white dark:bg-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer">
          <!-- Top colored bar -->
          <div class="h-1.5 w-full ${colors.topBorder}"></div>

          <div class="flex-1 p-4 flex flex-col">
            <div class="flex items-start gap-3">
              <span class="text-2xl flex-shrink-0 mt-0.5">${colors.icon}</span>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm leading-tight text-slate-800 dark:text-slate-100 line-clamp-2">
                  ${truncated}
                </div>
                <div class="mt-2 text-[10px] font-medium ${colors.text} uppercase tracking-widest">
                  ${typeLabel(data.type)}
                </div>
              </div>
            </div>
          </div>

          ${data.childrenCount ? `
          <div class="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-2 text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>${data.childrenCount} فرزند</span>
          </div>` : ''}
        </div>`;
      })
      .onNodeClick((event: any, node: any) => {
        if (node.data.id === ROOT_ID) return;

        const fullNode = getNodeFullData(node.data.id);
        if (fullNode) {
          selectedNode.value = { ...node.data, ...fullNode };
          updateBreadcrumb(node);
        }
      })
      .render();

  chart.collapseAll();
}

// Controls
const collapseAll = () => chart?.collapseAll();
const expandAll = () => chart?.expandAll();
const fitScreen = () => chart?.fit?.();
const centerRoot = () => chart?.centerNode?.(ROOT_ID);
const zoomIn = () => chart?.zoomIn?.();
const zoomOut = () => chart?.zoomOut?.();

async function exportPNG() {
  if (!chart) return;
  // d3-org-chart has .exportImage() or similar depending on version
  try {
    await chart.exportImage?.({ filename: 'sustainability-graph' });
  } catch (e) {
    alert('Export feature requires latest d3-org-chart');
  }
}

// Search
const performSearch = () => {
  if (!chart || !searchQuery.value.trim()) return;

  const query = searchQuery.value.toLowerCase().trim();
  const data = chart.data();

  const match = data.find((n: any) =>
      n.title?.toLowerCase().includes(query)
  );

  if (match) {
    chart.centerNode(match.id);
    // Optional: highlight via custom class (advanced)
  }
};

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
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-3xl">
            🌳
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{{ t('menu.sustainability-graph') }}</h1>
            <p class="text-sm text-slate-500">Capital Tree Framework</p>
          </div>
        </div>

        <!-- Stats -->
        <div class="flex gap-8 text-sm">
          <div><span class="font-semibold text-emerald-600">{{ stats.capital }}</span> Capital</div>
          <div><span class="font-semibold text-violet-600">{{ stats.domain }}</span> Domain</div>
          <div><span class="font-semibold text-amber-600">{{ stats.component }}</span> Component</div>
          <div><span class="font-semibold text-rose-600">{{ stats.capability }}</span> Capability</div>
        </div>

        <div class="flex items-center gap-3">
          <input
              v-model="searchQuery"
              @keyup.enter="performSearch"
              placeholder="جستجو در گراف..."
              class="w-80 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          <button @click="performSearch" class="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
            جستجو
          </button>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center gap-3">
      <button @click="expandAll" class="btn">Expand All</button>
      <button @click="collapseAll" class="btn">Collapse All</button>
      <button @click="fitScreen" class="btn">Fit Screen</button>
      <button @click="centerRoot" class="btn">Center Root</button>
      <button @click="zoomIn" class="btn">Zoom +</button>
      <button @click="zoomOut" class="btn">Zoom -</button>
      <button @click="exportPNG" class="btn">Export PNG</button>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Main Chart -->
      <div class="flex-1 flex flex-col">
        <div
            ref="chartContainer"
            class="flex-1 overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:20px_20px] p-8"
        />
      </div>

      <!-- Side Panel -->
      <div v-if="selectedNode" class="w-96 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-auto">
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <div>
              <div class="text-4xl mb-2">{{ TYPE_COLORS[selectedNode.type]?.icon || '📌' }}</div>
              <h2 class="text-xl font-semibold">{{ selectedNode.title }}</h2>
              <p class="text-sm text-slate-500">{{ typeLabel(selectedNode.type) }}</p>
            </div>
            <button @click="selectedNode = null" class="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <div class="space-y-6">
            <div v-if="selectedNode.description" class="prose dark:prose-invert">
              <h4 class="text-xs uppercase tracking-widest text-slate-500 mb-2">توضیحات</h4>
              <p>{{ selectedNode.description }}</p>
            </div>

            <div v-if="selectedNode.version">
              <h4 class="text-xs uppercase tracking-widest text-slate-500 mb-2">نسخه</h4>
              <p class="font-mono">{{ selectedNode.version }}</p>
            </div>

            <div>
              <h4 class="text-xs uppercase tracking-widest text-slate-500 mb-2">Slug</h4>
              <p class="font-mono text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded">{{ selectedNode.slug }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn {
  @apply px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors;
}

.node-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.org-chart) {
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.node) {
  cursor: pointer;
}
</style>