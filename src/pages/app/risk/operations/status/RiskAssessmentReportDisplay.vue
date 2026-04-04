<script setup lang="ts">
/**
 * همان بلوک «گزارش ارزیابی ریسک» در RiskStatusDoneReviewView — فقط نمایش.
 */
import { computed, onMounted, ref, withDefaults } from 'vue';
import { useI18n } from 'vue-i18n';
import { ermRepo } from '@/core/repositories/ermRepo';
import { isPersianDigitLocale, toPersianDigits } from '@/utils/persianDigits';
import Lucide from '@/base-components/Lucide';

const props = withDefaults(
  defineProps<{
    /** آبجکت ریسک/پیشرفت (همان فیلدهای ردیف لیست) */
    risk: Record<string, unknown>;
    /** نام مجری برای هدر (اختیاری) */
    userLabel?: string | null;
    /** غیرفعال‌نما — وقتی ریسک هنوز تأیید نشده */
    disabled?: boolean;
    /** برچسب وضعیت پیشرفت (اختیاری) */
    statusLabel?: string | null;
    /** کلاس badge وضعیت — هم‌سبک عملیات ریسک */
    statusBadgeClass?: string;
  }>(),
  {
    disabled: false,
    statusLabel: '',
    statusBadgeClass: '',
  }
);

const { t, locale } = useI18n();
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

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function strOrDash(v: unknown): string {
  if (v == null || v === '') return '—';
  return typeof v === 'string' ? v : String(v);
}

const riskPayload = computed(() => props.risk);

/** فقط تاریخ مهلت؛ بدون ساعت — از `time_deadline_view` / `time_deadline` */
function deadlineWithoutTime(
  view: string | undefined,
  ts: unknown
): string {
  if (typeof view === 'string' && view.trim()) {
    const s = view.trim();
    const sp = s.indexOf(' ');
    if (sp !== -1) return s.slice(0, sp).trim();
    const tIdx = s.indexOf('T');
    if (tIdx !== -1) return s.slice(0, tIdx);
    return s;
  }
  const n = typeof ts === 'number' ? ts : Number(ts);
  if (Number.isFinite(n) && n > 0) {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(n * 1000));
  }
  return '—';
}

