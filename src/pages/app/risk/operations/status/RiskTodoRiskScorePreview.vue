<script setup lang="ts">
import { computed } from 'vue';
import { useFormValues } from 'vee-validate';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const values = useFormValues();

function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

/** ۱ سبز پررنگ → وسط مایل زرد → ۲۵ قرمز پررنگ */
function riskPalette(score: number): { h: number; s: number; l: number } {
  const t = (score - 1) / 24;
  if (t <= 0.5) {
    const k = t * 2;
    return {
      h: lerp(142, 43, k),
      s: lerp(72, 96, k),
      l: lerp(22, 52, k),
    };
  }
  const k = (t - 0.5) * 2;
  return {
    h: lerp(43, 0, k),
    s: lerp(96, 72, k),
    l: lerp(52, 34, k),
  };
}

function hslCss(p: { h: number; s: number; l: number }): string {
  return `hsl(${Math.round(p.h)} ${Math.round(p.s)}% ${Math.round(p.l)}%)`;
}

/** متن روشن روی پس‌زمینهٔ تیره؛ متن تیره روی زرد روشن */
function textOnRiskBg(lightness: number): string {
  return lightness < 48 ? 'rgb(255 255 255)' : 'rgb(15 23 42)';
}

const score = computed(() => {
  const rawI = values.value.risk_intensity;
  const rawE = values.value.risk_effect;
  if (rawI == null || rawI === '' || rawE == null || rawE === '') return null;
  const ni = Number(rawI);
  const ne = Number(rawE);
  if (!Number.isFinite(ni) || !Number.isFinite(ne)) return null;
  if (ni < 1 || ni > 5 || ne < 1 || ne > 5) return null;
  return ni * ne;
});

const palette = computed(() =>
  score.value != null ? riskPalette(score.value) : null
);

const bgColor = computed(() =>
  palette.value ? hslCss(palette.value) : 'transparent'
);

const textColor = computed(() =>
  palette.value ? textOnRiskBg(palette.value.l) : 'inherit'
);

const borderColor = computed(() => {
  if (!palette.value) return 'transparent';
  const p = { ...palette.value, l: Math.max(12, palette.value.l - 8) };
  return hslCss(p);
});
</script>

<template>
  <div
    v-if="score != null"
    class="md:col-span-2 flex items-center justify-center rounded-md border px-2 py-1 text-center text-sm font-semibold tabular-nums leading-tight shadow-sm transition-[background-color,color,border-color] duration-200"
    :style="{
      backgroundColor: bgColor,
      color: textColor,
      borderColor: borderColor,
    }"
  >
    {{ t('risk-operations.todo-risk-score-display', { n: score }) }}
  </div>
</template>
