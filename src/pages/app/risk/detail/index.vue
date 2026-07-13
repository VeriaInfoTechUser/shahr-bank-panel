<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue3-toastify';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { useGlobalModal } from '@/composables/useGlobalModal';
import BaseConfirmModal from '@/core/ui/base/BaseConfirmModal.vue';
import { useRisk, type Risk } from '../list/useRisk';
import { useRiskTransition } from '../list/useRiskTransition';
import { ermRepo } from '@/core/repositories/ermRepo';
import RiskDraftModal from '../list/modals/RiskDraftModal.vue';
import RiskRegisteredModal from '../list/modals/RiskRegisteredModal.vue';
import RiskAnalysisModal from '../list/modals/RiskAnalysisModal.vue';
import RiskResponseModal from '../list/modals/RiskResponseModal.vue';
import RiskMonitoringModal from '../list/modals/RiskMonitoringModal.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { openModal } = useGlobalModal();
const { loading: apiLoading, fetchRisk, transitionRisk } = useRisk();
const { getTransitions } = useRiskTransition();

const risk = ref<Risk | null>(null);
const activeTab = ref<'overview' | 'details' | 'controls' | 'tasks' | 'history'>('overview');
const showEditModal = ref(false);
const memberOptions = ref<{ value: string; label: string }[]>([]);

function mapMembers(list: Record<string, unknown>[]) {
  return list
    .map((m) => {
      const id = m.id ?? m.user_id;
      if (id == null) return null;
      const label =
        [m.name, m.full_name, m.email, m.mobile]
          .find((x) => typeof x === 'string' && String(x).trim()) ?? String(id);
      return { value: String(id), label: String(label).trim() };
    })
    .filter((x): x is { value: string; label: string } => x != null);
}

function getOwnerName(ownerId: unknown): string {
  if (!ownerId) return '—';
  const member = memberOptions.value.find((m) => m.value === String(ownerId));
  return member?.label ?? String(ownerId);
}

async function loadMembers() {
  try {
    const res = await ermRepo.memberList({ page: 1, limit: 500 });
    const list = res?.data?.list ?? [];
    memberOptions.value = mapMembers(Array.isArray(list) ? list : []);
  } catch {
    memberOptions.value = [];
  }
}

const slug = computed(() => route.params.slug as string);

const transitions = computed(() => {
  if (!risk.value) return [];
  return getTransitions(risk.value.state);
});

const statusBadgeClass = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold leading-snug';
  const state = risk.value?.state;
  switch (state) {
    case 'draft': return `${base} bg-slate-100 text-slate-700 ring-1 ring-slate-200/60`;
    case 'registered': return `${base} bg-blue-100 text-blue-700 ring-1 ring-blue-200/60`;
    case 'analysis': return `${base} bg-violet-100 text-violet-700 ring-1 ring-violet-200/60`;
    case 'response': return `${base} bg-amber-100 text-amber-700 ring-1 ring-amber-200/60`;
    case 'monitoring': return `${base} bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200/60`;
    case 'closed': return `${base} bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60`;
    case 'archived': return `${base} bg-stone-100 text-stone-600 ring-1 ring-stone-200/60`;
    default: return `${base} bg-slate-100 text-slate-600 ring-1 ring-slate-200/60`;
  }
});

const riskLevelBadgeClass = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold leading-snug';
  const level = risk.value?.level;
  switch (level) {
    case 'low': return `${base} bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60`;
    case 'medium': return `${base} bg-amber-100 text-amber-700 ring-1 ring-amber-200/60`;
    case 'high': return `${base} bg-orange-100 text-orange-700 ring-1 ring-orange-200/60`;
    case 'critical': return `${base} bg-red-100 text-red-700 ring-1 ring-red-200/60`;
    default: return `${base} bg-slate-100 text-slate-600 ring-1 ring-slate-200/60`;
  }
});

