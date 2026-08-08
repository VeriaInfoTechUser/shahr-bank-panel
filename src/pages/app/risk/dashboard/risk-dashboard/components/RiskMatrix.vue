<script setup lang="ts">
import { computed } from "vue"
import { toFa, withAlpha } from "../helpers"
import { theme } from "@/config/theme"
import type { MatrixCell } from "../types"

const props = defineProps<{ data: MatrixCell[] }>()

const likelihoodLabels = ["خیلی کم", "کم", "متوسط", "زیاد", "خیلی زیاد"]
const impactLabels = ["ناچیز", "جزئی", "متوسط", "عمده", "فاجعه‌بار"]

const impacts = [5, 4, 3, 2, 1]
const likelihoods = [1, 2, 3, 4, 5]

const maxCount = computed(() => Math.max(1, ...props.data.map((d) => d.count)))

function cellOf(impact: number, likelihood: number): MatrixCell | undefined {
  return props.data.find((d) => d.impact === impact && d.likelihood === likelihood)
}

/** رنگ پایه سلول بر اساس حاصل‌ضرب احتمال × اثر — از سطوح ریسک تم مرکزی */
function baseColor(score: number): string {
  if (score >= 15) return theme.status.critical
  if (score >= 10) return theme.status.high
  if (score >= 5) return theme.status.medium
  return theme.status.low
}

function cellStyle(impact: number, likelihood: number) {
  const cell = cellOf(impact, likelihood)
  const count = cell?.count ?? 0
  const color = baseColor(impact * likelihood)
  const intensity = count === 0 ? 0.08 : 0.28 + (count / maxCount.value) * 0.6
  return {
    backgroundColor: withAlpha(color, intensity),
    borderColor: withAlpha(color, count === 0 ? 0.15 : 0.5),
    color: count === 0 ? "#94a3b8" : "#0f172a",
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex min-h-0 flex-1 items-stretch">
      <!-- ستون برچسب اثر -->
      <div class="flex w-10 shrink-0 flex-col justify-between py-0.5 pl-2 text-left">
        <span
          v-for="(impact, i) in impacts"
          :key="impact"
          class="flex items-center text-[11px] leading-tight text-slate-500"
        >
          {{ impactLabels[impact - 1] }}
        </span>
      </div>

      <!-- شبکه سلول‌ها -->
      <div class="flex min-h-0 flex-1 flex-col">
        <div
          v-for="impact in impacts"
          :key="impact"
          class="grid min-h-0 flex-1 grid-cols-5 gap-1.5"
        >
          <div
            v-for="likelihood in likelihoods"
            :key="likelihood"
            class="flex min-h-9 items-center justify-center rounded-md border text-sm font-bold transition"
            :style="cellStyle(impact, likelihood)"
            :title="`اثر ${impact} × احتمال ${likelihood}`"
          >
            {{ cellOf(impact, likelihood)?.count ? toFa(cellOf(impact, likelihood)!.count) : "" }}
          </div>
        </div>

        <!-- برچسب احتمال -->
        <div class="grid shrink-0 grid-cols-5 gap-1.5 pt-1">
          <span
            v-for="likelihood in likelihoods"
            :key="likelihood"
            class="text-center text-[11px] leading-tight text-slate-500"
          >
            {{ likelihoodLabels[likelihood - 1] }}
          </span>
        </div>
      </div>
    </div>

    <div class="mt-3 flex shrink-0 items-center justify-center gap-4 text-[11px] text-slate-500">
      <span class="flex items-center gap-1">
        <span class="h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: theme.status.low }" /> کم‌خطر
      </span>
      <span class="flex items-center gap-1">
        <span class="h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: theme.status.medium }" /> متوسط
      </span>
      <span class="flex items-center gap-1">
        <span class="h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: theme.status.high }" /> بالا
      </span>
      <span class="flex items-center gap-1">
        <span class="h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: theme.status.critical }" /> بحرانی
      </span>
    </div>
  </div>
</template>
