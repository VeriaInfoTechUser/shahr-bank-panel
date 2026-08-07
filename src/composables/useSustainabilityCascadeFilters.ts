import { ref } from 'vue';
import { grcRepo, type GrcApiResponse, type GrcPaginatedResponse } from '@/core/repositories/grcRepo';

export interface CascadeFilterParents {
  capitalSlug: string[];
  domainSlug: string[];
  componentSlug: string[];
  capabilitySlug: string[];
  claimSlug: string[];
}

// ── Sustainability tree (capital → domain → component → capability) ────────
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

// ── Claim list items ───────────────────────────────────────────────────────
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

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Cascading options for the sustainability hierarchy filters.
 *
 * - capital/domain/component/capability come from the level-4 capital tree
 *   (fetched lazily on first dropdown open, TTL-cached, promise-deduped)
 * - claim comes from `claimList` (lazy, TTL-cached per level)
 *
 * Each level's options are filtered by the currently selected parents, so
 * e.g. domains only show children of the selected capitals, and claims only
 * show children of the selected capabilities.
 */
export function useSustainabilityCascadeFilters() {
  const parents = ref<CascadeFilterParents>({
    capitalSlug: [],
    domainSlug: [],
    componentSlug: [],
    capabilitySlug: [],
    claimSlug: [],
  });

  function onParentsSync(p: CascadeFilterParents) {
    parents.value = p;
  }

  // ── Tree cache ───────────────────────────────────────────────────────────
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

  // ── List cache (claim / indicator) ───────────────────────────────────────
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

  // ── Option builder (search + pagination) ─────────────────────────────────
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

  // ── Level fetchers ───────────────────────────────────────────────────────
  type FetchParams = { page: number; limit: number; title?: string; search?: string };

  async function fetchCapitals(params: FetchParams) {
    const tree = await getTree();
    return toOptions(tree, params);
  }

  async function fetchDomains(params: FetchParams) {
    const tree = await getTree();
    const all: TreeNode[] = [];
    collectAtDepth(tree, 0, 1, all);
    const nodes = parents.value.capitalSlug.length ? childrenOf(tree, parents.value.capitalSlug) : all;
    return toOptions(nodes, params);
  }

  async function fetchComponents(params: FetchParams) {
    const tree = await getTree();
    const all: TreeNode[] = [];
    collectAtDepth(tree, 0, 2, all);
    const domains: TreeNode[] = [];
    collectAtDepth(tree, 0, 1, domains);
    const nodes = parents.value.domainSlug.length ? childrenOf(domains, parents.value.domainSlug) : all;
    return toOptions(nodes, params);
  }

  async function fetchCapabilities(params: FetchParams) {
    const tree = await getTree();
    const all: TreeNode[] = [];
    collectAtDepth(tree, 0, 3, all);
    const components: TreeNode[] = [];
    collectAtDepth(tree, 0, 2, components);
    const nodes = parents.value.componentSlug.length ? childrenOf(components, parents.value.componentSlug) : all;
    return toOptions(nodes, params);
  }

  async function fetchClaims(params: FetchParams) {
    const items = await getLevelItems('claim', (p) => grcRepo.claimList(p));
    return toOptions(filterByParents(items, parents.value.capabilitySlug), params);
  }

  async function fetchIndicators(params: FetchParams) {
    const items = await getLevelItems('indicator', (p) => grcRepo.indicatorList(p));
    return toOptions(filterByParents(items, parents.value.claimSlug), params);
  }

  return {
    parents,
    onParentsSync,
    fetchCapitals,
    fetchDomains,
    fetchComponents,
    fetchCapabilities,
    fetchClaims,
    fetchIndicators,
  };
}