const riskTypeBadgeClass = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold leading-snug';
  const rt = risk.value?.riskType;
  if (rt === 'threat') return `${base} bg-red-50 text-red-700 ring-1 ring-red-200/60`;
  if (rt === 'opportunity') return `${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60`;
  return `${base} bg-slate-100 text-slate-600 ring-1 ring-slate-200/60`;
});

const scoreDisplay = computed(() => {
  if (!risk.value) return '—';
  const s = risk.value.score;
  return s != null ? String(s) : '—';
});

const impactLikelihoodDisplay = computed(() => {
  if (!risk.value) return '—';
  const imp = risk.value.inherentImpact ?? risk.value.impact;
  const lik = risk.value.inherentLikelihood ?? risk.value.likelihood;
  if (imp == null || lik == null) return '—';
  return `${imp} × ${lik}`;
});

const residualScoreDisplay = computed(() => {
  if (!risk.value) return '—';
  const imp = risk.value.residualImpact;
  const lik = risk.value.residualLikelihood;
  if (imp != null && lik != null) return String(imp * lik);
  return '—';
});

const residualLevelBadgeClass = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-snug';
  const imp = risk.value?.residualImpact;
  const lik = risk.value?.residualLikelihood;
  if (imp == null || lik == null) return `${base} bg-slate-100 text-slate-600 ring-1 ring-slate-200/60`;
  const score = imp * lik;
  if (score <= 4) return `${base} bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60`;
  if (score <= 9) return `${base} bg-amber-100 text-amber-700 ring-1 ring-amber-200/60`;
  if (score <= 16) return `${base} bg-orange-100 text-orange-700 ring-1 ring-orange-200/60`;
  return `${base} bg-red-100 text-red-700 ring-1 ring-red-200/60`;
});

const residualLevelText = computed(() => {
  const imp = risk.value?.residualImpact;
  const lik = risk.value?.residualLikelihood;
  if (imp == null || lik == null) return '—';
  const score = imp * lik;
  if (score <= 4) return t('risk.level-low');
  if (score <= 9) return t('risk.level-medium');
  if (score <= 16) return t('risk.level-high');
  return t('risk.level-critical');
});

const stateHistory = computed(() => {
  if (!risk.value?.stateHistory) return [];
  const raw = risk.value.stateHistory;
  if (Array.isArray(raw)) return raw as StateHistoryEntry[];
  return [];
});

const taskStateBadgeClass = (state: string): string => {
  const base = 'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-semibold leading-snug';
  switch (state) {
    case 'open': return `${base} bg-orange-100 text-orange-700 ring-1 ring-orange-200/60`;
    case 'in_progress': return `${base} bg-violet-100 text-violet-700 ring-1 ring-violet-200/60`;
    case 'done': return `${base} bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60`;
    default: return `${base} bg-slate-100 text-slate-600 ring-1 ring-slate-200/60`;
  }
};

const tabItems = computed(() => [
  { key: 'overview', label: t('risk.tab-overview'), icon: 'LayoutDashboard' },
  { key: 'details', label: t('risk.tab-details'), icon: 'FileText' },
  { key: 'controls', label: t('risk.tab-controls'), icon: 'Shield' },
  { key: 'tasks', label: t('risk.tab-tasks'), icon: 'CheckSquare' },
  { key: 'history', label: t('risk.tab-history'), icon: 'Clock' },
] as const);

async function loadRisk() {
  if (!slug.value) return;
  const data = await fetchRisk(slug.value);
  if (data) {
    risk.value = data;
  } else {
    toast(t('risk.load-error'), { type: 'error' });
    router.push({ name: 'app-risk-list' });
  }
}

function goBack() {
  router.push({ name: 'app-risk-list' });
}

function openEditModal() {
  showEditModal.value = true;
}

function onEditSuccess() {
  loadRisk();
}

function handleTransition(to: string) {
  if (!risk.value) return;
  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('risk.transition-confirm-title'),
      message: t('risk.transition-confirm-message', { status: t(`risk.status-${to}`) }),
      confirmVariant: to === 'archived' ? 'danger' as const : 'primary' as const,
      onConfirmAction: async () => {
        const res = await transitionRisk(risk.value!.slug, to);
        if (!res) throw new Error(t('risk.transition-error'));
      },
    },
    onSuccess: async () => {
      toast(t('risk.transition-success'), { type: 'success' });
      await loadRisk();
    },
  });
}

