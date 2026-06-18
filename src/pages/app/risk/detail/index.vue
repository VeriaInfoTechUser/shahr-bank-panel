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
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-semibold leading-snug shadow-sm';
  const state = risk.value?.state;
  switch (state) {
    case 'draft': return `${base} bg-slate-100 text-slate-700 border border-slate-200`;
    case 'registered': return `${base} bg-blue-100 text-blue-800 border border-blue-200`;
    case 'analysis': return `${base} bg-violet-100 text-violet-800 border border-violet-200`;
    case 'response': return `${base} bg-orange-100 text-orange-800 border border-orange-200`;
    case 'monitoring': return `${base} bg-sky-100 text-sky-800 border border-sky-200`;
    case 'closed': return `${base} bg-emerald-100 text-emerald-800 border border-emerald-200`;
    case 'archived': return `${base} bg-stone-100 text-stone-700 border border-stone-200`;
    default: return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
  }
});

const riskLevelBadgeClass = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-semibold leading-snug shadow-sm';
  const level = risk.value?.riskLevel;
  switch (level) {
    case 'low': return `${base} bg-green-100 text-green-800 border border-green-200`;
    case 'medium': return `${base} bg-amber-100 text-amber-800 border border-amber-200`;
    case 'high': return `${base} bg-orange-100 text-orange-800 border border-orange-200`;
    case 'critical': return `${base} bg-red-100 text-red-800 border border-red-200`;
    default: return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
  }
});

const riskTypeBadgeClass = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-semibold leading-snug shadow-sm';
  const rt = risk.value?.riskType;
  if (rt === 'threat') return `${base} bg-red-50 text-red-700 border border-red-200`;
  if (rt === 'opportunity') return `${base} bg-green-50 text-green-700 border border-green-200`;
  return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
});

const scoreDisplay = computed(() => {
  if (!risk.value) return '—';
  const s = risk.value.inherentScore;
  return s != null ? String(s) : '—';
});

const impactLikelihoodDisplay = computed(() => {
  if (!risk.value) return '—';
  const imp = risk.value.impactFactor ?? risk.value.impact;
  const lik = risk.value.likelihood;
  if (imp == null || lik == null) return '—';
  return `${imp} × ${lik}`;
});

const residualScoreDisplay = computed(() => {
  if (!risk.value) return '—';
  const s = risk.value.residualScore;
  return s != null ? String(s) : '—';
});

const residualLevelBadgeClass = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm';
  const level = risk.value?.residualLevel;
  switch (level) {
    case 'low': return `${base} bg-green-100 text-green-800 border border-green-200`;
    case 'medium': return `${base} bg-amber-100 text-amber-800 border border-amber-200`;
    case 'high': return `${base} bg-orange-100 text-orange-800 border border-orange-200`;
    case 'critical': return `${base} bg-red-100 text-red-800 border border-red-200`;
    default: return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
  }
});

const stateHistory = computed(() => {
  if (!risk.value?.stateHistory) return [];
  const raw = risk.value.stateHistory;
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  return [];
});

