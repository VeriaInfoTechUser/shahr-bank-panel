<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import Button from '@/base-components/Button';
import { useI18n } from 'vue-i18n';
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

type StatusModalTab = 'commitment' | 'report';
const activeTab = ref<StatusModalTab>('commitment');

watch(
  () => props.show,
  (v) => {
    if (v) activeTab.value = 'commitment';
  }
);

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
        class="grid w-full grid-cols-2 border-b border-slate-200 dark:border-darkmode-600"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'commitment'"
          class="w-full border-b-2 py-1.5 text-center text-sm font-medium transition -mb-px"
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
          :aria-selected="activeTab === 'report'"
          class="w-full border-b-2 py-1.5 text-center text-sm font-medium transition -mb-px"
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
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <template
          v-if="
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
