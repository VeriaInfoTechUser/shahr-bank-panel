import { ref, computed } from 'vue';
import { grcRepo } from '@/core/repositories/grcRepo';

export interface CapabilityNode {
  slug: string;
  title: string;
  parentSlug: string | null;
  type: string;
  children?: CapabilityNode[];
}

export function useCapabilityTree() {
  const tree = ref<CapabilityNode[]>([]);
  const loading = ref(false);

  const capitalOptions = computed(() =>
    tree.value.map((c) => ({ value: c.slug, label: c.title }))
  );

  function findNode(nodes: CapabilityNode[], slug: string): CapabilityNode | undefined {
    for (const node of nodes) {
      if (node.slug === slug) return node;
      if (node.children) {
        const found = findNode(node.children, slug);
        if (found) return found;
      }
    }
    return undefined;
  }

  function domainOptions(capitalSlug: string) {
    if (!capitalSlug) return [];
    const capital = tree.value.find((c) => c.slug === capitalSlug);
    if (!capital?.children) return [];
    return capital.children.map((c) => ({ value: c.slug, label: c.title }));
  }

  function componentOptions(domainSlug: string) {
    if (!domainSlug) return [];
    const domain = findNode(tree.value, domainSlug);
    if (!domain?.children) return [];
    return domain.children.map((c) => ({ value: c.slug, label: c.title }));
  }

  function capabilityOptions(componentSlug: string) {
    if (!componentSlug) return [];
    const component = findNode(tree.value, componentSlug);
    if (!component?.children) return [];
    return component.children.map((c) => ({ value: c.slug, label: c.title }));
  }

  function getTitle(slug: string): string {
    const node = findNode(tree.value, slug);
    return node?.title ?? '';
  }

  async function fetchTree() {
    loading.value = true;
    try {
      const res = await grcRepo.capitalTree({ level: 4 });
      if (res?.result && Array.isArray(res.data)) {
        tree.value = res.data as unknown as CapabilityNode[];
      }
    } catch {
      tree.value = [];
    } finally {
      loading.value = false;
    }
  }

  return {
    tree,
    loading,
    capitalOptions,
    domainOptions,
    componentOptions,
    capabilityOptions,
    getTitle,
    fetchTree,
  };
}
