<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { ermRepo } from '@/core/repositories/ermRepo';
import {
  complianceOperationsStatusBadgeClass,
  complianceOperationsStatusReportCardClass,
} from '@/composables/complianceOperationsStatusBadge';
import { useComplianceDoingTaskNavigationStore } from '@/stores/complianceDoingTaskNavigation';
import { buildCommitmentSummaryForDoingTaskPage } from '@/composables/commitmentSummary';
import ComplianceDoingTaskAnswerForm from './ComplianceDoingTaskAnswerForm.vue';

const { t } = useI18n();
const nav = useComplianceDoingTaskNavigationStore();

/** کارت‌های داشبورد گزارش (بدون میانگین) — همان پالت badge */
const REPORT_DASHBOARD_KEYS = [
  'todo',
  'doing',
  'done',
  'approve',
  'reject',
] as const;

const taskId = computed(() => nav.taskId);
const progressId = computed(() => nav.progressId);

const loading = ref(false);
const loadError = ref<string | null>(null);
const taskPayload = ref<unknown>(null);
const progressPayload = ref<unknown>(null);

function unwrapErmResponse(res: unknown): unknown {
  if (res != null && typeof res === 'object') {
    const o = res as Record<string, unknown>;
    if (o.result === false) {
      const msg = (o.error as { message?: string } | undefined)?.message;
      throw new Error(
        typeof msg === 'string' && msg.trim()
          ? msg
          : t('compliance-page.doing-task-load-error')
      );
    }
    if (o.result === true && 'data' in o) return o.data;
    if ('data' in o && o.data !== undefined) return o.data;
  }
  return res;
}

/** تعهد از جزئیات پیشرفت یا از task/get */
const summaryTask = computed((): Record<string, unknown> | null => {
  const pd = progressPayload.value;
  if (pd != null && typeof pd === 'object' && 'task' in pd) {
    const tk = (pd as Record<string, unknown>).task;
    if (tk && typeof tk === 'object' && !Array.isArray(tk)) {
      return tk as Record<string, unknown>;
    }
  }
  const tp = taskPayload.value;
  if (tp != null && typeof tp === 'object' && !Array.isArray(tp)) {
    return tp as Record<string, unknown>;
  }
  return null;
});

/** همان فیلدهای خلاصهٔ تعهد در مدال وضعیت عملیات تطبیق */
const commitmentSummary = computed(() =>
  buildCommitmentSummaryForDoingTaskPage(summaryTask.value)
);

const showCommitmentCard = computed(() => {
  const c = commitmentSummary.value;
  if (!c) return false;
  if (c.titleStr.trim()) return true;
  if (c.sectionLabel.trim()) return true;
  if (c.warrantyTitle.trim()) return true;
  if (c.ruleText.trim()) return true;
  if (c.ruleCode.trim()) return true;
  if (c.unitsList.length > 0) return true;
  return c.hasParentRef;
});

/** بخش: اول از مدل تسک در API، در نبود از ردیف لیست عملیات */
const displaySectionLabel = computed(() => {
  const c = commitmentSummary.value;
  const fromTask = c?.sectionLabel?.trim() ?? '';
  if (fromTask) return fromTask;
  return nav.navSectionLabel?.trim() ?? '';
});

const reportSummary = computed((): Record<string, unknown> | null => {
  const pd = progressPayload.value;
  if (pd == null || typeof pd !== 'object') return null;
  const r = (pd as Record<string, unknown>).report;
  if (r == null || typeof r !== 'object' || Array.isArray(r)) return null;
  return r as Record<string, unknown>;
});

const progressRows = computed((): Record<string, unknown>[] => {
  const pd = progressPayload.value;
  if (pd == null || typeof pd !== 'object') return [];
  const pl = (pd as Record<string, unknown>).progress_list;
  if (!Array.isArray(pl)) return [];
  return pl.filter((x) => x != null && typeof x === 'object') as Record<
    string,
    unknown
  >[];
});

const hasProgressDashboard = computed(
  () => progressId.value != null && progressPayload.value != null
);

/** جزئیات بارگذاری شده ولی بدون بلوک گزارش (مثلاً API متفاوت) */
const hasProgressPayloadWithoutReport = computed(() => {
  if (!hasProgressDashboard.value) return false;
  return reportSummary.value == null && progressRows.value.length > 0;
});

function progressIdsMatch(rowId: unknown, wanted: number | null): boolean {
  if (wanted == null) return false;
  const a = rowId;
  const b = wanted;
  const na = typeof a === 'number' ? a : Number(a);
  const nb = typeof b === 'number' ? b : Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && na === nb) return true;
  return String(a ?? '') === String(b ?? '');
}