const taskStateBadgeClass = (state: string): string => {
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[9px] font-semibold leading-snug shadow-sm';
  switch (state) {
    case 'open': return `${base} bg-orange-100 text-orange-800 border border-orange-200`;
    case 'in_progress': return `${base} bg-violet-100 text-violet-800 border border-violet-200`;
    case 'done': return `${base} bg-emerald-100 text-emerald-800 border border-emerald-200`;
    default: return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
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
  <div class="grid grid-cols-12 gap-4 p-4">
    <div class="col-span-12">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">

          <h1 class="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {{ risk?.title ?? t('risk.detail-title') }}
          </h1>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            @click="openEditModal"
          >
            <Lucide icon="Pencil" class="mr-1.5 !h-3.5 !w-3.5" />
            {{ t('risk.action-edit') }}
          </Button>

        </div>
      </div>
    </div>

    <div v-if="apiLoading && !risk" class="col-span-12">
      <div class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span class="text-sm text-slate-500">{{ t('general.loading') }}</span>
        </div>
      </div>
    </div>

    <template v-else-if="risk">
<!--      <div class="col-span-12">-->
<!--        <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">-->
<!--          <div class="flex flex-wrap items-center gap-3">-->
<!--            <span :class="statusBadgeClass">{{ t(`risk.status-${risk.state}`) }}</span>-->
<!--            <span :class="riskLevelBadgeClass" v-if="risk.riskLevel">{{ risk.riskLevel ? t(`risk.level-${risk.riskLevel}`) : '—' }}</span>-->
<!--            <span :class="riskTypeBadgeClass">{{ t(`risk.type-${risk.riskType}`) }}</span>-->
<!--            <span class="text-xs text-slate-400">{{ risk.createdAt }}</span>-->
<!--          </div>-->
<!--        </div>-->
<!--      </div>-->

      <div class="col-span-12">
        <div class="flex gap-1 rounded-xl border border-slate-200/90 bg-white p-1 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
          <button
            v-for="tab in tabItems"
            :key="tab.key"
            type="button"
            class="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition"
            :class="activeTab === tab.key
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-darkmode-700'"
            @click="activeTab = tab.key"
          >
            <Lucide :icon="tab.icon" class="!h-3.5 !w-3.5" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="col-span-12">
        <div v-if="activeTab === 'overview'" class="space-y-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
              <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-risk-level') }}</div>
              <span :class="riskLevelBadgeClass" class="!text-sm !px-3 !py-1">
                {{ risk.riskLevel ? t(`risk.level-${risk.riskLevel}`) : '—' }}
              </span>
            </div>
            <div class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
              <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-inherent-score') }}</div>
              <div class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ scoreDisplay }}</div>
            </div>
            <div class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
              <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-impact') }} × {{ t('risk.field-likelihood') }}</div>
              <div class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ impactLikelihoodDisplay }}</div>
            </div>
            <div class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
              <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-status') }}</div>
              <span :class="statusBadgeClass">{{ t(`risk.status-${risk.state}`) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
              <h3 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-registration') }}</h3>
              <div class="space-y-2.5">
                <div class="flex items-start justify-between">
                  <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('risk.field-title') }}</span>
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-200">{{ risk.title }}</span>
                </div>
                <div class="flex items-start justify-between">
                  <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('risk.field-risk-type') }}</span>
                  <span :class="riskTypeBadgeClass">{{ t(`risk.type-${risk.riskType}`) }}</span>
                </div>
                <div class="flex items-start justify-between">
                  <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('risk.field-category') }}</span>
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-200">
                    {{ risk.categoryTitle ?? '—' }}{{ risk.subCategoryTitle ? ` / ${risk.subCategoryTitle}` : '' }}
                  </span>
                </div>
                <div class="flex items-start justify-between">
                  <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('risk.field-owner') }}</span>
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-200">{{ getOwnerName(risk.ownerId) }}</span>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
              <h3 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-analysis') }}</h3>
              <div class="space-y-2.5">
                <div class="flex items-start justify-between">
                  <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('risk.field-impact-factor') }}</span>
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-200">{{ risk.impactFactor ?? '—' }}</span>
                </div>
                <div class="flex items-start justify-between">
                  <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('risk.field-likelihood') }}</span>
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-200">{{ risk.likelihood ?? '—' }}</span>
                </div>
                <div class="flex items-start justify-between">
                  <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('risk.field-inherent-score') }}</span>
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-200">{{ scoreDisplay }}</span>
                </div>
                <div class="flex items-start justify-between">
                  <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('risk.field-risk-level') }}</span>
                  <span v-if="risk.riskLevel" :class="riskLevelBadgeClass">{{ t(`risk.level-${risk.riskLevel}`) }}</span>
                  <span v-else class="text-xs text-slate-400">—</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="risk.residualScore != null || risk.residualLevel" class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
            <h3 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-monitoring') }}</h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('risk.field-residual-impact') }}</div>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ risk.residualImpact ?? '—' }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('risk.field-residual-likelihood') }}</div>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ risk.residualLikelihood ?? '—' }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('risk.field-residual-score') }}</div>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ residualScoreDisplay }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t('risk.field-residual-level') }}</div>
                <span v-if="risk.residualLevel" :class="residualLevelBadgeClass">{{ t(`risk.level-${risk.residualLevel}`) }}</span>
                <span v-else class="text-xs text-slate-400">—</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'details'" class="space-y-4">
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
            <h3 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-registration') }}</h3>
            <div class="space-y-3">
              <div>
                <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-title') }}</div>
                <div class="text-sm text-slate-700 dark:text-slate-200">{{ risk.title }}</div>
              </div>
              <div>
                <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-draft-description') }}</div>
                <div class="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{{ risk.draftDescription || '—' }}</div>
              </div>
              <div v-if="risk.registerDescription">
                <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-register-description') }}</div>
                <div class="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{{ risk.registerDescription }}</div>
              </div>
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-risk-type') }}</div>
                  <span :class="riskTypeBadgeClass">{{ t(`risk.type-${risk.riskType}`) }}</span>
                </div>
                <div>
                  <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-category') }}</div>
                  <div class="text-sm text-slate-700 dark:text-slate-200">
                    {{ risk.categoryTitle ?? '—' }}{{ risk.subCategoryTitle ? ` / ${risk.subCategoryTitle}` : '' }}
                  </div>
                </div>
                <div>
                  <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-owner') }}</div>
                  <div class="text-sm text-slate-700 dark:text-slate-200">{{ getOwnerName(risk.ownerId) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="risk.analysisDescription || risk.note" class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
            <h3 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-analysis') }}</h3>
            <div class="space-y-3">
              <div v-if="risk.analysisDescription">
                <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-analysis-description') }}</div>
                <div class="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{{ risk.analysisDescription }}</div>
              </div>
              <div v-if="risk.note">
                <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-note') }}</div>
                <div class="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{{ risk.note }}</div>
              </div>
            </div>
          </div>

          <div v-if="risk.responseDescription || risk.strategy" class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
            <h3 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-response') }}</h3>
            <div class="space-y-3">
              <div v-if="risk.strategy">
                <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-treatment-strategy') }}</div>
                <div class="text-sm text-slate-700 dark:text-slate-200">{{ t(`risk.strategy-${risk.strategy}`) }}</div>
              </div>
              <div v-if="risk.frameworkTitle">
                <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-framework') }}</div>
                <div class="text-sm text-slate-700 dark:text-slate-200">{{ risk.frameworkTitle }}</div>
              </div>
              <div v-if="risk.domainTitle">
                <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-domain') }}</div>
                <div class="text-sm text-slate-700 dark:text-slate-200">{{ risk.domainTitle }}</div>
              </div>
              <div v-if="risk.controlTitle">
                <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-control') }}</div>
                <div class="text-sm text-slate-700 dark:text-slate-200">{{ risk.controlTitle }}</div>
              </div>
              <div v-if="risk.responseDescription">
                <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-response-description') }}</div>
                <div class="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{{ risk.responseDescription }}</div>
              </div>
            </div>
          </div>

          <div v-if="risk.monitoringDescription" class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
            <h3 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.section-monitoring') }}</h3>
            <div class="space-y-3">
              <div>
                <div class="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('risk.field-monitoring-description') }}</div>
                <div class="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{{ risk.monitoringDescription }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'controls'" class="rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
          <div class="border-b border-slate-200 px-5 py-3 dark:border-darkmode-600">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.tab-controls') }}</h3>
          </div>
          <div v-if="risk.controlTitle" class="px-5 py-3">
            <div class="flex items-center gap-3">
              <Lucide icon="Shield" class="!h-4 !w-4 text-slate-400" />
              <span class="text-sm text-slate-700 dark:text-slate-200">{{ risk.controlTitle }}</span>
            </div>
          </div>
          <div v-else class="px-5 py-8 text-center text-sm text-slate-400">
            {{ t('general.no-data') }}
          </div>
        </div>

        <div v-else-if="activeTab === 'tasks'" class="rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
          <div class="border-b border-slate-200 px-5 py-3 dark:border-darkmode-600">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.tab-tasks') }}</h3>
          </div>
          <div v-if="risk.tasks?.length" class="divide-y divide-slate-200 dark:divide-darkmode-600">
            <div
              v-for="(task, idx) in risk.tasks"
              :key="idx"
              class="flex items-center gap-3 px-5 py-3"
            >
              <Lucide icon="CheckSquare" class="!h-4 !w-4 text-slate-400" />
              <span class="flex-1 text-sm text-slate-700 dark:text-slate-200">{{ task.title }}</span>
            </div>
          </div>
          <div v-else class="px-5 py-8 text-center text-sm text-slate-400">
            {{ t('general.no-data') }}
          </div>
        </div>

        <div v-else-if="activeTab === 'history'" class="rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
          <div class="border-b border-slate-200 px-5 py-3 dark:border-darkmode-600">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('risk.tab-history') }}</h3>
          </div>
          <div v-if="stateHistory.length" class="relative px-5 py-4">
            <div class="absolute start-8 top-0 bottom-0 w-px bg-slate-200 dark:bg-darkmode-600"></div>
            <div
              v-for="(entry, idx) in stateHistory"
              :key="idx"
              class="relative flex items-start gap-4 pb-6 last:pb-0"
            >
              <div class="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-white">
                <div class="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <div class="flex-1 pt-0.5">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-200">
                    {{ entry.fromState ? t(`risk.status-${entry.fromState}`) : '—' }}
                    <Lucide icon="ArrowRight" class="mx-1 inline !h-3 !w-3 text-slate-400 rtl:rotate-180" />
                    {{ entry.toState ? t(`risk.status-${entry.toState}`) : '—' }}
                  </span>
                  <span v-if="entry.timestamp" class="text-[10px] text-slate-400">{{ String(entry.timestamp) }}</span>
                </div>
                <div v-if="entry.comment" class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ String(entry.comment) }}</div>
                <div v-if="entry.updatedBy" class="mt-0.5 text-[10px] text-slate-400">{{ String(entry.updatedBy) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="px-5 py-8 text-center text-sm text-slate-400">
            {{ t('risk.history-empty') }}
          </div>
        </div>
      </div>
    </template>

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
