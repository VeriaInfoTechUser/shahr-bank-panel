import { ref, computed } from 'vue';
import { grcRepo } from '@/core/repositories/grcRepo';

export interface RiskCategory {
  slug: string;
  title: string;
  children?: RiskCategory[];
}

export interface RiskTask {
  id?: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
}

export interface Risk {
  id: string;
  slug: string;
  title: string;
  draft_description: string;
  analysis_description: string;
  response_description: string;
  monitoring_description: string;
  riskType: 'threat' | 'opportunity';
  categorySlug: string;
  subCategorySlug: string;
  categoryTitle?: string;
  subCategoryTitle?: string;
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

  async function fetchRisk(slug: string): Promise<Risk | null> {
    loading.value = true;
    try {
      const res = await grcRepo.riskGet(slug);
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

  async function updateRisk(slug: string, data: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    loading.value = true;
    try {
      const res = await grcRepo.riskUpdate(slug, data);
      if (res?.result) return res.data as Record<string, unknown>;
      throw new Error(res?.error?.[0] ?? 'Failed to update risk');
    } finally {
      loading.value = false;
    }
  }

  async function transitionRisk(slug: string, to: string, body?: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    loading.value = true;
    try {
      const res = await grcRepo.riskAction(slug, to, body);
      if (res?.result) return res.data as Record<string, unknown>;
      throw new Error(res?.error?.[0] ?? 'Failed to transition risk');
    } finally {
      loading.value = false;
    }
  }

  async function updateTasks(slug: string, tasks: RiskTask[]): Promise<Record<string, unknown> | null> {
    loading.value = true;
    try {
      const res = await grcRepo.riskTasksUpdate(slug, tasks);
      if (res?.result) return res.data as Record<string, unknown>;
      throw new Error(res?.error?.[0] ?? 'Failed to update tasks');
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    fetchRisk,
    createRisk,
    updateRisk,
    transitionRisk,
    updateTasks,
  };
}