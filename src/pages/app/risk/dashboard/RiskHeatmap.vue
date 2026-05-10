<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface HeatmapBand {
  name: string;
  color: string;
  from: number;
  to: number;
  [key: string]: unknown;
}

interface HeatmapRow {
  title: string;
  slug: string;
  [key: string]: unknown;
}

interface MatrixCell {
  impact: number;
  probability: number;
  score: number;
  value: number;
  color: string;
}

const props = defineProps<{
  rows: HeatmapRow[];
  bandKeys: string[];
  totalRow?: HeatmapRow | null;
}>();

const { t } = useI18n();

function getBandForScore(row: HeatmapRow, score: number): HeatmapBand | undefined {
  return props.bandKeys
    .map((key) => row[key] as HeatmapBand | undefined)
    .find((band) => band && score >= band.from && score <= band.to);
}

function buildMatrix(row: HeatmapRow) {
  return Array.from({ length: 5 }, (_, rowIndex) => {
    const impact = 5 - rowIndex;

    return {
      key: `impact-${impact}`,
      impact,
      cells: Array.from({ length: 5 }, (_, columnIndex): MatrixCell => {
        const probability = columnIndex + 1;
        const score = impact * probability;
        const band = getBandForScore(row, score);
        const value = band && typeof band[String(score)] === 'number' ? (band[String(score)] as number) : 0;

        return {
          impact,
          probability,
          score,
          value,
          color: band?.color || '#e5e7eb',
        };
      }),
    };
  });
}

const totalMatrix = computed(() => (props.totalRow ? buildMatrix(props.totalRow) : []));

const domainMatrices = computed(() =>
  props.rows
    .filter((row) => row.slug !== 'total')
    .map((row) => ({
      title: row.title,
      slug: row.slug,
      matrix: buildMatrix(row),
    }))
);
</script>

<template>
  <div class="space-y-6">


    <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
      <div class="mb-5">
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-50">
          {{ t('risk-dashboard.heatmap-title') }}
        </h3>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {{ t('risk-dashboard.heatmap-subtitle') }}
        </p>
      </div>

      <div v-if="totalMatrix.length > 0">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {{ t('risk-dashboard.total-heatmap-title') }}
          </h4>
          <span class="text-xs text-slate-500 dark:text-slate-400">
            {{ t('risk-dashboard.total-heatmap-subtitle') }}
          </span>
        </div>

        <div class="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 dark:border-darkmode-700 dark:bg-darkmode-900/40">
          <div dir="ltr" class="grid grid-cols-5 ">
            <template v-for="row in totalMatrix" :key="row.key">
              <div
                v-for="cell in row.cells"
                :key="`${row.key}-${cell.probability}`"
                class="flex aspect-square min-h-[40px] max-h-[50px] w-full items-center justify-center border border-white/70 text-center shadow-sm dark:border-darkmode-800/30"
                :style="{ backgroundColor: cell.color }"
              >
                <div>
                  <div class="text-base font-extrabold text-slate-900 sm:text-lg">
                    {{ cell.value }}
                  </div>
                  <div class="  text-[9px] font-semibold text-slate-800/75">
                    {{ cell.score }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>



    <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
      <h4 class="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-50">
        {{ t('risk-dashboard.domain-heatmaps-title') }}
      </h4>

      <div class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="row in domainMatrices"
          :key="row.slug"
          class="rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 dark:border-darkmode-700 dark:bg-darkmode-900/40"
        >
          <div class="mb-4">
            <h5 class="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {{ row.title }}
            </h5>
          </div>

          <div dir="ltr" class="grid grid-cols-5">
            <template v-for="matrixRow in row.matrix" :key="`${row.slug}-${matrixRow.key}`">
              <div
                v-for="cell in matrixRow.cells"
                :key="`${row.slug}-${matrixRow.key}-${cell.probability}`"
                class="flex aspect-square min-h-[30] max-h-[35px] w-full items-center justify-center border border-white/70 text-center shadow-sm dark:border-darkmode-800/30"
                :style="{ backgroundColor: cell.color }"
              >
                <div class="p-1">
                  <div class="text-sm font-bold text-slate-900">
                    {{ cell.value }}
                  </div>
                  <div class="text-[9px] font-semibold text-slate-800/75">
                    {{ cell.score }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
