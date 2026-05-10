<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import Button from '@/base-components/Button';
import Table from '@/base-components/Table';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import {
  resolveOperationsProgressId,
  resolveOperationsTaskRowId,
} from '@/composables/taskClauseNavigation';
import { extractDoingTaskNavLabelsFromRow } from '@/composables/commitmentSummary';
import { useComplianceDoingTaskNavigationStore } from '@/stores/complianceDoingTaskNavigation';
import {
  getComplianceStatusKey,
  isProgressParentReferral,
} from './complianceStatusHelpers';
import ComplianceStatusPendingAssignmentForm from './status/ComplianceStatusPendingAssignmentForm.vue';
import { COMPLIANCE_PENDING_ASSIGNMENT_FORM_ID } from './status/compliancePendingAssignmentFormId';
import ComplianceStatusDoingSingleForm from './status/ComplianceStatusDoingSingleForm.vue';
import ComplianceStatusDoingParentView from './status/ComplianceStatusDoingParentView.vue';
import ComplianceStatusDoneReviewView from './status/ComplianceStatusDoneReviewView.vue';
import ComplianceStatusFormPlaceholder from './status/ComplianceStatusFormPlaceholder.vue';
import { buildCommitmentSummary } from '@/composables/commitmentSummary';
import { apiClient } from '@/core/api/apiClient';
import { useDownload } from '@/core/composables/useDownload';
import { ermRepo } from '@/core/repositories/ermRepo';

const props = defineProps<{
  show: boolean;
  row?: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const router = useRouter();
const doingTaskNav = useComplianceDoingTaskNavigationStore();
const { download: downloadFile, loading: downloadLoading } = useDownload();

type StatusModalTab = 'commitment' | 'task-attachments' | 'rule-attachments' | 'report';
const activeTab = ref<StatusModalTab>('commitment');

// Task attachments state
const taskAttachments = ref<unknown[]>([]);
const taskAttachmentsLoading = ref(false);
const taskAttachmentsError = ref<string | null>(null);

// Rule attachments state
const ruleAttachments = ref<unknown[]>([]);
const ruleAttachmentsLoading = ref(false);
const ruleAttachmentsError = ref<string | null>(null);
const ruleInfo = ref<Record<string, unknown> | null>(null);

watch(
  () => props.show,
  (v) => {
    if (v) {
      activeTab.value = 'commitment';
      void fetchTaskAttachments();
      void fetchRuleInfo();
      void fetchRuleAttachments();
    }
  }
);

const taskId = computed(() => props.row?.id);
const ruleId = computed(() => props.row?.rule_id);

const fetchTaskAttachments = async () => {
  if (!taskId.value) {
    taskAttachmentsError.value = 'Missing task ID';
    taskAttachments.value = [];
    return;
  }

  taskAttachmentsLoading.value = true;
  taskAttachmentsError.value = null;
  taskAttachments.value = [];

  try {
    const response = await apiClient.post<{ result?: boolean; data?: { list?: unknown[] } }>(
      'media/private/list',
      {
        relation_module: 'erm',
        relation_section: 'compliance-task',
        relation_item: taskId.value,
      }
    );

    const data = response?.data;
    taskAttachments.value = Array.isArray(data?.list) ? data.list : [];
  } catch (err) {
    taskAttachmentsError.value = String(err instanceof Error ? err.message : err ?? 'Unknown error');
  } finally {
    taskAttachmentsLoading.value = false;
  }
};

const fetchRuleAttachments = async () => {
  if (!ruleId.value) {
    ruleAttachmentsError.value = 'Missing rule ID';
    ruleAttachments.value = [];
    return;
  }

  ruleAttachmentsLoading.value = true;
  ruleAttachmentsError.value = null;
  ruleAttachments.value = [];

  try {
    const response = await apiClient.post<{ result?: boolean; data?: { list?: unknown[] } }>(
      'media/private/list',
      {
        relation_module: 'erm',
        relation_section: 'compliance-rule',
        relation_item: ruleId.value,
      }
    );

    const data = response?.data;
    ruleAttachments.value = Array.isArray(data?.list) ? data.list : [];
  } catch (err) {
    ruleAttachmentsError.value = String(err instanceof Error ? err.message : err ?? 'Unknown error');
  } finally {
    ruleAttachmentsLoading.value = false;
  }
};

const fetchRuleInfo = async () => {
  if (!ruleId.value) {
    ruleInfo.value = null;
    return;
  }

  try {
    const response = await ermRepo.list({ id: ruleId.value, limit: 1 });
    const list = response?.data?.list ?? [];
    if (Array.isArray(list) && list.length > 0) {
      ruleInfo.value = list[0] as Record<string, unknown>;
    }
  } catch (err) {
    console.error('Failed to fetch rule info:', err);
  }
};

const downloadAttachment = async (attachment: Record<string, unknown>) => {
  const id = attachment.id;
  if (id == null) {
    toast('Missing attachment id', { type: 'error' });
    return;
  }

  const filename = String(attachment.original_name ?? attachment.title ?? 'download');
  await downloadFile('media/private/stream', { id }, filename);
};

/** فقط فیلدهای لازم برای نمایش خلاصهٔ تعهد */
const commitmentSummary = computed(() => buildCommitmentSummary(props.row));

const statusKey = computed(() => {
  const r = props.row;
  if (!r || typeof r !== 'object') return 'unknown';
  return getComplianceStatusKey(r as Record<string, unknown>);
});

const isDoingParentReferral = computed(() => {
  const r = props.row;
  if (!r || typeof r !== 'object') return false;
  return isProgressParentReferral(r as Record<string, unknown>);
});

const pendingFormRef = ref<InstanceType<
  typeof ComplianceStatusPendingAssignmentForm
> | null>(null);

const doingSingleFormRef = ref<InstanceType<
  typeof ComplianceStatusDoingSingleForm
> | null>(null);

const pendingFooterBusy = computed(() => {
  const p = pendingFormRef.value as
    | { submitting?: boolean; membersLoading?: boolean }
    | null
    | undefined;
  return Boolean(p?.submitting || p?.membersLoading);
});

const doingSingleFooterBusy = computed(() =>
  Boolean(
    (doingSingleFormRef.value as { submitting?: boolean } | null)?.submitting
  )
);

const doneReviewRef = ref<InstanceType<
  typeof ComplianceStatusDoneReviewView
> | null>(null);

const doneFooterBusy = computed(() =>
  Boolean(
    (doneReviewRef.value as { submitting?: boolean } | null)?.submitting
  )
);

function onStatusFormSuccess() {
  emit('success');
  close();
}

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
  if (!v) emit('close');
}

