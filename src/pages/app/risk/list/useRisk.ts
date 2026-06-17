import { ref, computed } from 'vue';
import { grcRepo } from '@/core/repositories/grcRepo';

export interface RiskCategory {
  id: number;
  slug: string;
  title: string;
  parentSlug: string | null;
  children?: RiskCategory[];
}

export interface RiskTask {
  id?: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  riskType: 'threat' | 'opportunity';
  categorySlug: string;
  subCategorySlug: string;
  categoryTitle?: string;
  subCategoryTitle?: string;
  source: string;
  owner: string;
  status: string;
  impact: number | null;
  likelihood: number | null;
  inherentScore: number | null;
  riskLevel: string | null;
  note: string;
  treatmentStrategy: string;
  framework: string[];
  control: string[];
  tasks: RiskTask[];
  residualImpact: number | null;
  residualLikelihood: number | null;
  residualScore: number | null;
  residualLevel: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export function useRisk() {
  const loading = ref(false);
  const categories = ref<RiskCategory[]>([]);

  const categoryOptions = computed(() =>
    categories.value
      .filter((c) => !c.parentSlug)
      .map((c) => ({ value: c.slug, label: c.title }))
  );

  function subCategoryOptions(parentSlug: string) {
    if (!parentSlug) return [];
    return categories.value
      .filter((c) => c.parentSlug === parentSlug)
      .map((c) => ({ value: c.slug, label: c.title }));
  }

  async function fetchCategories() {
    try {
      const res = await grcRepo.riskCategories({ limit: 200 });
      if (res?.result && Array.isArray(res.data)) {
        categories.value = res.data as RiskCategory[];
      } else if (res?.result && res.data && 'list' in (res.data as Record<string, unknown>)) {
        categories.value = ((res.data as Record<string, unknown>).list as RiskCategory[]) ?? [];
      }
    } catch {
      categories.value = [];
    }
  }

  async function fetchRisk(id: string): Promise<Risk | null> {
    loading.value = true;
    try {
      const res = await grcRepo.riskGet(id);
      if (res?.result && res.data) {
        return res.data as unknown as Risk;
      }
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createRisk(data: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    loading.value = true;
    try {
      const res = await grcRepo.riskCreate(data);
      if (res?.result) return res.data as Record<string, unknown>;
      throw new Error(res?.error?.[0] ?? 'Failed to create risk');
    } finally {
      loading.value = false;
    }
  }

  async function updateRisk(id: string, data: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    loading.value = true;
    try {
      const res = await grcRepo.riskUpdate(id, data);
      if (res?.result) return res.data as Record<string, unknown>;
      throw new Error(res?.error?.[0] ?? 'Failed to update risk');
    } finally {
      loading.value = false;
    }
  }

  async function transitionRisk(id: string, to: string): Promise<Record<string, unknown> | null> {
    loading.value = true;
    try {
      const res = await grcRepo.riskTransition(id, to);
      if (res?.result) return res.data as Record<string, unknown>;
      throw new Error(res?.error?.[0] ?? 'Failed to transition risk');
    } finally {
      loading.value = false;
    }
  }

  async function updateTasks(id: string, tasks: RiskTask[]): Promise<Record<string, unknown> | null> {
    loading.value = true;
    try {
      const res = await grcRepo.riskTasksUpdate(id, tasks);
      if (res?.result) return res.data as Record<string, unknown>;
      throw new Error(res?.error?.[0] ?? 'Failed to update tasks');
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    categories,
    categoryOptions,
    subCategoryOptions,
    fetchCategories,
    fetchRisk,
    createRisk,
    updateRisk,
    transitionRisk,
    updateTasks,
  };
}