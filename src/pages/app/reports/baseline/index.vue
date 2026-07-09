<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
// import { toast } from 'vue3-toastify';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import CreateReportModal from './CreateReportModal.vue';
import BaselineBreadcrumbToolbar from './BaselineBreadcrumbToolbar.vue';
import { reportRepo, type ReportItem } from '@/core/repositories/reportRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

// ── Modals ──────────────────────────────────────────────────────────────────
const showCreateModal = ref(false);

// ── Edit title modal ────────────────────────────────────────────────────────
const showEditModal = ref(false);
const editingReport = ref<ReportItem | null>(null);
const editTitle = ref('');
const editSaving = ref(false);

function openEdit(row: Record<string, unknown>) {
  editingReport.value = row as unknown as ReportItem;
  editTitle.value = String(row.title ?? '');
  showEditModal.value = true;
}

async function saveEditTitle() {
  if (!editingReport.value || !editTitle.value.trim()) return;
  editSaving.value = true;
  try {
    await reportRepo.updateReport(editingReport.value.slug, { title: editTitle.value.trim() });
    // toast(t('reports.update-success'), { type: 'success' });
    showEditModal.value = false;
    table.invalidateListCache();
    void table.fetch();
  } catch {
    // toast(t('reports.update-error'), { type: 'error' });
  } finally {
    editSaving.value = false;
  }
}

// ── Table ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fa-IR');
  } catch {
    return iso;
  }
}

const fetchReports: FetchFn = async ({ page, limit }) => {
  const res = await reportRepo.getReportList({ page, limit });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchReports,
  columns: [
    createColumn({
      key: 'title',
      label: t('reports.col-title'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => row.title ?? '—',
    }),
    createColumn({
      key: 'period',
      label: t('reports.col-period'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => {
        const p = String(row.period ?? '');
        return p || '—';
      },
    }),
    createColumn({
      key: 'frameworkSlugs',
      label: t('reports.col-framework'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => {
        const slugs = row.frameworkSlugs;
        if (!Array.isArray(slugs) || slugs.length === 0) return '—';
        return slugs.join(', ');
      },
    }),
    createColumn({
      key: 'createdAt',
      label: t('reports.col-date'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => formatDate(String(row.createdAt ?? '')),
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'baseline-reports-list',
  listCacheStaleTime: 0,
});

function onModalSuccess() {
  table.invalidateListCache();
  table.setPage(1);
}

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(BaselineBreadcrumbToolbar, {
    onAdd: () => { showCreateModal.value = true; },
    onExport: () => table.exportCSV(),
    table,
  });
});
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12">
      <BaseTable
        :table="table"
        :selectable="false"
        :export-enabled="table.exportEnabled"
        :empty-message="t('general.no-data')"
        :actions="true"
        :show-search="false"
      >
        <template #cell-period="{ row }">
          <span class="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {{ row.period ?? '—' }}
          </span>
        </template>
        <template #cell-frameworkSlugs="{ row }">
          <div class="flex flex-wrap gap-1">
            <span
              v-for="slug in (Array.isArray(row.frameworkSlugs) ? row.frameworkSlugs : [])"
              :key="slug"
              class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-darkmode-600 dark:text-slate-300"
            >
              {{ slug }}
            </span>
            <span v-if="!Array.isArray(row.frameworkSlugs) || !row.frameworkSlugs.length">—</span>
          </div>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('reports.view-report')"
              :title="t('reports.view-report')"
              @click.stop="router.push({ name: 'app-reports-baseline-detail', params: { slug: row.slug } })"
            >
              <Lucide icon="Eye" class="!h-3.5 !w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('reports.view-dashboard')"
              :title="t('reports.view-dashboard')"
              @click.stop="router.push({ name: 'app-reports-baseline-dashboard', params: { slug: row.slug } })"
            >
              <Lucide icon="LayoutDashboard" class="!h-3.5 !w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('title.update')"
              :title="t('title.update')"
              @click.stop="openEdit(row)"
            >
              <Lucide icon="Pencil" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>

    <!-- Create Modal -->
    <CreateReportModal
      :show="showCreateModal"
      @update:show="showCreateModal = $event"
      @success="onModalSuccess"
    />

    <!-- Edit Title Modal -->
    <BaseModal
      :visible="showEditModal"
      :title="t('reports.edit-title')"
      size="sm"
      @update:visible="showEditModal = $event"
    >
      <div class="space-y-2 py-1">
        <input
          v-model="editTitle"
          type="text"
          class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none transition-colors focus:border-primary focus:bg-white dark:border-darkmode-600 dark:bg-darkmode-700 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-primary"
          :placeholder="t('reports.title-placeholder')"
        />
      </div>
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline-secondary" size="sm" :disabled="editSaving" @click="showEditModal = false">
            {{ t('button.cancel') }}
          </Button>
          <Button type="button" variant="primary" size="sm" :disabled="editSaving || !editTitle.trim()" @click="saveEditTitle">
            <Lucide v-if="editSaving" icon="Loader2" class="me-1 h-3.5 w-3.5 animate-spin" />
            {{ t('button.save') }}
          </Button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
