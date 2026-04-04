<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { ermRepo } from '@/core/repositories/ermRepo';
import {
  resolveOperationsRiskProgressId,
  resolveOperationsTaskRowId,
} from '@/composables/taskClauseNavigation';
import { useUserStore } from '@/stores/user';
import { isPersianDigitLocale, toPersianDigits } from '@/utils/persianDigits';
import moment from 'moment-jalaali';
import Lucide from '@/base-components/Lucide';
import { getRisk } from '../riskStatusHelpers';

const props = defineProps<{
  row: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { t, locale } = useI18n();
const userStore = useUserStore();
const submitting = ref(false);
const responseTypeOptions = ref<{ value: string; label: string }[]>([]);
const responseTypesLoading = ref(true);

function mapResponseTypes(
  list: Record<string, unknown>[]
): { value: string; label: string }[] {
  return list
    .map((item) => {
      const value = item.value;
      if (value == null || value === '') return null;
      const title = item.title ?? item.label ?? value;
      return {
        value: String(value),
        label: typeof title === 'string' ? title : String(title),
      };
    })
    .filter((x): x is { value: string; label: string } => x != null);
}

function resolveRiskUserId(row: Record<string, unknown>): string | null {
  const risk = row.risk as Record<string, unknown> | undefined;
  if (!risk) return null;
  const u = risk.user;
  if (u != null && typeof u === 'object' && !Array.isArray(u)) {
    const o = u as Record<string, unknown>;
    const id = o.id ?? o.user_id;
    if (id != null && id !== '') return String(id);
  }
  const uid = risk.user_id;
  if (uid != null && uid !== '') return String(uid);
  return null;
}

function resolveSubmitUserId(row: Record<string, unknown>): string {
  const fromRisk = resolveRiskUserId(row);
  if (fromRisk) return fromRisk;
  const cu = userStore.currentUser as Record<string, unknown> | null | undefined;
  if (cu?.id != null && cu.id !== '') return String(cu.id);
  return '';
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function strOrDash(v: unknown): string {
  if (v == null || v === '') return '—';
  return typeof v === 'string' ? v : String(v);
}

const riskPayload = computed(() => getRisk(props.row));

function persianDigitsToLatin(s: string): string {
  const map: Record<string, string> = {
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
  };
  return s.replace(/[۰-۹]/g, (c) => map[c] ?? c);
}

function formatRiskCompletedDate(
  r: Record<string, unknown>,
  loc: string
): string {
  const fa = isPersianDigitLocale(loc);

  const tu = r.time_update;
  if (tu != null && tu !== '' && Number(tu) > 0) {
    const sec = Number(tu);
    if (!Number.isFinite(sec) || sec <= 0) return '—';
    const m = moment.unix(sec);
    if (!m.isValid()) return '—';
    if (fa) {
      return toPersianDigits(m.format('jYYYY/jMM/jDD'));
    }
    return m.format('YYYY/MM/DD');
  }

  const tryParseView = (raw: unknown): string | null => {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    const s = raw.trim();
    const normalized = persianDigitsToLatin(s);
    const candidates = [
      moment(normalized, ['jYYYY/jMM/jDD', 'jYYYY/jM/jD', 'YYYY/MM/DD', 'YYYY-MM-DD'], true),
      moment(normalized),
    ];
    for (const c of candidates) {
      if (c.isValid()) {
        if (fa) return toPersianDigits(c.format('jYYYY/jMM/jDD'));
        return c.format('YYYY/MM/DD');
      }
    }
    return s;
  };

  const fromTv = tryParseView(r.time_update_view);
  if (fromTv) return fromTv;
  const fromCv = tryParseView(r.current_time_view);
  if (fromCv) return fromCv;

  return '—';
}

const completedAtDisplay = computed(() => {
  const r = riskPayload.value;
  if (!r) return '—';
  return formatRiskCompletedDate(r, String(locale.value ?? ''));
});

/** تهدید و آسیب‌پذیری/رویداد، پشت‌سرهم در یک متن سناریو */
const scenarioDisplay = computed(() => {
  const r = riskPayload.value;
  if (!r) return '—';
  const threat = String(r.risk_threat ?? '').trim();
  const damage = String(r.risk_damage ?? '').trim();
  const parts = [threat, damage].filter((p) => p.length > 0);
  if (parts.length === 0) return '—';
  return parts.join(' ');
});

function strategyLabel(slug: unknown): string {
  if (slug == null || slug === '') return '—';
  const s = String(slug).trim();
  const hit = responseTypeOptions.value.find((o) => o.value === s);
  return hit?.label ?? s;
}

/** همان منطق رنگ امتیاز ریسک در فرم todo */
function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

function riskPalette(score: number): { h: number; s: number; l: number } {
  const tt = (score - 1) / 24;
  if (tt <= 0.5) {
    const k = tt * 2;
    return {
      h: lerp(142, 43, k),
      s: lerp(72, 96, k),
      l: lerp(22, 52, k),
    };
  }
  const k = (tt - 0.5) * 2;
  return {
    h: lerp(43, 0, k),
    s: lerp(96, 72, k),
    l: lerp(52, 34, k),
  };
}

function hslCss(p: { h: number; s: number; l: number }): string {
  return `hsl(${Math.round(p.h)} ${Math.round(p.s)}% ${Math.round(p.l)}%)`;
}

function textOnRiskBg(lightness: number): string {
  return lightness < 48 ? 'rgb(255 255 255)' : 'rgb(15 23 42)';
}

const riskScoreVisual = computed(() => {
  const r = riskPayload.value;
  if (!r) return null;
  const ni = numOrNull(r.risk_intensity);
  const ne = numOrNull(r.risk_effect);
  if (ni == null || ne == null) return null;
  if (ni < 1 || ni > 5 || ne < 1 || ne > 5) return null;
  const score = ni * ne;
  const pal = riskPalette(score);
  return {
    score,
    bg: hslCss(pal),
    fg: textOnRiskBg(pal.l),
    border: hslCss({ ...pal, l: Math.max(12, pal.l - 8) }),
  };
});

function commentFromHistory(risk: Record<string, unknown>): string {
  const hist = risk.history;
  if (!Array.isArray(hist)) return '';
  const done = [...hist]
    .reverse()
    .find(
      (h) =>
        h &&
        typeof h === 'object' &&
        String((h as Record<string, unknown>).level ?? '').toLowerCase() ===
          'done'
    ) as Record<string, unknown> | undefined;
  const com = done?.comment;
  return typeof com === 'string' ? com.trim() : '';
}

function buildRiskReviewPayload(
  row: Record<string, unknown>,
  level: 'approve' | 'reject' | 'doing'
): Record<string, unknown> {
  const risk = getRisk(row);
  if (!risk) throw new Error('no risk');
  const taskId = resolveOperationsTaskRowId(row);
  if (taskId == null) throw new Error('no task');
  const userId = resolveSubmitUserId(row);
  if (!userId) throw new Error('no user');
  const progressIdRaw = resolveOperationsRiskProgressId(row);
  const progressId = progressIdRaw != null ? progressIdRaw : null;

  const intensity = numOrNull(risk.risk_intensity);
  const effect = numOrNull(risk.risk_effect);
  const pct = numOrNull(risk.risk_execution_percent);

  return {
    task_id: taskId,
    user_id: userId,
    progress_id: progressId,
    level,
    type: 'single',
    risk_threat: String(risk.risk_threat ?? '').trim(),
    risk_damage: String(risk.risk_damage ?? '').trim(),
    risk_intensity: intensity,
    risk_effect: effect,
    risk_response_type: String(risk.risk_response_type ?? '').trim(),
    risk_execution_percent: pct,
    risk_proposed_action: String(risk.risk_proposed_action ?? '').trim(),
    comment:
      typeof risk.comment === 'string'
        ? risk.comment.trim()
        : commentFromHistory(risk),
    time_deadline: '',
  };
}

async function submitReview(level: 'approve' | 'reject') {
  const risk = getRisk(props.row);
  if (!risk) {
    toast(t('compliance-page.status-modal-no-task-data'), { type: 'error' });
    return;
  }
  submitting.value = true;
  try {
    const payload = buildRiskReviewPayload(props.row, level);
    const result = await ermRepo.riskProgress(payload);
    if (result?.result) {
      toast(
        level === 'approve'
          ? t('risk-operations.done-review-approve-success')
          : t('risk-operations.done-review-reject-success'),
        { type: 'success' }
      );
      emit('success');
    } else {
      toast(
        String(result?.error?.message ?? t('risk-operations.done-review-error')),
        { type: 'error' }
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'no user') {
      toast(t('risk-operations.todo-validation-user'), { type: 'error' });
    } else {
      toast(
        e instanceof Error ? e.message : t('risk-operations.done-review-error'),
        { type: 'error' }
      );
    }
  } finally {
    submitting.value = false;
  }
}

/** بازگرداندن ریسک رد‌شده به وضعیت «در حال اجرا» */
async function submitRestartToDoing() {
  const risk = getRisk(props.row);
  if (!risk) {
    toast(t('compliance-page.status-modal-no-task-data'), { type: 'error' });
    return;
  }
  submitting.value = true;
  try {
    const payload = buildRiskReviewPayload(props.row, 'doing');
    const result = await ermRepo.riskProgress(payload);
    if (result?.result) {
      toast(t('compliance-page.reject-restart-success'), { type: 'success' });
      emit('success');
    } else {
      toast(
        String(result?.error?.message ?? t('compliance-page.reject-restart-error')),
        { type: 'error' }
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'no user') {
      toast(t('risk-operations.todo-validation-user'), { type: 'error' });
    } else {
      toast(
        e instanceof Error ? e.message : t('compliance-page.reject-restart-error'),
        { type: 'error' }
      );
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  responseTypesLoading.value = true;
  try {
    const res = await ermRepo.riskResponseTypeList({ page: 1, limit: 50 });
    const list = res?.data?.list ?? [];
    responseTypeOptions.value = mapResponseTypes(
      Array.isArray(list) ? (list as Record<string, unknown>[]) : []
    );
  } catch {
    responseTypeOptions.value = [];
  } finally {
    responseTypesLoading.value = false;
  }
});

defineExpose({
  submitting,
  submitReview,
  submitRestartToDoing,
});
</script>

<template>
  <div class="mt-4 border-t border-slate-200 pt-4 dark:border-darkmode-600">
    <div
      v-if="responseTypesLoading"
      class="py-8 text-center text-xs text-slate-500"
    >
      {{ t('general.loading') }}
    </div>

    <div
      v-else
      class="overflow-hidden rounded-lg border border-slate-200/90 bg-slate-50/40 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-900/30"
    >
      <!-- گزارش: هدر متادیتا -->
      <div
        class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-200/90 bg-white px-4 py-3 dark:border-darkmode-600 dark:bg-darkmode-800/60"
      >
        <span
          class="text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400"
        >{{ t('risk-operations.done-report-doc-label') }}</span>
        <div
          class="flex flex-wrap items-baseline gap-2 md:gap-3"
        >
          <span
            class="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500"
          >{{ t('risk-operations.done-field-completed-at') }}</span>
          <span
            class="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50"
          >{{ completedAtDisplay }}</span>
        </div>
      </div>

      <!-- شاخص‌ها — اول گزارش، بدون بردر بالا/پایین بخش -->
      <section class="bg-white px-4 py-2 dark:bg-darkmode-800/40">
        <div class="grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-2">
          <div
            class="flex aspect-square min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200/75 bg-white p-2.5 dark:border-darkmode-600 dark:bg-darkmode-800/50"
          >
            <div class="flex shrink-0 items-center justify-between gap-2">
              <span
                class="min-w-0 flex-1 truncate text-[12px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.todo-field-intensity') }}</span>
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
              >
                <Lucide
                  icon="Gauge"
                  class="!h-6 !w-6 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 flex-col items-center justify-center px-0.5"
            >
              <p
                class="text-center text-2xl font-extrabold tabular-nums leading-none tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50"
              >
                {{ strOrDash(riskPayload?.risk_intensity) }}
              </p>
            </div>
          </div>

          <div
            class="flex aspect-square min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200/75 bg-white p-2.5 dark:border-darkmode-600 dark:bg-darkmode-800/50"
          >
            <div class="flex shrink-0 items-center justify-between gap-2">
              <span
                class="min-w-0 flex-1 truncate text-[12px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.todo-field-effect') }}</span>
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200"
              >
                <Lucide
                  icon="Target"
                  class="!h-6 !w-6 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 flex-col items-center justify-center px-0.5"
            >
              <p
                class="text-center text-2xl font-extrabold tabular-nums leading-none tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50"
              >
                {{ strOrDash(riskPayload?.risk_effect) }}
              </p>
            </div>
          </div>

          <div
            class="flex aspect-square min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200/75 bg-white p-2.5 dark:border-darkmode-600 dark:bg-darkmode-800/50"
          >
            <div class="flex shrink-0 items-center justify-between gap-2">
              <span
                class="min-w-0 flex-1 truncate text-[12px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.done-report-col-risk-value') }}</span>
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
              >
                <Lucide
                  icon="ShieldAlert"
                  class="!h-6 !w-6 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 flex-col items-center justify-center px-0.5"
            >
              <span
                v-if="riskScoreVisual"
                class="inline-flex min-h-[2.5rem] min-w-[2.75rem] items-center justify-center rounded-xl px-2.5 text-xl font-extrabold tabular-nums leading-none shadow-inner"
                :style="{
                  backgroundColor: riskScoreVisual.bg,
                  color: riskScoreVisual.fg,
                  border: `1px solid ${riskScoreVisual.border}`,
                }"
              >{{ riskScoreVisual.score }}</span>
              <span
                v-else
                class="text-2xl font-extrabold text-slate-300 dark:text-slate-600"
              >—</span>
            </div>
          </div>

          <div
            class="flex aspect-square min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200/75 bg-white p-2.5 dark:border-darkmode-600 dark:bg-darkmode-800/50"
          >
            <div class="flex shrink-0 items-center justify-between gap-2">
              <span
                class="min-w-0 flex-1 truncate text-[12px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.todo-field-execution-percent') }}</span>
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
              >
                <Lucide
                  icon="Percent"
                  class="!h-6 !w-6 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 flex-col items-center justify-center px-0.5"
            >
              <p
                class="text-center text-2xl font-extrabold tabular-nums leading-none tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50"
              >
                {{
                  numOrNull(riskPayload?.risk_execution_percent) != null
                    ? `${numOrNull(riskPayload?.risk_execution_percent)}%`
                    : '—'
                }}
              </p>
            </div>
          </div>

          <div
            class="col-span-2 flex aspect-square min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200/75 bg-white p-2.5 dark:border-darkmode-600 dark:bg-darkmode-800/50 md:col-span-1"
          >
            <div class="flex shrink-0 items-center justify-between gap-2">
              <span
                class="min-w-0 flex-1 truncate text-[12px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.todo-field-strategy') }}</span>
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200"
              >
                <Lucide
                  icon="Compass"
                  class="!h-6 !w-6 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-0.5"
            >
              <p
                class="hyphens-auto break-words text-center text-[13px] font-extrabold leading-snug text-slate-900 sm:text-sm dark:text-slate-50"
              >
                {{ strategyLabel(riskPayload?.risk_response_type) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- سناریو -->
      <section class="border-b border-slate-200/80 bg-white px-4 py-4 dark:border-darkmode-600 dark:bg-darkmode-800/40">
        <h3
          class="mb-3 border-s-[3px] border-primary pb-1 ps-3 text-[13px] font-bold text-slate-800 dark:text-slate-100"
        >
          {{ t('risk-operations.done-report-label-scenario') }}
        </h3>
        <p
          class="whitespace-pre-wrap text-sm leading-relaxed text-slate-900 dark:text-slate-100"
        >
          {{ scenarioDisplay }}
        </p>
      </section>

      <!-- اقدام پیشنهادی -->
      <section class="bg-white px-4 py-4 dark:bg-darkmode-800/40">
        <h3
          class="mb-3 border-s-[3px] border-primary pb-1 ps-3 text-[13px] font-bold text-slate-800 dark:text-slate-100"
        >
          {{ t('risk-operations.todo-field-proposed-action') }}
        </h3>
        <p
          class="whitespace-pre-wrap text-sm leading-relaxed text-slate-900 dark:text-slate-100"
        >
          {{ strOrDash(riskPayload?.risk_proposed_action) }}
        </p>
      </section>
    </div>
  </div>
</template>