/** فقط ارجاع گروهی (والد): رفتن به صفحهٔ تکالیف در حال اجرا */
function goToDoingTasksPage() {
  const row = props.row;
  if (!row || typeof row !== 'object') return;
  const r = row as Record<string, unknown>;
  const taskId = resolveOperationsTaskRowId(r);
  if (taskId == null) return;
  const labels = extractDoingTaskNavLabelsFromRow(r);
  doingTaskNav.setDoingContext(taskId, resolveOperationsProgressId(r), {
    sectionLabel: labels.sectionLabel,
    domainLabel: labels.domainLabel,
    assignerLabel: labels.assignerLabel,
  });
  close();
  void router.push({ name: 'app-compliance-doing-task' });
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="t('compliance-page.status-flow-modal-title')"
    @update:visible="onDialogVisible"
  >
    <div class="w-full -mt-2 pt-0" data-autofocus-modal>
      <div
        class="flex w-full border-b border-slate-200 dark:border-darkmode-600"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'commitment'"
          class="flex-1 border-b-2 py-1.5 text-center text-sm font-medium transition -mb-px"
          :class="
            activeTab === 'commitment'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          "
          @click="activeTab = 'commitment'"
        >
          {{ t('compliance-page.status-modal-tab-commitment') }}
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'task-attachments'"
          class="flex-1 border-b-2 py-1.5 text-center text-sm font-medium transition -mb-px"
          :class="
            activeTab === 'task-attachments'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          "
          @click="activeTab = 'task-attachments'"
        >
          پیوست تعهد
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'rule-attachments'"
          class="flex-1 border-b-2 py-1.5 text-center text-sm font-medium transition -mb-px"
          :class="
            activeTab === 'rule-attachments'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          "
          @click="activeTab = 'rule-attachments'"
        >
          پیوست قانون
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'report'"
          class="flex-1 border-b-2 py-1.5 text-center text-sm font-medium transition -mb-px"
          :class="
            activeTab === 'report'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          "
          @click="activeTab = 'report'"
        >
          {{ t('compliance-page.status-modal-tab-report') }}
        </button>
      </div>

      <div class="pb-2 pt-0" role="tabpanel">
        <div v-show="activeTab === 'commitment'">
          <p
            v-if="
              !commitmentSummary &&
              !(row && statusKey === 'pending-assignment') &&
              !(row && statusKey === 'doing') &&
              !(row && statusKey === 'done') &&
              !(row && statusKey === 'reject') &&
              !(row && statusKey === 'approve')
            "
            class="py-6 text-center text-xs text-slate-500 dark:text-slate-400"
          >
            {{ t('compliance-page.status-modal-no-task-data') }}
          </p>

          <article
            v-else-if="commitmentSummary"
            class="w-full min-w-0 text-slate-900 dark:text-slate-100"
          >
            <!-- یک سطر تمام‌عرض: عنوان تعهد -->
            <header
              class="mb-2.5 w-full border-b border-slate-200/80 pb-2 dark:border-darkmode-600"
            >
              <p
                class="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500"
              >
                {{ t('task.title') }}
              </p>
              <p
                class="w-full min-w-0 text-[15px] font-semibold leading-snug text-slate-900 dark:text-slate-50"
              >
                {{ commitmentSummary.titleStr || '—' }}
              </p>
            </header>

            <!-- ترتیب: بخش → نوع → متن قانون → شماره بخش نامه؛ از md دو ستون؛ موبایل یک ستون -->
            <div
              class="grid grid-cols-1 gap-x-3 gap-y-3 md:grid-cols-2 md:gap-y-3.5"
            >
              <!-- ۱ بخش -->
              <div class="min-w-0 md:col-span-1">
                <p
                  class="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
                >
                  {{ t('task.section') }}
                </p>
                <p
                  class="break-words text-xs font-medium leading-snug text-slate-800 dark:text-slate-100"
                >
                  {{ commitmentSummary.sectionLabel || '—' }}
                </p>
              </div>

              <!-- ۲ نوع -->
              <div class="min-w-0 md:col-span-1">
                <p
                  class="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
                >
                  {{ t('task.form-type') }}
                </p>
                <p
                  class="break-words text-xs font-medium leading-snug text-slate-800 dark:text-slate-100"
                >
                  {{ commitmentSummary.warrantyTitle || '—' }}
                </p>
              </div>

              <!-- ۳ متن قانون -->
              <div class="min-w-0 md:col-span-1">
                <p
                  class="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
                >
                  {{ t('compliance-page.status-modal-label-rule-text') }}
                </p>
                <p
                  class="break-words text-xs leading-relaxed text-slate-700 dark:text-slate-200"
                >
                  {{ commitmentSummary.ruleText || '—' }}
                </p>
              </div>

              <!-- ۴ شماره بخش نامه -->
              <div class="min-w-0 md:col-span-1">
                <p
                  class="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
                >
                  {{ t('task.rule-code') }}
                </p>
                <p
                  class="break-words text-xs font-medium leading-snug text-slate-800 dark:text-slate-100"
                >
                  {{ commitmentSummary.ruleCode || '—' }}
                </p>
              </div>

              <!-- واحد مکلف: آیتم‌ها با فاصلهٔ بیشتر -->
              <div class="col-span-1 min-w-0 md:col-span-2">
                <p
                  class="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
                >
                  {{ t('task.mandatory-unit') }}
                </p>
                <div
                  v-if="commitmentSummary.unitsList.length > 0"
                  class="flex flex-wrap gap-2"
                >
                  <span
                    v-for="(unit, idx) in commitmentSummary.unitsList"
                    :key="idx"
                    class="me-2 inline-flex max-w-full break-words rounded-md border border-slate-200/90 bg-slate-50/90 px-2 py-1 text-xs leading-snug text-slate-700 dark:border-darkmode-600 dark:bg-darkmode-800/60 dark:text-slate-200"
                  >
                    {{ unit }}
                  </span>
                </div>
                <p
                  v-else
                  class="text-xs text-slate-500 dark:text-slate-400"
                >
                  —
                </p>
              </div>

              <div
                v-if="commitmentSummary.hasParentRef"
                class="col-span-1 rounded-md border border-slate-200/80 bg-slate-50/70 px-2 py-1.5 dark:border-darkmode-600 dark:bg-darkmode-900/35 md:col-span-2"
              >
                <p
                  class="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
                >
                  {{ t('compliance-page.status-modal-label-parent-ref') }}
                </p>
                <p
                  class="text-xs font-medium tabular-nums text-slate-800 dark:text-slate-100"
                >
                  {{ commitmentSummary.parentRefDisplay }}
                </p>
              </div>
            </div>
          </article>

          <ComplianceStatusPendingAssignmentForm
            v-if="row && statusKey === 'pending-assignment'"
            ref="pendingFormRef"
            :row="row"
            @success="onStatusFormSuccess"
          />
          <ComplianceStatusDoingSingleForm
            v-else-if="
              row &&
              statusKey === 'doing' &&
              !isDoingParentReferral
            "
            ref="doingSingleFormRef"
            :row="row"
            @success="onStatusFormSuccess"
          />
          <ComplianceStatusDoingParentView
            v-else-if="
              row &&
              statusKey === 'doing' &&
              isDoingParentReferral
            "
            :row="row"
          />
          <ComplianceStatusDoneReviewView
            v-else-if="
              row &&
              (statusKey === 'done' ||
                statusKey === 'reject' ||
                statusKey === 'approve')
            "
            ref="doneReviewRef"
            :row="row"
            @success="onStatusFormSuccess"
          />
          <ComplianceStatusFormPlaceholder
            v-else-if="
              row &&
              statusKey !== 'pending-assignment' &&
              statusKey !== 'doing' &&
              statusKey !== 'done' &&
              statusKey !== 'reject' &&
              statusKey !== 'approve'
            "
            :status-key="statusKey"
          />
        </div>

        <div v-show="activeTab === 'report'" />

        <!-- Task Attachments Tab -->
        <div v-show="activeTab === 'task-attachments'" class="space-y-4">
          <div v-if="taskAttachmentsLoading" class="text-sm text-slate-500">{{ t('general.loading') }}...</div>
          <div v-if="taskAttachmentsError" class="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {{ taskAttachmentsError }}
          </div>
          <div v-if="!taskAttachmentsLoading && !taskAttachmentsError">
            <div v-if="taskAttachments.length === 0" class="text-sm text-slate-500">
              {{ t('general.no-data') }}
            </div>
            <div v-else class="overflow-x-auto">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                      {{ t('general.title') }}
                    </Table.Th>
                    <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                      {{ t('general.type') }}
                    </Table.Th>
                    <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                      {{ t('general.extension') }}
                    </Table.Th>
                    <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                      {{ t('general.size') }}
                    </Table.Th>
                    <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                      {{ t('general.created-at') }}
                    </Table.Th>
                    <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                      {{ t('general.actions') }}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr v-for="item in taskAttachments" :key="item.id">
                    <Table.Td class="border-b dark:border-darkmode-400">
                      <div class="font-medium whitespace-nowrap">
                        {{ item.title || item.original_name }}
                      </div>
                    </Table.Td>
                    <Table.Td class="border-b dark:border-darkmode-400">
                      {{ item.type }}
                    </Table.Td>
                    <Table.Td class="border-b dark:border-darkmode-400">
                      {{ item.extension }}
                    </Table.Td>
                    <Table.Td class="border-b dark:border-darkmode-400">
                      {{ item.size_view }}
                    </Table.Td>
                    <Table.Td class="border-b dark:border-darkmode-400">
                      {{ item.time_create_view }}
                    </Table.Td>
                    <Table.Td class="border-b dark:border-darkmode-400">
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          class="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                          :title="t('general.download')"
                          @click="() => downloadAttachment(item as Record<string, unknown>)"
                          :disabled="downloadLoading"
                        >
                          ↓
                        </button>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </div>
          </div>
        </div>

        <!-- Rule Attachments Tab -->
        <div v-show="activeTab === 'rule-attachments'" class="space-y-4">
          <div v-if="ruleInfo" class="rounded bg-slate-50 p-3 dark:bg-slate-900">
            <div class="text-sm font-medium text-slate-700 dark:text-slate-200">
              قانون: {{ ruleInfo.rule || ruleInfo.title || '—' }}
            </div>
          </div>
          <div v-if="ruleAttachmentsLoading" class="text-sm text-slate-500">{{ t('general.loading') }}...</div>
          <div v-if="ruleAttachmentsError" class="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {{ ruleAttachmentsError }}
          </div>
          <div v-if="!ruleAttachmentsLoading && !ruleAttachmentsError">
            <div v-if="ruleAttachments.length === 0" class="text-sm text-slate-500">
              {{ t('general.no-data') }}
            </div>
            <div v-else class="overflow-x-auto">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                      {{ t('general.title') }}
                    </Table.Th>
                    <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                      {{ t('general.type') }}
                    </Table.Th>
                    <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                      {{ t('general.extension') }}
                    </Table.Th>
                    <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                      {{ t('general.size') }}
                    </Table.Th>
                    <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                      {{ t('general.created-at') }}
                    </Table.Th>
                    <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                      {{ t('general.actions') }}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr v-for="item in ruleAttachments" :key="item.id">
                    <Table.Td class="border-b dark:border-darkmode-400">
                      <div class="font-medium whitespace-nowrap">
                        {{ item.title || item.original_name }}
                      </div>
                    </Table.Td>
                    <Table.Td class="border-b dark:border-darkmode-400">
                      {{ item.type }}
                    </Table.Td>
                    <Table.Td class="border-b dark:border-darkmode-400">
                      {{ item.extension }}
                    </Table.Td>
                    <Table.Td class="border-b dark:border-darkmode-400">
                      {{ item.size_view }}
                    </Table.Td>
                    <Table.Td class="border-b dark:border-darkmode-400">
                      {{ item.time_create_view }}
                    </Table.Td>
                    <Table.Td class="border-b dark:border-darkmode-400">
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          class="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                          :title="t('general.download')"
                          @click="() => downloadAttachment(item as Record<string, unknown>)"
                          :disabled="downloadLoading"
                        >
                          ↓
                        </button>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <template
          v-if="
            activeTab === 'task-attachments' ||
            activeTab === 'rule-attachments' ||
            activeTab === 'report'
          "
        >
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            @click="close"
          >
            {{ t('general.close') }}
          </Button>
        </template>
        <template
          v-else-if="
            statusKey === 'pending-assignment' &&
            activeTab === 'commitment'
          "
        >
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            :disabled="pendingFooterBusy"
            @click="close"
          >
            {{ t('rule.form-cancel') }}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            :form="COMPLIANCE_PENDING_ASSIGNMENT_FORM_ID"
            :disabled="pendingFooterBusy"
          >
            {{ t('compliance-page.referral-confirm') }}
          </Button>
        </template>
        <template
          v-else-if="
            statusKey === 'doing' &&
            !isDoingParentReferral &&
            activeTab === 'commitment'
          "
        >
          <div class="flex w-full flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              :disabled="doingSingleFooterBusy"
              @click="close"
            >
              {{ t('compliance-page.doing-footer-cancel') }}
            </Button>
            <Button
              type="button"
              variant="outline-primary"
              size="sm"
              :disabled="doingSingleFooterBusy"
              @click="doingSingleFormRef?.submitRegister()"
            >
              {{ t('compliance-page.doing-footer-register') }}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              :disabled="doingSingleFooterBusy"
              @click="doingSingleFormRef?.submitSend()"
            >
              {{ t('compliance-page.doing-footer-send') }}
            </Button>
          </div>
        </template>
        <template
          v-else-if="
            statusKey === 'doing' &&
            isDoingParentReferral &&
            activeTab === 'commitment'
          "
        >
          <div class="flex w-full flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              @click="close"
            >
              {{ t('compliance-page.doing-footer-cancel') }}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              @click="goToDoingTasksPage"
            >
              {{ t('compliance-page.doing-parent-commitment-in-progress') }}
            </Button>
          </div>
        </template>
        <template
          v-else-if="
            statusKey === 'approve' && activeTab === 'commitment'
          "
        >
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            @click="close"
          >
            {{ t('compliance-page.approve-footer-close') }}
          </Button>
        </template>
        <template
          v-else-if="
            statusKey === 'reject' && activeTab === 'commitment'
          "
        >
          <div class="flex w-full flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              :disabled="doneFooterBusy"
              @click="close"
            >
              {{ t('compliance-page.doing-footer-cancel') }}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              :disabled="doneFooterBusy"
              @click="doneReviewRef?.submitRestartToDoing()"
            >
              {{ t('compliance-page.reject-footer-start') }}
            </Button>
          </div>
        </template>
        <template
          v-else-if="statusKey === 'done' && activeTab === 'commitment'"
        >
          <div class="flex w-full flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              :disabled="doneFooterBusy"
              @click="close"
            >
              {{ t('compliance-page.done-footer-cancel') }}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              :disabled="doneFooterBusy"
              @click="doneReviewRef?.submitReview('reject')"
            >
              {{ t('compliance-page.done-footer-reject') }}
            </Button>
            <Button
              type="button"
              variant="success"
              size="sm"
              :disabled="doneFooterBusy"
              @click="doneReviewRef?.submitReview('approve')"
            >
              {{ t('compliance-page.done-footer-approve') }}
            </Button>
          </div>
        </template>
        <template v-else>
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            @click="close"
          >
            {{ t('rule.form-cancel') }}
          </Button>
        </template>
      </div>
    </template>
  </BaseModal>
</template>
