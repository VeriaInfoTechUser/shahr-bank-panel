<script setup lang="ts">
import { computed, ref } from 'vue';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import Button from '@/base-components/Button';
import { useI18n } from 'vue-i18n';
import { buildCommitmentSummary } from '@/composables/commitmentSummary';
import {
  getRiskStatusKey,
  riskModalRiskExecutorLabel,
  riskModalTaskComplianceAssignerLabel,
} from './riskStatusHelpers';
import RiskStatusPendingAssignmentForm from './status/RiskStatusPendingAssignmentForm.vue';
import RiskStatusTodoForm from './status/RiskStatusTodoForm.vue';
import RiskStatusDoneReviewView from './status/RiskStatusDoneReviewView.vue';
import ComplianceStatusFormPlaceholder from '@/pages/app/compliance/operations/status/ComplianceStatusFormPlaceholder.vue';
import { RISK_PENDING_ASSIGNMENT_FORM_ID } from './status/riskPendingAssignmentFormId';
import { RISK_TODO_FORM_ID } from './status/riskTodoFormId';

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

const commitmentSummary = computed(() => buildCommitmentSummary(props.row));

const riskExecutorLabel = computed(() =>
  riskModalRiskExecutorLabel(
    props.row && typeof props.row === 'object'
      ? (props.row as Record<string, unknown>)
      : null
  )
);

const taskComplianceAssignerLabel = computed(() =>
  riskModalTaskComplianceAssignerLabel(
    props.row && typeof props.row === 'object'
      ? (props.row as Record<string, unknown>)
      : null
  )
);

const statusKey = computed(() => {
  const r = props.row;
  if (!r || typeof r !== 'object') return 'unknown';
  return getRiskStatusKey(r as Record<string, unknown>);
});

const riskPendingFormRef = ref<InstanceType<
  typeof RiskStatusPendingAssignmentForm
> | null>(null);

const riskPendingFooterBusy = computed(() => {
  const p = riskPendingFormRef.value as
    | { submitting?: boolean; membersLoading?: boolean }
    | null
    | undefined;
  return Boolean(p?.submitting || p?.membersLoading);
});

const riskTodoFormRef = ref<InstanceType<typeof RiskStatusTodoForm> | null>(null);

const riskTodoFooterBusy = computed(() => {
  const p = riskTodoFormRef.value as
    | { submitting?: boolean; responseTypesLoading?: boolean }
    | null
    | undefined;
  return Boolean(p?.submitting || p?.responseTypesLoading);
});

const riskDoneReviewRef = ref<InstanceType<
  typeof RiskStatusDoneReviewView
> | null>(null);

const riskDoneFooterBusy = computed(() =>
  Boolean(
    (riskDoneReviewRef.value as { submitting?: boolean } | null)?.submitting
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
</script>

<template>
  <BaseModal
    :visible="show"
    :title="t('risk-operations.status-flow-modal-title')"
    @update:visible="onDialogVisible"
  >
    <div class="w-full -mt-2 pt-0" data-autofocus-modal>
      <div class="pb-2 pt-0">
          <p
            v-if="
              !commitmentSummary &&
              !(row && statusKey === 'pending-assignment') &&
              !(row && statusKey === 'todo') &&
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
            <header
              class="mb-1.5 w-full border-b border-slate-200/80 pb-1.5 dark:border-darkmode-600"
            >
              <p
                class="w-full min-w-0 text-[15px] font-semibold leading-snug text-slate-900 dark:text-slate-50"
              >
                {{ commitmentSummary.titleStr || '—' }}
              </p>
            </header>

            <div
              class="grid grid-cols-1 gap-x-3 gap-y-3 md:grid-cols-2 md:gap-y-3.5"
            >
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

              <div class="min-w-0 md:col-span-1">
                <p
                  class="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
                >
                  {{ t('risk-operations.modal-risk-executor-label') }}
                </p>
                <p
                  class="break-words text-xs font-medium leading-snug text-slate-800 dark:text-slate-100"
                >
                  {{ riskExecutorLabel }}
                </p>
              </div>

              <div class="min-w-0 md:col-span-1">
                <p
                  class="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
                >
                  {{ t('risk-operations.modal-task-compliance-assigner-label') }}
                </p>
                <p
                  class="break-words text-xs font-medium leading-snug text-slate-800 dark:text-slate-100"
                >
                  {{ taskComplianceAssignerLabel }}
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

          <RiskStatusPendingAssignmentForm
            v-if="row && statusKey === 'pending-assignment'"
            ref="riskPendingFormRef"
            :row="row"
            @success="onStatusFormSuccess"
          />
          <RiskStatusTodoForm
            v-else-if="row && (statusKey === 'todo' || statusKey === 'doing')"
            ref="riskTodoFormRef"
            :row="row"
            @success="onStatusFormSuccess"
          />
          <RiskStatusDoneReviewView
            v-else-if="row && statusKey === 'done'"
            ref="riskDoneReviewRef"
            :row="row"
            @success="onStatusFormSuccess"
          />
          <ComplianceStatusFormPlaceholder
            v-else-if="
              row &&
              statusKey !== 'pending-assignment' &&
              statusKey !== 'todo' &&
              statusKey !== 'doing' &&
              statusKey !== 'done'
            "
            :status-key="statusKey"
          />
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <template v-if="statusKey === 'pending-assignment'">
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            :disabled="riskPendingFooterBusy"
            @click="close"
          >
            {{ t('rule.form-cancel') }}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            :form="RISK_PENDING_ASSIGNMENT_FORM_ID"
            :disabled="riskPendingFooterBusy"
          >
            {{ t('compliance-page.referral-confirm') }}
          </Button>
        </template>
        <template
          v-else-if="statusKey === 'todo' || statusKey === 'doing'"
        >
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            :disabled="riskTodoFooterBusy"
            @click="close"
          >
            {{ t('rule.form-cancel') }}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            :form="RISK_TODO_FORM_ID"
            :disabled="riskTodoFooterBusy"
          >
            {{ t('risk-operations.todo-submit') }}
          </Button>
        </template>
        <template v-else-if="statusKey === 'done'">
          <div class="flex w-full flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              :disabled="riskDoneFooterBusy"
              @click="close"
            >
              {{ t('compliance-page.done-footer-cancel') }}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              :disabled="riskDoneFooterBusy"
              @click="riskDoneReviewRef?.submitReview('reject')"
            >
              {{ t('compliance-page.done-footer-reject') }}
            </Button>
            <Button
              type="button"
              variant="success"
              size="sm"
              :disabled="riskDoneFooterBusy"
              @click="riskDoneReviewRef?.submitReview('approve')"
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