onMounted(() => {
  loadMembers();
  loadRisk();
});

watch(slug, () => {
  loadRisk();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50/80 to-primary-muted/10 p-6 dark:from-darkmode-900 dark:via-darkmode-800 dark:to-primary-muted/5">
    <div class="mx-auto max-w-5xl">
      <!-- Loading State -->
      <div v-if="apiLoading && !risk" class="flex flex-col items-center justify-center py-24">
        <div class="relative">
          <div class="h-12 w-12 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="h-5 w-5 rounded-full bg-primary/20" />
          </div>
        </div>
        <span class="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Loading risk details...</span>
      </div>

      <template v-else-if="risk">
        <!-- Header Card -->
        <div class="mb-6 overflow-hidden rounded-2xl border border-white/60 bg-white shadow-lg shadow-primary/5 dark:border-darkmode-700/40 dark:bg-darkmode-800 dark:shadow-black/10">
          <div class="border-b border-slate-100 bg-gradient-to-r from-primary/5 via-transparent to-primary-muted/10 px-6 py-4 dark:border-darkmode-700/50 dark:from-primary/10 dark:to-primary-muted/5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20">
                  <Lucide icon="AlertTriangle" class="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 class="text-xl font-semibold text-slate-800 dark:text-slate-100">
                    {{ risk.title }}
                  </h1>
                  <div class="mt-1 flex flex-wrap items-center gap-2">
                    <span :class="statusBadgeClass">{{ t(`risk.status-${risk.state}`) }}</span>
                    <span :class="riskLevelBadgeClass" v-if="risk.level">{{ risk.level ? t(`risk.level-${risk.level}`) : '—' }}</span>
                    <span :class="riskTypeBadgeClass">{{ t(`risk.type-${risk.riskType}`) }}</span>
                    <span class="text-xs text-slate-400 dark:text-slate-500">{{ risk.createdAt }}</span>
                  </div>
                </div>
              </div>
              <Button
                v-if="risk.state !== 'archived'"
                type="button"
                variant="primary"
                size="sm"
                class="!h-9 !rounded-xl !px-4 !shadow-md !shadow-primary/25 hover:!shadow-lg hover:!shadow-primary/30"
                @click="openEditModal"
              >
                <Lucide icon="Pencil" class="!h-4 !w-4" />
                {{ t('risk.action-edit') }}
              </Button>
            </div>
          </div>

          <!-- Tab Navigation -->
          <div class="px-6 py-3">
            <div class="flex gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-darkmode-700/50">
              <button
                v-for="tab in tabItems"
                :key="tab.key"
                type="button"
                class="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200"
                :class="activeTab === tab.key
                  ? 'bg-white text-primary shadow-md shadow-primary/10 dark:bg-darkmode-600 dark:text-primary'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-darkmode-600/50'"
                @click="activeTab = tab.key"
              >
                <Lucide :icon="tab.icon" class="!h-4 !w-4" />
                {{ tab.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Content Area -->
        <div class="space-y-6">
          <!-- Overview Tab -->
          <template v-if="activeTab === 'overview'">
            <!-- Stats Row -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div class="group relative overflow-hidden rounded-2xl border border-white/60 bg-white p-5 shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 dark:border-darkmode-700/40 dark:bg-darkmode-800">
                <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/5 transition-transform group-hover:scale-110 dark:bg-primary/10" />
                <div class="relative">
                  <div class="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-risk-level') }}</div>
                  <span :class="riskLevelBadgeClass" class="!text-sm !px-3 !py-1">
                    {{ risk.level ? t(`risk.level-${risk.level}`) : '—' }}
                  </span>
                </div>
              </div>
              <div class="group relative overflow-hidden rounded-2xl border border-white/60 bg-white p-5 shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 dark:border-darkmode-700/40 dark:bg-darkmode-800">
                <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/5 transition-transform group-hover:scale-110 dark:bg-primary/10" />
                <div class="relative">
                  <div class="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-inherent-score') }}</div>
                  <div class="text-3xl font-bold text-slate-800 dark:text-slate-100">{{ scoreDisplay }}</div>
                </div>
              </div>
              <div class="group relative overflow-hidden rounded-2xl border border-white/60 bg-white p-5 shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 dark:border-darkmode-700/40 dark:bg-darkmode-800">
                <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/5 transition-transform group-hover:scale-110 dark:bg-primary/10" />
                <div class="relative">
                  <div class="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-impact') }} × {{ t('risk.field-likelihood') }}</div>
                  <div class="text-3xl font-bold text-slate-800 dark:text-slate-100">{{ impactLikelihoodDisplay }}</div>
                </div>
              </div>
              <div class="group relative overflow-hidden rounded-2xl border border-white/60 bg-white p-5 shadow-md transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 dark:border-darkmode-700/40 dark:bg-darkmode-800">
                <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/5 transition-transform group-hover:scale-110 dark:bg-primary/10" />
                <div class="relative">
                  <div class="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-status') }}</div>
                  <span :class="statusBadgeClass">{{ t(`risk.status-${risk.state}`) }}</span>
                </div>
              </div>
            </div>

            <!-- Info Cards -->
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div class="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-md dark:border-darkmode-700/40 dark:bg-darkmode-800">
                <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent px-6 py-4 dark:border-darkmode-700/50 dark:from-darkmode-700/50">
                  <div class="flex items-center gap-2">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                      <Lucide icon="FileText" class="h-4 w-4 text-primary" />
                    </div>
                    <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-registration') }}</h3>
                  </div>
                </div>
                <div class="p-6">
                  <div class="space-y-4">
                    <div class="flex items-start justify-between rounded-lg bg-slate-50/80 px-4 py-3 dark:bg-darkmode-700/30">
                      <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-title') }}</span>
                      <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ risk.title }}</span>
                    </div>
                    <div class="flex items-start justify-between rounded-lg px-4 py-3">
                      <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-risk-type') }}</span>
                      <span :class="riskTypeBadgeClass">{{ t(`risk.type-${risk.riskType}`) }}</span>
                    </div>
                    <div class="flex items-start justify-between rounded-lg bg-slate-50/80 px-4 py-3 dark:bg-darkmode-700/30">
                      <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-category') }}</span>
                      <span class="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {{ risk.categoryTitle ?? '—' }}{{ risk.subCategoryTitle ? ` / ${risk.subCategoryTitle}` : '' }}
                      </span>
                    </div>
                    <div class="flex items-start justify-between rounded-lg px-4 py-3">
                      <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-owner') }}</span>
                      <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ getOwnerName(risk.ownerId) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-md dark:border-darkmode-700/40 dark:bg-darkmode-800">
                <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent px-6 py-4 dark:border-darkmode-700/50 dark:from-darkmode-700/50">
                  <div class="flex items-center gap-2">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                      <Lucide icon="BarChart3" class="h-4 w-4 text-primary" />
                    </div>
                    <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-analysis') }}</h3>
                  </div>
                </div>
                <div class="p-6">
                  <div class="space-y-4">
                    <div class="flex items-start justify-between rounded-lg bg-slate-50/80 px-4 py-3 dark:bg-darkmode-700/30">
                      <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-impact-factor') }}</span>
                      <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ risk.impactFactor ?? '—' }}</span>
                    </div>
                    <div class="flex items-start justify-between rounded-lg px-4 py-3">
                      <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-likelihood') }}</span>
                      <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ risk.likelihood ?? '—' }}</span>
                    </div>
                    <div class="flex items-start justify-between rounded-lg bg-slate-50/80 px-4 py-3 dark:bg-darkmode-700/30">
                      <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-inherent-score') }}</span>
                      <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ scoreDisplay }}</span>
                    </div>
                    <div class="flex items-start justify-between rounded-lg px-4 py-3">
                      <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-risk-level') }}</span>
                      <span v-if="risk.level" :class="riskLevelBadgeClass">{{ t(`risk.level-${risk.level}`) }}</span>
                      <span v-else class="text-sm text-slate-400">—</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Monitoring Card -->
            <div v-if="risk.residualImpact != null || risk.residualLikelihood != null" class="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-md dark:border-darkmode-700/40 dark:bg-darkmode-800">
              <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent px-6 py-4 dark:border-darkmode-700/50 dark:from-darkmode-700/50">
                <div class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                    <Lucide icon="Activity" class="h-4 w-4 text-primary" />
                  </div>
                  <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-monitoring') }}</h3>
                </div>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div class="rounded-xl bg-slate-50/80 p-4 dark:bg-darkmode-700/30">
                    <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-residual-impact') }}</div>
                    <div class="text-lg font-semibold text-slate-700 dark:text-slate-200">{{ risk.residualImpact ?? '—' }}</div>
                  </div>
                  <div class="rounded-xl bg-slate-50/80 p-4 dark:bg-darkmode-700/30">
                    <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-residual-likelihood') }}</div>
                    <div class="text-lg font-semibold text-slate-700 dark:text-slate-200">{{ risk.residualLikelihood ?? '—' }}</div>
                  </div>
                  <div class="rounded-xl bg-slate-50/80 p-4 dark:bg-darkmode-700/30">
                    <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-residual-score') }}</div>
                    <div class="text-lg font-semibold text-slate-700 dark:text-slate-200">{{ residualScoreDisplay }}</div>
                  </div>
                  <div class="rounded-xl bg-slate-50/80 p-4 dark:bg-darkmode-700/30">
                    <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-residual-level') }}</div>
                    <span v-if="risk.residualImpact != null && risk.residualLikelihood != null" :class="residualLevelBadgeClass">{{ residualLevelText }}</span>
                    <span v-else class="text-sm text-slate-400">—</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Details Tab -->
          <template v-else-if="activeTab === 'details'">
            <div class="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-md dark:border-darkmode-700/40 dark:bg-darkmode-800">
              <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent px-6 py-4 dark:border-darkmode-700/50 dark:from-darkmode-700/50">
                <div class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                    <Lucide icon="FileText" class="h-4 w-4 text-primary" />
                  </div>
                  <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-registration') }}</h3>
                </div>
              </div>
              <div class="p-6">
                <div class="space-y-4">
                  <div>
                    <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-title') }}</div>
                    <div class="rounded-lg bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:bg-darkmode-700/30 dark:text-slate-200">{{ risk.title }}</div>
                  </div>
                  <div>
                    <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-draft-description') }}</div>
                    <div class="whitespace-pre-wrap rounded-lg bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:bg-darkmode-700/30 dark:text-slate-200">{{ risk.draftDescription || '—' }}</div>
                  </div>
                  <div v-if="risk.registerDescription">
                    <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-register-description') }}</div>
                    <div class="whitespace-pre-wrap rounded-lg bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:bg-darkmode-700/30 dark:text-slate-200">{{ risk.registerDescription }}</div>
                  </div>
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-risk-type') }}</div>
                      <span :class="riskTypeBadgeClass">{{ t(`risk.type-${risk.riskType}`) }}</span>
                    </div>
                    <div>
                      <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-category') }}</div>
                      <div class="text-sm text-slate-700 dark:text-slate-200">
                        {{ risk.categoryTitle ?? '—' }}{{ risk.subCategoryTitle ? ` / ${risk.subCategoryTitle}` : '' }}
                      </div>
                    </div>
                    <div>
                      <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-owner') }}</div>
                      <div class="text-sm text-slate-700 dark:text-slate-200">{{ getOwnerName(risk.ownerId) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="risk.analysisDescription || risk.note" class="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-md dark:border-darkmode-700/40 dark:bg-darkmode-800">
              <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent px-6 py-4 dark:border-darkmode-700/50 dark:from-darkmode-700/50">
                <div class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                    <Lucide icon="BarChart3" class="h-4 w-4 text-primary" />
                  </div>
                  <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-analysis') }}</h3>
                </div>
              </div>
              <div class="p-6">
                <div class="space-y-4">
                  <div v-if="risk.analysisDescription">
                    <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-analysis-description') }}</div>
                    <div class="whitespace-pre-wrap rounded-lg bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:bg-darkmode-700/30 dark:text-slate-200">{{ risk.analysisDescription }}</div>
                  </div>
                  <div v-if="risk.note">
                    <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-note') }}</div>
                    <div class="whitespace-pre-wrap rounded-lg bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:bg-darkmode-700/30 dark:text-slate-200">{{ risk.note }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="risk.responseDescription || risk.strategy" class="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-md dark:border-darkmode-700/40 dark:bg-darkmode-800">
              <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent px-6 py-4 dark:border-darkmode-700/50 dark:from-darkmode-700/50">
                <div class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                    <Lucide icon="Shield" class="h-4 w-4 text-primary" />
                  </div>
                  <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-response') }}</h3>
                </div>
              </div>
              <div class="p-6">
                <div class="space-y-4">
                  <div v-if="risk.strategy">
                    <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-treatment-strategy') }}</div>
                    <div class="rounded-lg bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:bg-darkmode-700/30 dark:text-slate-200">{{ t(`risk.strategy-${risk.strategy}`) }}</div>
                  </div>
                  <div v-if="risk.framework?.length">
                    <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-framework') }}</div>
                    <div class="text-sm text-slate-700 dark:text-slate-200">{{ risk.framework.join(', ') }}</div>
                  </div>
                  <div v-if="risk.control?.length">
                    <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-control') }}</div>
                    <div class="text-sm text-slate-700 dark:text-slate-200">{{ risk.control.join(', ') }}</div>
                  </div>
                  <div v-if="risk.responseDescription">
                    <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-response-description') }}</div>
                    <div class="whitespace-pre-wrap rounded-lg bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:bg-darkmode-700/30 dark:text-slate-200">{{ risk.responseDescription }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="risk.monitoringDescription" class="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-md dark:border-darkmode-700/40 dark:bg-darkmode-800">
              <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent px-6 py-4 dark:border-darkmode-700/50 dark:from-darkmode-700/50">
                <div class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                    <Lucide icon="Activity" class="h-4 w-4 text-primary" />
                  </div>
                  <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-monitoring') }}</h3>
                </div>
              </div>
              <div class="p-6">
                <div>
                  <div class="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-monitoring-description') }}</div>
                  <div class="whitespace-pre-wrap rounded-lg bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:bg-darkmode-700/30 dark:text-slate-200">{{ risk.monitoringDescription }}</div>
                </div>
              </div>
            </div>
          </template>

          <!-- Controls Tab -->
          <div v-else-if="activeTab === 'controls'" class="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-md dark:border-darkmode-700/40 dark:bg-darkmode-800">
            <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent px-6 py-4 dark:border-darkmode-700/50 dark:from-darkmode-700/50">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                  <Lucide icon="Shield" class="h-4 w-4 text-primary" />
                </div>
                <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.tab-controls') }}</h3>
              </div>
            </div>
            <div v-if="risk.control?.length" class="divide-y divide-slate-100 dark:divide-darkmode-700/50">
              <div
                v-for="(ctrl, idx) in risk.control"
                :key="idx"
                class="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-darkmode-700/30"
              >
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                  <Lucide icon="Shield" class="h-4 w-4 text-primary" />
                </div>
                <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ ctrl }}</span>
              </div>
            </div>
            <div v-else class="flex flex-col items-center justify-center py-16">
              <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-darkmode-700">
                <Lucide icon="ShieldOff" class="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ t('general.no-data') }}</p>
            </div>
          </div>

          <!-- Tasks Tab -->
          <div v-else-if="activeTab === 'tasks'" class="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-md dark:border-darkmode-700/40 dark:bg-darkmode-800">
            <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent px-6 py-4 dark:border-darkmode-700/50 dark:from-darkmode-700/50">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                  <Lucide icon="CheckSquare" class="h-4 w-4 text-primary" />
                </div>
                <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.tab-tasks') }}</h3>
              </div>
            </div>
            <div v-if="risk.tasks?.length" class="divide-y divide-slate-100 dark:divide-darkmode-700/50">
              <div
                v-for="(task, idx) in risk.tasks"
                :key="idx"
                class="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-darkmode-700/30"
              >
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                  <Lucide icon="CheckSquare" class="h-4 w-4 text-primary" />
                </div>
                <span class="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{{ task }}</span>
              </div>
            </div>
            <div v-else class="flex flex-col items-center justify-center py-16">
              <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-darkmode-700">
                <Lucide icon="ListTodo" class="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ t('general.no-data') }}</p>
            </div>
          </div>

          <!-- History Tab -->
          <div v-else-if="activeTab === 'history'" class="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-md dark:border-darkmode-700/40 dark:bg-darkmode-800">
            <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent px-6 py-4 dark:border-darkmode-700/50 dark:from-darkmode-700/50">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                  <Lucide icon="Clock" class="h-4 w-4 text-primary" />
                </div>
                <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.tab-history') }}</h3>
              </div>
            </div>
            <div v-if="stateHistory.length" class="p-6">
              <div class="relative">
                <div class="absolute start-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-primary/20 to-transparent dark:from-primary/40 dark:via-primary/30"></div>
                <div
                  v-for="(entry, idx) in stateHistory"
                  :key="idx"
                  class="relative flex items-start gap-5 pb-8 last:pb-0"
                >
                  <div class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white shadow-sm dark:bg-darkmode-800">
                    <div class="h-2.5 w-2.5 rounded-full bg-primary"></div>
                  </div>
                  <div class="flex-1 pt-1">
                    <div class="rounded-xl bg-slate-50/80 px-4 py-3 dark:bg-darkmode-700/30">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {{ entry.fromState ? t(`risk.status-${entry.fromState}`) : '—' }}
                          <Lucide icon="ArrowRight" class="mx-1.5 inline !h-3.5 !w-3.5 text-primary rtl:rotate-180" />
                          {{ entry.toState ? t(`risk.status-${entry.toState}`) : '—' }}
                        </span>
                        <span v-if="entry.date" class="text-xs text-slate-400 dark:text-slate-500">{{ String(entry.date) }}</span>
                      </div>
                      <div v-if="entry.description" class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ String(entry.description) }}</div>
                      <div v-if="entry.updatedBy" class="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{{ String(entry.updatedBy) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="flex flex-col items-center justify-center py-16">
              <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-darkmode-700">
                <Lucide icon="Clock" class="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ t('risk.history-empty') }}</p>
            </div>
          </div>
        </div>
      </template>
    </div>

    <RiskDraftModal
      v-if="risk && risk.state === 'draft'"
      :show="showEditModal"
      :risk-id="risk.slug"
      @update:show="showEditModal = $event"
      @success="onEditSuccess"
    />

    <RiskRegisteredModal
      v-if="risk && risk.state === 'registered'"
      :show="showEditModal"
      :risk-id="risk.slug"
      @update:show="showEditModal = $event"
      @success="onEditSuccess"
    />

    <RiskAnalysisModal
      v-if="risk && risk.state === 'analysis'"
      :show="showEditModal"
      :risk-id="risk.slug"
      @update:show="showEditModal = $event"
      @success="onEditSuccess"
    />

    <RiskResponseModal
      v-if="risk && risk.state === 'response'"
      :show="showEditModal"
      :risk-id="risk.slug"
      @update:show="showEditModal = $event"
      @success="onEditSuccess"
    />

    <RiskMonitoringModal
      v-if="risk && risk.state === 'monitoring'"
      :show="showEditModal"
      :risk-id="risk.slug"
      @update:show="showEditModal = $event"
      @success="onEditSuccess"
    />
  </div>
</template>