/**
 * فرم ثبت پاسخ: task + progress.
 * اولویت: ردیف progress_list با همان progress_id → وگرنه اولین ردیف؛
 * اگر لیست خالی و روی تسک `progress` بود → همان (مثلاً فقط task/get).
 */
const doingAnswerFormRow = computed((): Record<string, unknown> | null => {
  const tk = summaryTask.value;
  if (!tk) return null;

  const rows = progressRows.value;
  const pid = progressId.value;

  let p: Record<string, unknown> | undefined;

  if (rows.length > 0) {
    if (pid != null) {
      p = rows.find((r) => progressIdsMatch(r.id, pid));
    }
    if (!p) {
      p = rows[0];
    }
  } else {
    const nested = tk.progress;
    if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
      p = nested as Record<string, unknown>;
    }
  }

  if (!p) return null;
  return { task: tk, progress: p };
});

function reportNum(r: Record<string, unknown>, key: string): string {
  const v = r[key];
  if (v == null || v === '') return '0';
  if (typeof v === 'number' && Number.isFinite(v)) {
    return key === 'average' ? String(v) : String(Math.trunc(v));
  }
  return String(v);
}

function userCell(p: Record<string, unknown>): string {
  const u = p.user;
  if (!u || typeof u !== 'object' || Array.isArray(u)) return '—';
  const o = u as Record<string, unknown>;
  const name = o.name ?? o.full_name ?? o.mobile ?? o.id;
  if (name == null || name === '') return '—';
  return String(name);
}

/** فقط تاریخ مهلت؛ بدون ساعت (مثل `time_deadline_view` با برش بعد از فاصله یا `T`) */
function deadlineDateOnly(p: Record<string, unknown>): string {
  const view = p.time_deadline_view;
  if (typeof view === 'string' && view.trim()) {
    const s = view.trim();
    const sp = s.indexOf(' ');
    if (sp !== -1) return s.slice(0, sp).trim();
    const tIdx = s.indexOf('T');
    if (tIdx !== -1) return s.slice(0, tIdx);
    return s;
  }
  return '—';
}

/** همان کلیدهای badge لیست عملیات تطبیق */
function progressStatusKey(p: Record<string, unknown>): string {
  const lv = p.level;
  const st = p.status;
  const raw =
    typeof lv === 'string' && lv.trim()
      ? lv.trim().toLowerCase()
      : typeof st === 'string' && st.trim()
        ? st.trim().toLowerCase()
        : '';
  const known = new Set([
    'clauses',
    'pending-assignment',
    'todo',
    'doing',
    'done',
    'approve',
    'reject',
  ]);
  if (raw && known.has(raw)) return raw;
  return 'unknown';
}

function progressStatusBadgeClass(p: Record<string, unknown>): string {
  return complianceOperationsStatusBadgeClass(progressStatusKey(p));
}

function statusLabelForProgress(p: Record<string, unknown>): string {
  const k = progressStatusKey(p);
  const keyToI18n: Record<string, string> = {
    clauses: 'compliance-page.status-clauses',
    'pending-assignment': 'compliance-page.status-pending-assignment',
    todo: 'compliance-page.status-todo',
    doing: 'compliance-page.status-doing',
    done: 'compliance-page.status-done',
    approve: 'compliance-page.status-approve',
    reject: 'compliance-page.status-reject',
  };
  if (k !== 'unknown' && keyToI18n[k]) return t(keyToI18n[k]);
  const lv = p.level;
  const st = p.status;
  const parts = [lv, st].filter((x) => typeof x === 'string' && String(x).trim());
  return parts.length ? parts.map(String).join(' / ') : '—';
}

function displayAnswerScore(p: Record<string, unknown>): string {
  const s = p.answer_score;
  if (s == null || s === '') return '—';
  return typeof s === 'number' ? String(s) : String(s);
}

function displayAnswerValue(p: Record<string, unknown>): string {
  const v = p.answer_value;
  if (v == null || v === '') return '—';
  return String(v);
}

function nextActionsTranslated(p: Record<string, unknown>): string {
  const na = p.next_actions;
  if (!Array.isArray(na) || na.length === 0) return '—';
  const keyToI18n: Record<string, string> = {
    todo: 'compliance-page.status-todo',
    doing: 'compliance-page.status-doing',
    done: 'compliance-page.status-done',
    approve: 'compliance-page.status-approve',
    reject: 'compliance-page.status-reject',
  };
  return na
    .map((x) => {
      const raw = String(x).trim();
      const k = raw.toLowerCase();
      const path = keyToI18n[k];
      return path ? t(path) : raw;
    })
    .join('، ');
}

