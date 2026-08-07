<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, ref, toValue, watch } from 'vue';
import { Form } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import BasePaginatedMultiSelect from '@/core/ui/base/BasePaginatedMultiSelect.vue';
import { grcRepo, type GrcApiResponse, type GrcPaginatedResponse } from '@/core/repositories/grcRepo';
import DataSourceFilterAutoApply from './DataSourceFilterAutoApply.vue';
import DataSourceFilterCascadeSync, { type DataSourceFilterParents } from './DataSourceFilterCascadeSync.vue';

const props = withDefaults(
  defineProps<{
    table?: {
      replaceFilters: (f: Record<string, unknown>) => void;
      clearFilters: () => void;
      filters?: Ref<Record<string, unknown>> | Record<string, unknown>;
    } | null;
    toolbarClearTick?: number;
  }>(),
  {
    table: null,
    toolbarClearTick: 0,
  }
);

const emit = defineEmits<{
  (e: 'apply', payload: Record<string, unknown>): void;
}>();

const { t } = useI18n();
const formKey = ref(0);
const formId = 'data-source-filter-form';

// ── Parents chain (capital → domain → component → capability → claim) ──
const parents = ref<DataSourceFilterParents>({
  capitalSlug: [],
  domainSlug: [],
  componentSlug: [],
  capabilitySlug: [],
  claimSlug: [],
});

function onParentsSync(p: DataSourceFilterParents) {
  parents.value = p;
}

// ── Sustainability tree (capital → domain → component → capability) ────────
// ۴ سطح اول از درخت می‌آیند؛ فقط هنگام باز شدنِ اولین سلکت، یک بار می‌گیرد و کش می‌کند.
interface TreeNode {
  slug: string;
  title?: string;
  name?: string;
  children?: TreeNode[];
}

interface TreeCacheEntry {
  tree: TreeNode[];
  fetchedAt: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let treeCache: TreeCacheEntry | null = null;
let treePromise: Promise<TreeNode[]> | null = null;

async function getTree(): Promise<TreeNode[]> {
  if (treeCache && Date.now() - treeCache.fetchedAt < CACHE_TTL) {
    return treeCache.tree;
  }
  if (!treePromise) {
    treePromise = (async () => {
      try {
        const res = await grcRepo.capitalTree({ level: 4 });
        if (res?.result && Array.isArray(res.data)) {
          treeCache = { tree: res.data as TreeNode[], fetchedAt: Date.now() };
        }
      } catch {
        treeCache = null;
      } finally {
        treePromise = null;
      }
      return treeCache?.tree ?? [];
    })();
  }
  return treePromise;
}

function collectAtDepth(nodes: TreeNode[], depth: number, target: number, out: TreeNode[]) {
  if (depth === target) {
    out.push(...nodes);
    return;
  }
  for (const n of nodes) {
    if (n.children?.length) collectAtDepth(n.children, depth + 1, target, out);
  }
}

function childrenOf(nodes: TreeNode[], slugs: string[]): TreeNode[] {
  const set = new Set(slugs);
  const out: TreeNode[] = [];
  for (const n of nodes) {
    if (set.has(n.slug) && n.children?.length) out.push(...n.children);
  }
  return out;
}

function toOptions(
  items: Array<{ slug?: unknown; title?: unknown; name?: unknown }>,
  params: { page: number; limit: number; title?: string; search?: string }
): { list: { value: unknown; label: string }[]; count: number } {
  const q = String(params.title ?? params.search ?? '').trim().toLowerCase();
  const filtered = q
    ? items.filter((n) => String(n.title ?? n.name ?? '').toLowerCase().includes(q))
    : items;
  const start = (params.page - 1) * params.limit;
  const pageItems = filtered.slice(start, start + params.limit);
  return {
    list: pageItems.map((n) => ({
      value: String(n.slug ?? ''),
      label: String(n.title ?? n.name ?? ''),
    })),
    count: filtered.length,
  };
}

// ── Claim & Indicator list APIs (lazy fetch + TTL cache) ──────────────────
// ادعا و شاخص از لیست‌های خودشان می‌آیند.
interface LevelItem {
  slug: string;
  title?: string | null;
  name?: string | null;
  parentSlug?: string | null;
}

interface ListCacheEntry {
  items: LevelItem[];
  fetchedAt: number;
}

const listCache = new Map<string, ListCacheEntry>();

type LevelFetcher = (params: { page: number; limit: number }) => Promise<GrcApiResponse<GrcPaginatedResponse>>;

async function getLevelItems(cacheKey: string, fetcher: LevelFetcher): Promise<LevelItem[]> {
  const hit = listCache.get(cacheKey);
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL) {
    return hit.items;
  }
  const items: LevelItem[] = [];
  let page = 1;
  const pageSize = 500;
  for (;;) {
    const res = await fetcher({ page, limit: pageSize });
    const list = res?.data?.list ?? [];
    if (Array.isArray(list)) {
      items.push(...(list as LevelItem[]));
    }
    const count = res?.data?.paginator?.count ?? 0;
    if (items.length >= count || list.length === 0 || page >= 20) break;
    page += 1;
  }
  listCache.set(cacheKey, { items, fetchedAt: Date.now() });
  return items;
}

