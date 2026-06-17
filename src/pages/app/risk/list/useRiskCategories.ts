import { ref, computed } from 'vue';
import { grcRepo } from '@/core/repositories/grcRepo';

export interface RiskCategoryNode {
  slug: string;
  title: string;
  children?: RiskCategoryNode[];
}

export function useRiskCategories() {
  const tree = ref<RiskCategoryNode[]>([]);
  const flatList = ref<RiskCategoryNode[]>([]);
  const loading = ref(false);

  const categoryOptions = computed(() =>
    tree.value.map((c) => ({ value: c.slug, label: c.title }))
  );

  function subCategoryOptions(parentSlug: string) {
    if (!parentSlug) return [];
    const parent = tree.value.find((c) => c.slug === parentSlug);
    if (!parent?.children) return [];
    return parent.children.map((c) => ({ value: c.slug, label: c.title }));
  }

  function getCategoryTitle(slug: string): string {
    return tree.value.find((c) => c.slug === slug)?.title ?? '';
  }

  function getSubCategoryTitle(parentSlug: string, childSlug: string): string {
    const parent = tree.value.find((c) => c.slug === parentSlug);
    return parent?.children?.find((c) => c.slug === childSlug)?.title ?? '';
  }

  const filterCategoryOptions = computed(() =>
    flatList.value.map((c) => ({ value: c.slug, label: c.title }))
  );

  async function fetchTree() {
    loading.value = true;
    try {
      const res = await grcRepo.riskCategoriesTree();
      if (res?.result && Array.isArray(res.data)) {
        tree.value = res.data as RiskCategoryNode[];
      }
    } catch {
      tree.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchList() {
    try {
      const res = await grcRepo.riskCategoriesList();
      if (res?.result && Array.isArray(res.data)) {
        flatList.value = res.data as RiskCategoryNode[];
      }
    } catch {
      flatList.value = [];
    }
  }

  return {
    tree,
    flatList,
    loading,
    categoryOptions,
    subCategoryOptions,
    filterCategoryOptions,
    getCategoryTitle,
    getSubCategoryTitle,
    fetchTree,
    fetchList,
  };
}