async function loadDetails() {
  const tid = nav.taskId;
  const pid = nav.progressId;
  loadError.value = null;
  taskPayload.value = null;
  progressPayload.value = null;

  if (tid == null) {
    return;
  }

  loading.value = true;

  async function fetchTaskGetOnly(): Promise<boolean> {
    try {
      const taskRaw = await ermRepo.taskGet({ id: tid });
      taskPayload.value = unwrapErmResponse(taskRaw);
      return true;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : t('compliance-page.doing-task-load-error');
      loadError.value = msg;
      toast(msg, { type: 'error' });
      return false;
    }
  }

  function progressPayloadHasTask(data: unknown): boolean {
    if (data == null || typeof data !== 'object') return false;
    const tk = (data as Record<string, unknown>).task;
    return tk != null && typeof tk === 'object' && !Array.isArray(tk);
  }

  if (pid != null) {
    let progressOk = false;
    try {
      const progRaw = await ermRepo.complianceProgressDetail({
        task_id: tid,
        progress_id: pid,
      });
      progressPayload.value = unwrapErmResponse(progRaw);
      progressOk = true;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : t('compliance-page.doing-task-load-error');
      toast(
        `${t('compliance-page.doing-task-section-progress')}: ${msg}`,
        { type: 'error' }
      );
    }

    const embeddedTask =
      progressOk && progressPayloadHasTask(progressPayload.value);
    if (!embeddedTask) {
      const ok = await fetchTaskGetOnly();
      if (!ok) {
        loading.value = false;
        return;
      }
    }
  } else {
    const ok = await fetchTaskGetOnly();
    if (!ok) {
      loading.value = false;
      return;
    }
  }

  loading.value = false;
}

watch(
  () => [nav.taskId, nav.progressId] as const,
  () => {
    void loadDetails();
  },
  { immediate: true }
);
</script>