function filterByParents(items: LevelItem[], slugs: string[]): LevelItem[] {
  if (!slugs.length) return items;
  const set = new Set(slugs);
  return items.filter((n) => n.parentSlug != null && set.has(String(n.parentSlug)));
}

async function fetchCapitals(params: { page: number; limit: number; title?: string; search?: string }) {
  const tree = await getTree();
  return toOptions(tree, params);
}

async function fetchDomains(params: { page: number; limit: number; title?: string; search?: string }) {
  const tree = await getTree();
  const all: TreeNode[] = [];
  collectAtDepth(tree, 0, 1, all);
  const nodes = parents.value.capitalSlug.length ? childrenOf(tree, parents.value.capitalSlug) : all;
  return toOptions(nodes, params);
}

async function fetchComponents(params: { page: number; limit: number; title?: string; search?: string }) {
  const tree = await getTree();
  const all: TreeNode[] = [];
  collectAtDepth(tree, 0, 2, all);
  const domains: TreeNode[] = [];
  collectAtDepth(tree, 0, 1, domains);
  const nodes = parents.value.domainSlug.length ? childrenOf(domains, parents.value.domainSlug) : all;
  return toOptions(nodes, params);
}

async function fetchCapabilities(params: { page: number; limit: number; title?: string; search?: string }) {
  const tree = await getTree();
  const all: TreeNode[] = [];
  collectAtDepth(tree, 0, 3, all);
  const components: TreeNode[] = [];
  collectAtDepth(tree, 0, 2, components);
  const nodes = parents.value.componentSlug.length ? childrenOf(components, parents.value.componentSlug) : all;
  return toOptions(nodes, params);
}

async function fetchClaims(params: { page: number; limit: number; title?: string; search?: string }) {
  const items = await getLevelItems('claim', (p) => grcRepo.claimList(p));
  return toOptions(filterByParents(items, parents.value.capabilitySlug), params);
}

async function fetchIndicators(params: { page: number; limit: number; title?: string; search?: string }) {
  const items = await getLevelItems('indicator', (p) => grcRepo.indicatorList(p));
  return toOptions(filterByParents(items, parents.value.claimSlug), params);
}

function apiFiltersToFormValues(f: Record<string, unknown> | undefined | null) {
  const x = f ?? {};
  return {
    title: String(x.title ?? ''),
    capitalSlug: Array.isArray(x.capitalSlug) ? x.capitalSlug.map(String) : x.capitalSlug ? [String(x.capitalSlug)] : [],
    domainSlug: Array.isArray(x.domainSlug) ? x.domainSlug.map(String) : x.domainSlug ? [String(x.domainSlug)] : [],
    componentSlug: Array.isArray(x.componentSlug) ? x.componentSlug.map(String) : x.componentSlug ? [String(x.componentSlug)] : [],
    capabilitySlug: Array.isArray(x.capabilitySlug) ? x.capabilitySlug.map(String) : x.capabilitySlug ? [String(x.capabilitySlug)] : [],
    claimSlug: Array.isArray(x.claimSlug) ? x.claimSlug.map(String) : x.claimSlug ? [String(x.claimSlug)] : [],
    indicatorSlug: Array.isArray(x.indicatorSlug) ? x.indicatorSlug.map(String) : x.indicatorSlug ? [String(x.indicatorSlug)] : [],
  };
}