const expiredAtDisplay = computed(() => {
  const r = riskPayload.value;
  if (!r) return '—';
  const view = r.time_deadline_view;
  const raw = deadlineWithoutTime(
    typeof view === 'string' ? view : undefined,
    r.time_deadline
  );
  if (raw === '—') return '—';
  const loc = String(locale.value ?? '');
  if (isPersianDigitLocale(loc)) return toPersianDigits(raw);
  return raw;
});

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
  if (typeof slug === 'object' && slug !== null && !Array.isArray(slug)) {
    const o = slug as Record<string, unknown>;
    const t = o.title ?? o.label ?? o.name ?? o.value;
    if (t != null && String(t).trim()) return String(t).trim();
  }
  const s = String(slug).trim();
  const hit = responseTypeOptions.value.find((o) => o.value === s);
  return hit?.label ?? s;
}

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
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-slate-200/90 bg-slate-50/40 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-900/30">
    <div
      v-if="responseTypesLoading"
      class="py-6 text-center text-[11px] text-slate-500"
    >
      {{ t('general.loading') }}
    </div>

    <template v-else>
      <div
        class="min-w-0"
        :class="
          disabled
            ? 'pointer-events-none select-none opacity-[0.52]'
            : ''
        "
        :aria-disabled="disabled ? 'true' : undefined"
      >
      <div
        class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-200/90 bg-white px-3 py-2.5 dark:border-darkmode-600 dark:bg-darkmode-800/60"
      >
        <div class="min-w-0 flex-1">
          <span
            class="text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400"
          >{{ t('risk-operations.done-report-doc-label') }}</span>
          <p
            v-if="userLabel && String(userLabel).trim()"
            class="mt-0.5 text-[11px] leading-snug text-slate-600 dark:text-slate-300"
          >
            <span
              class="font-medium text-slate-500 dark:text-slate-400"
            >{{ t('risk-operations.modal-risk-executor-label') }}:</span>
            <span
              class="ms-0.5 font-bold text-slate-900 dark:text-slate-50"
            >{{ userLabel }}</span>
          </p>
        </div>
        <div
          class="flex shrink-0 flex-col items-end gap-1 text-end"
        >
          <div
            class="flex flex-wrap items-baseline justify-end gap-x-2 gap-y-0.5 md:gap-x-3"
          >
            <span
              class="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500"
            >{{ t('risk-operations.done-report-field-expired-at') }}</span>
            <span
              class="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50"
            >{{ expiredAtDisplay }}</span>
          </div>
          <span
            v-if="statusLabel && String(statusLabel).trim()"
            :class="statusBadgeClass"
          >{{ statusLabel }}</span>
        </div>
      </div>

      <section class="bg-white px-2 py-1 dark:bg-darkmode-800/40">
        <div class="grid grid-cols-2 gap-1 md:grid-cols-5 md:gap-1.5">
          <div
            class="flex aspect-[5/2] min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-slate-200/75 bg-white p-1 dark:border-darkmode-600 dark:bg-darkmode-800/50"
          >
            <div class="flex shrink-0 items-center justify-between gap-1">
              <span
                class="min-w-0 flex-1 truncate text-[10px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.todo-field-intensity') }}</span>
              <div
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
              >
                <Lucide
                  icon="Gauge"
                  class="!h-3.5 !w-3.5 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 flex-col items-center justify-center px-0 py-0.5"
            >
              <p
                class="text-center text-base font-extrabold tabular-nums leading-none tracking-tight text-slate-900 sm:text-lg dark:text-slate-50"
              >
                {{ strOrDash(riskPayload?.risk_intensity) }}
              </p>
            </div>
          </div>

          <div
            class="flex aspect-[5/2] min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-slate-200/75 bg-white p-1 dark:border-darkmode-600 dark:bg-darkmode-800/50"
          >
            <div class="flex shrink-0 items-center justify-between gap-1">
              <span
                class="min-w-0 flex-1 truncate text-[10px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.todo-field-effect') }}</span>
              <div
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200"
              >
                <Lucide
                  icon="Target"
                  class="!h-3.5 !w-3.5 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 flex-col items-center justify-center px-0 py-0.5"
            >
              <p
                class="text-center text-base font-extrabold tabular-nums leading-none tracking-tight text-slate-900 sm:text-lg dark:text-slate-50"
              >
                {{ strOrDash(riskPayload?.risk_effect) }}
              </p>
            </div>
          </div>

          <div
            class="flex aspect-[5/2] min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-slate-200/75 bg-white p-1 dark:border-darkmode-600 dark:bg-darkmode-800/50"
          >
            <div class="flex shrink-0 items-center justify-between gap-1">
              <span
                class="min-w-0 flex-1 truncate text-[10px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.done-report-col-risk-value') }}</span>
              <div
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
              >
                <Lucide
                  icon="ShieldAlert"
                  class="!h-3.5 !w-3.5 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 flex-col items-center justify-center px-0 py-0.5"
            >
              <span
                v-if="riskScoreVisual"
                class="inline-flex min-h-[1.25rem] min-w-[1.75rem] items-center justify-center rounded-md px-1 text-sm font-extrabold tabular-nums leading-none shadow-inner sm:text-base"
                :style="{
                  backgroundColor: riskScoreVisual.bg,
                  color: riskScoreVisual.fg,
                  border: `1px solid ${riskScoreVisual.border}`,
                }"
              >{{ riskScoreVisual.score }}</span>
              <span
                v-else
                class="text-base font-extrabold text-slate-300 dark:text-slate-600"
              >—</span>
            </div>
          </div>

          <div
            class="flex aspect-[5/2] min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-slate-200/75 bg-white p-1 dark:border-darkmode-600 dark:bg-darkmode-800/50"
          >
            <div class="flex shrink-0 items-center justify-between gap-1">
              <span
                class="min-w-0 flex-1 truncate text-[10px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.todo-field-execution-percent') }}</span>
              <div
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
              >
                <Lucide
                  icon="Percent"
                  class="!h-3.5 !w-3.5 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 flex-col items-center justify-center px-0 py-0.5"
            >
              <p
                class="text-center text-base font-extrabold tabular-nums leading-none tracking-tight text-slate-900 sm:text-lg dark:text-slate-50"
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
            class="col-span-2 flex aspect-[5/2] min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-slate-200/75 bg-white p-1 dark:border-darkmode-600 dark:bg-darkmode-800/50 md:col-span-1"
          >
            <div class="flex shrink-0 items-center justify-between gap-1">
              <span
                class="min-w-0 flex-1 truncate text-[10px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.todo-field-strategy') }}</span>
              <div
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200"
              >
                <Lucide
                  icon="Compass"
                  class="!h-3.5 !w-3.5 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-0 py-0.5 leading-tight"
            >
              <p
                class="hyphens-auto break-words text-center text-[10px] font-extrabold leading-tight text-slate-900 sm:text-[11px] dark:text-slate-50"
              >
                {{ strategyLabel(riskPayload?.risk_response_type) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        class="grid grid-cols-1 gap-4 border-b border-slate-200/80 bg-white px-3 py-3 dark:border-darkmode-600 dark:bg-darkmode-800/40 md:grid-cols-2 md:items-start md:gap-x-4 md:gap-y-2"
      >
        <div class="min-w-0">
          <h3
            class="mb-2 border-s-[3px] border-primary pb-0.5 ps-2.5 text-[12px] font-bold text-slate-800 dark:text-slate-100"
          >
            {{ t('risk-operations.done-report-label-scenario') }}
          </h3>
          <p
            class="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-900 dark:text-slate-100"
          >
            {{ scenarioDisplay }}
          </p>
        </div>
        <div
          class="min-w-0 border-t border-slate-200/80 pt-4 dark:border-darkmode-600 md:border-t-0 md:border-l md:border-slate-200/80 md:pt-0 md:pl-4 dark:md:border-darkmode-600"
        >
          <h3
            class="mb-2 border-s-[3px] border-primary pb-0.5 ps-2.5 text-[12px] font-bold text-slate-800 dark:text-slate-100"
          >
            {{ t('risk-operations.todo-field-proposed-action') }}
          </h3>
          <p
            class="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-900 dark:text-slate-100"
          >
            {{ strOrDash(riskPayload?.risk_proposed_action) }}
          </p>
        </div>
      </section>
      </div>
    </template>
  </div>
</template>