<template>
  <div class="grid grid-cols-12 gap-3 p-2">
    <div class="col-span-12">
      <p
        v-if="taskId == null"
        class="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-6 text-sm text-slate-500 dark:border-darkmode-600 dark:bg-darkmode-900/40 dark:text-slate-400"
      >
        {{ t('compliance-page.doing-task-page-no-context') }}
      </p>

      <template v-else>
        <div
          v-if="loading"
          class="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500 dark:border-darkmode-600 dark:bg-darkmode-900/40 dark:text-slate-400"
        >
          {{ t('general.loading') }}
        </div>

        <p
          v-else-if="loadError"
          class="text-error"
        >
          {{ loadError }}
        </p>

        <div
          v-else
          class="space-y-4"
        >
          <!-- خلاصهٔ تعهد (همان پارامترهای مدال تسک/تعهد در عملیات تطبیق) -->
          <section
            v-if="showCommitmentCard"
            class="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-900/50"
          >
            <article
              class="w-full min-w-0 text-slate-900 dark:text-slate-100"
            >
              <header
                v-if="commitmentSummary && commitmentSummary.titleStr.trim()"
                class="mb-2.5 w-full border-b border-slate-200/80 pb-2 dark:border-darkmode-600"
              >
                <h1
                  class="w-full min-w-0 text-[15px] font-semibold leading-snug text-slate-900 dark:text-slate-50"
                >
                  {{ commitmentSummary.titleStr }}
                </h1>
              </header>

              <div
                class="grid grid-cols-1 gap-x-3 gap-y-3 md:grid-cols-2 md:gap-y-3.5"
              >
                <!-- بخش | نوع -->
                <div class="min-w-0 md:col-span-1">
                  <p
                    class="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500"
                  >
                    {{ t('task.section') }}
                  </p>
                  <p
                    class="break-words text-xs font-medium leading-snug text-slate-800 dark:text-slate-100"
                  >
                    {{ displaySectionLabel || '—' }}
                  </p>
                </div>

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

                <!-- متن قانون | شماره بخش نامه -->
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
                    {{ t('task.rule-code') }}
                  </p>
                  <p
                    class="break-words text-xs font-medium leading-snug text-slate-800 dark:text-slate-100"
                  >
                    {{ commitmentSummary.ruleCode || '—' }}
                  </p>
                </div>

                <!-- واحد مکلف -->
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
                      class="mx-2 inline-flex max-w-full break-words rounded-md border border-slate-200/90 bg-slate-50/90 px-2 py-1 text-xs leading-snug text-slate-700 dark:border-darkmode-600 dark:bg-darkmode-800/60 dark:text-slate-200"
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
          </section>

          <!-- داشبورد گزارش (از progress/detail) -->
          <template v-if="hasProgressDashboard">
            <section v-if="reportSummary">
              <h2
                class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                {{ t('compliance-page.doing-task-dashboard-report-title') }}
              </h2>
              <div
                class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
              >
                <div
                  v-for="k in REPORT_DASHBOARD_KEYS"
                  :key="k"
                  :class="complianceOperationsStatusReportCardClass(k)"
                >
                  <p class="text-[10px] font-medium opacity-90">
                    {{ t(`compliance-page.status-${k}`) }}
                  </p>
                  <p class="text-lg font-semibold tabular-nums">
                    {{ reportNum(reportSummary, k) }}
                  </p>
                </div>
                <div
                  class="min-w-0 rounded-lg border border-y border-l border-r-[4px] border-r-slate-300/90 border-slate-200/90 bg-slate-50/90 px-3 py-2.5 text-slate-800 shadow-sm dark:border-darkmode-600 dark:border-r-slate-600 dark:bg-darkmode-900/40 dark:text-slate-100"
                >
                  <p class="text-[10px] font-medium opacity-90 text-slate-500 dark:text-slate-400">
                    {{ t('compliance-page.doing-task-report-average') }}
                  </p>
                  <p class="text-lg font-semibold tabular-nums">
                    {{ reportNum(reportSummary, 'average') }}
                  </p>
                </div>
              </div>
            </section>

            <p
              v-else-if="hasProgressPayloadWithoutReport"
              class="mb-2 text-xs text-slate-500 dark:text-slate-400"
            >
              {{ t('compliance-page.doing-task-no-report-block') }}
            </p>

            <section>
              <h2
                class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                {{ t('compliance-page.doing-task-per-user-title') }}
              </h2>
              <div
                class="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-darkmode-600 dark:bg-darkmode-900/50"
              >
                <table class="w-full min-w-[56rem] border-collapse text-xs">
                  <thead>
                    <tr
                      class="border-b border-slate-200 bg-slate-50/90 dark:border-darkmode-600 dark:bg-darkmode-900/60"
                    >
                      <th
                        class="whitespace-nowrap px-3 py-2.5 text-start font-semibold text-slate-600 dark:text-slate-300"
                      >
                        #
                      </th>
                      <th
                        class="whitespace-nowrap px-3 py-2.5 text-start font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {{ t('compliance-page.doing-task-col-user') }}
                      </th>
                      <th
                        class="whitespace-nowrap px-3 py-2.5 text-start font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {{ t('compliance-page.col-status') }}
                      </th>
                      <th
                        class="whitespace-nowrap px-3 py-2.5 text-start font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {{ t('compliance-page.col-deadline') }}
                      </th>
                      <th
                        class="whitespace-nowrap px-3 py-2.5 text-start font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {{ t('compliance-page.doing-task-col-score') }}
                      </th>
                      <th
                        class="min-w-[8rem] px-3 py-2.5 text-start font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {{ t('compliance-page.doing-task-col-answer') }}
                      </th>
                      <th
                        class="min-w-[8rem] px-3 py-2.5 text-start font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {{ t('compliance-page.doing-task-col-next-actions') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, idx) in progressRows"
                      :key="String(row.id ?? row.slug ?? idx)"
                      class="border-b border-slate-100 last:border-0 dark:border-darkmode-700"
                    >
                      <td
                        class="px-3 py-2 text-start tabular-nums text-slate-500 dark:text-slate-400"
                      >
                        {{ idx + 1 }}
                      </td>
                      <td class="px-3 py-2 text-start align-top">
                        <span class="font-medium text-slate-800 dark:text-slate-100">{{
                          userCell(row)
                        }}</span>
                      </td>
                      <td class="px-3 py-2 text-start align-top">
                        <span :class="progressStatusBadgeClass(row)">{{
                          statusLabelForProgress(row)
                        }}</span>
                      </td>
                      <td
                        class="whitespace-nowrap px-3 py-2 text-start align-top text-slate-700 dark:text-slate-200"
                      >
                        {{ deadlineDateOnly(row) }}
                      </td>
                      <td
                        class="px-3 py-2 text-start align-top tabular-nums text-slate-800 dark:text-slate-100"
                      >
                        {{ displayAnswerScore(row) }}
                      </td>
                      <td
                        class="max-w-[14rem] px-3 py-2 text-start align-top break-words text-slate-700 dark:text-slate-200"
                      >
                        {{ displayAnswerValue(row) }}
                      </td>
                      <td
                        class="max-w-[12rem] px-3 py-2 text-start align-top break-words text-slate-600 dark:text-slate-300"
                      >
                        {{ nextActionsTranslated(row) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p
                  v-if="progressRows.length === 0"
                  class="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
                >
                  {{ t('compliance-page.doing-task-empty-progress-list') }}
                </p>
              </div>
            </section>
          </template>

          <ComplianceDoingTaskAnswerForm
            v-if="doingAnswerFormRow"
            :row="doingAnswerFormRow"
            @success="() => void loadDetails()"
          />

          <p
            v-if="progressId == null && !doingAnswerFormRow"
            class="rounded-md border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
          >
            {{ t('compliance-page.doing-task-no-progress-detail') }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
