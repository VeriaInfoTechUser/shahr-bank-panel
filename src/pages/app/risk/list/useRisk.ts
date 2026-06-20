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
  state: 'open' | 'in_progress' | 'done';
}

export interface StateHistoryEntry {
  date: string;
  ownerId: string;
  toState: string;
  changelog: Record<string, { to: unknown; from: unknown }>;
  fromState: string | null;
  updatedBy: string | null;
  description: string | null;
}

export interface Risk {
  id: string;
  slug: string;
  type: string;
  source: string;
  status: number;
  state: string;
  parentSlug: string | null;
  tenantId: string | null;
  title: string;
  description: string | null;
  createDescription: string | null;
  draftDescription: string;
  registerDescription: string;
  analysisDescription: string;
  responseDescription: string;
  monitoringDescription: string;
  deadline: string | null;
  ownerId: string;
  riskType: 'threat' | 'opportunity';
  categorySlug: string;
  categoryTitle: string;
  subCategorySlug: string;
  subCategoryTitle: string;
  inherentImpact: number | null;
  inherentLikelihood: number | null;
  impact: number | null;
  likelihood: number | null;
  score: number | null;
  level: string | null;
  residualImpact: number | null;
  residualLikelihood: number | null;
  strategy: string;
  vulnerability: string;
  threat: string;
  treatmentStrategy: string;
  controlSlug: string;
  controlTitle: string;
  tasks: string[];
  frameworkSlug: string;
  frameworkTitle: string;
  domainSlug: string;
  domainTitle: string;
  controls: { controlSlug: string; assigneeId: string }[];
  stateHistory: StateHistoryEntry[];
  createdBy: string | null;
  updatedBy: string | null;
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

  async function deleteRisk(slug: string): Promise<boolean> {
    loading.value = true;
    try {
      const res = await grcRepo.riskDelete(slug);
      if (res?.result) return true;
      throw new Error(res?.error?.[0] ?? 'Failed to delete risk');
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
    deleteRisk,
  };
}