const formInitialValues = computed(() =>
  apiFiltersToFormValues(toValue(props.table?.filters) ?? {})
);

watch(
  () => props.toolbarClearTick,
  (_v, prev) => {
    if (prev === undefined) return;
    formKey.value += 1;
  }
);

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  const title = String(values.title ?? '').trim();
  if (title) o.title = title;
  const capitalSlug = values.capitalSlug as string[] | undefined;
  if (capitalSlug?.length) o.capitalSlug = capitalSlug.length === 1 ? capitalSlug[0] : capitalSlug;
  const domainSlug = values.domainSlug as string[] | undefined;
  if (domainSlug?.length) o.domainSlug = domainSlug.length === 1 ? domainSlug[0] : domainSlug;
  const componentSlug = values.componentSlug as string[] | undefined;
  if (componentSlug?.length) o.componentSlug = componentSlug.length === 1 ? componentSlug[0] : componentSlug;
  const capabilitySlug = values.capabilitySlug as string[] | undefined;
  if (capabilitySlug?.length) o.capabilitySlug = capabilitySlug.length === 1 ? capabilitySlug[0] : capabilitySlug;
  const claimSlug = values.claimSlug as string[] | undefined;
  if (claimSlug?.length) o.claimSlug = claimSlug.length === 1 ? claimSlug[0] : claimSlug;
  const indicatorSlug = values.indicatorSlug as string[] | undefined;
  if (indicatorSlug?.length) o.indicatorSlug = indicatorSlug.length === 1 ? indicatorSlug[0] : indicatorSlug;
  return o;
}

function onAutoApply(payload: Record<string, unknown>) {
  if (props.table) {
    props.table.replaceFilters(payload);
  } else {
    emit('apply', payload);
  }
}
</script>

<template>
  <div>
    <Form
      :id="formId"
      :key="formKey"
      class="space-y-3"
      :initial-values="formInitialValues"
      as="div"
    >
      <DataSourceFilterCascadeSync @parents="onParentsSync" />
      <DataSourceFilterAutoApply
        :build-payload="buildPayload"
        @apply="onAutoApply"
      />
      <div class="grid grid-cols-1 gap-3">
        <BaseInput
          name="title"
          compact-label
          :label="t('sustainability-data-source-page.filter-field-title')"
        />
        <BasePaginatedMultiSelect
          name="capitalSlug"
          compact-label
          :label="t('sustainability-data-source-page.col-capital')"
          :fetch-fn="fetchCapitals"
          :limit="25"
          :search="true"
          placeholder=""
        />
        <BasePaginatedMultiSelect
          name="domainSlug"
          compact-label
          :label="t('sustainability-data-source-page.col-domain')"
          :fetch-fn="fetchDomains"
          :limit="25"
          :search="true"
          placeholder=""
        />
        <BasePaginatedMultiSelect
          name="componentSlug"
          compact-label
          :label="t('sustainability-data-source-page.col-component')"
          :fetch-fn="fetchComponents"
          :limit="25"
          :search="true"
          placeholder=""
        />
        <BasePaginatedMultiSelect
          name="capabilitySlug"
          compact-label
          :label="t('sustainability-data-source-page.col-capability')"
          :fetch-fn="fetchCapabilities"
          :limit="25"
          :search="true"
          placeholder=""
        />
        <BasePaginatedMultiSelect
          name="claimSlug"
          compact-label
          :label="t('sustainability-data-source-page.col-claim')"
          :fetch-fn="fetchClaims"
          :limit="25"
          :search="true"
          placeholder=""
        />
        <BasePaginatedMultiSelect
          name="indicatorSlug"
          compact-label
          :label="t('sustainability-data-source-page.col-indicator')"
          :fetch-fn="fetchIndicators"
          :limit="25"
          :search="true"
          placeholder=""
        />
      </div>
    </Form>
  </div>
</template>
