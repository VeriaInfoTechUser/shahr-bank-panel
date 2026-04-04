<script setup lang="ts">
/**
 * همان بلوک «گزارش ارزیابی ریسک» در RiskStatusDoneReviewView — فقط نمایش.
 */
import { computed, onMounted, ref, withDefaults } from 'vue';
import { useI18n } from 'vue-i18n';
import { ermRepo } from '@/core/repositories/ermRepo';
import { isPersianDigitLocale, toPersianDigits } from '@/utils/persianDigits';
import moment from 'moment-jalaali';
import Lucide from '@/base-components/Lucide';

const props = withDefaults(
  defineProps<{
    /** آبجکت ریسک/پیشرفت (همان فیلدهای ردیف لیست) */
    risk: Record<string, unknown>;
    /** نام مجری برای هدر (اختیاری) */
    userLabel?: string | null;
    /** غیرفعال‌نما — وقتی ریسک هنوز تأیید نشده */
    disabled?: boolean;
  }>(),
  {
    disabled: false,
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
            class="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400"
          >
            <span
              class="font-medium text-slate-400 dark:text-slate-500"
            >{{ t('risk-operations.modal-risk-executor-label') }}:</span>
            {{ userLabel }}
          </p>
        </div>
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

      <section class="bg-white px-3 py-2 dark:bg-darkmode-800/40">
        <div class="grid grid-cols-2 gap-1.5 md:grid-cols-5 md:gap-2">
          <div
            class="flex aspect-square min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200/75 bg-white p-2 dark:border-darkmode-600 dark:bg-darkmode-800/50"
          >
            <div class="flex shrink-0 items-center justify-between gap-2">
              <span
                class="min-w-0 flex-1 truncate text-[11px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.todo-field-intensity') }}</span>
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
              >
                <Lucide
                  icon="Gauge"
                  class="!h-5 !w-5 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 flex-col items-center justify-center px-0.5"
            >
              <p
                class="text-center text-xl font-extrabold tabular-nums leading-none tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50"
              >
                {{ strOrDash(riskPayload?.risk_intensity) }}
              </p>
            </div>
          </div>

          <div
            class="flex aspect-square min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200/75 bg-white p-2 dark:border-darkmode-600 dark:bg-darkmode-800/50"
          >
            <div class="flex shrink-0 items-center justify-between gap-2">
              <span
                class="min-w-0 flex-1 truncate text-[11px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.todo-field-effect') }}</span>
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200"
              >
                <Lucide
                  icon="Target"
                  class="!h-5 !w-5 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 flex-col items-center justify-center px-0.5"
            >
              <p
                class="text-center text-xl font-extrabold tabular-nums leading-none tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50"
              >
                {{ strOrDash(riskPayload?.risk_effect) }}
              </p>
            </div>
          </div>

          <div
            class="flex aspect-square min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200/75 bg-white p-2 dark:border-darkmode-600 dark:bg-darkmode-800/50"
          >
            <div class="flex shrink-0 items-center justify-between gap-2">
              <span
                class="min-w-0 flex-1 truncate text-[11px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.done-report-col-risk-value') }}</span>
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
              >
                <Lucide
                  icon="ShieldAlert"
                  class="!h-5 !w-5 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 flex-col items-center justify-center px-0.5"
            >
              <span
                v-if="riskScoreVisual"
                class="inline-flex min-h-[2.25rem] min-w-[2.5rem] items-center justify-center rounded-xl px-2 text-lg font-extrabold tabular-nums leading-none shadow-inner sm:text-xl"
                :style="{
                  backgroundColor: riskScoreVisual.bg,
                  color: riskScoreVisual.fg,
                  border: `1px solid ${riskScoreVisual.border}`,
                }"
              >{{ riskScoreVisual.score }}</span>
              <span
                v-else
                class="text-xl font-extrabold text-slate-300 dark:text-slate-600"
              >—</span>
            </div>
          </div>

          <div
            class="flex aspect-square min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200/75 bg-white p-2 dark:border-darkmode-600 dark:bg-darkmode-800/50"
          >
            <div class="flex shrink-0 items-center justify-between gap-2">
              <span
                class="min-w-0 flex-1 truncate text-[11px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.todo-field-execution-percent') }}</span>
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
              >
                <Lucide
                  icon="Percent"
                  class="!h-5 !w-5 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 flex-col items-center justify-center px-0.5"
            >
              <p
                class="text-center text-xl font-extrabold tabular-nums leading-none tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50"
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
            class="col-span-2 flex aspect-square min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200/75 bg-white p-2 dark:border-darkmode-600 dark:bg-darkmode-800/50 md:col-span-1"
          >
            <div class="flex shrink-0 items-center justify-between gap-2">
              <span
                class="min-w-0 flex-1 truncate text-[11px] font-extrabold uppercase leading-tight tracking-wide text-slate-800 dark:text-slate-100"
              >{{ t('risk-operations.todo-field-strategy') }}</span>
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200"
              >
                <Lucide
                  icon="Compass"
                  class="!h-5 !w-5 stroke-[2]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div
              class="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-0.5"
            >
              <p
                class="hyphens-auto break-words text-center text-[12px] font-extrabold leading-snug text-slate-900 sm:text-[13px] dark:text-slate-50"
              >
                {{ strategyLabel(riskPayload?.risk_response_type) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="border-b border-slate-200/80 bg-white px-3 py-3 dark:border-darkmode-600 dark:bg-darkmode-800/40">
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
      </section>

      <section class="bg-white px-3 py-3 dark:bg-darkmode-800/40">
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
      </section>
      </div>
    </template>
  </div>
</template>
