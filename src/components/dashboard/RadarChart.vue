<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import "./echarts"
import { chartFont, tooltipStyle } from "./echarts"
import { toFa, withAlpha } from "./helpers"

export interface RadarSeries {
  name: string
  values: (number | null)[]
  color: string
  /** شفافیت سطح زیر منحنی (مثلاً 0.12) — بدون آن فقط خط رسم می‌شود */
  fillAlpha?: number
  /** خط چین برای سری مقایسه */
  dashed?: boolean
  /** رنگ هر نقطه (اختیاری) */
  pointColors?: string[]
}

const props = withDefaults(
  defineProps<{
    labels: string[]
    series: RadarSeries[]
    /** حداکثر محور رادار (مثلاً ۱۰۰) */
    max?: number
  }>(),
  { max: 100 },
)

const option = computed(() => ({
  tooltip: {
    trigger: "item",
    ...tooltipStyle,
    formatter: (p: { name: string; seriesName: string; value: number[] }) =>
      `${p.seriesName}<br/>${p.name}: ${toFa(p.value[0])} / ${toFa(props.max)}`,
  },
  legend: {
    bottom: 0,
    textStyle: { color: "#334155", fontFamily: chartFont },
    itemWidth: 10,
    itemHeight: 10,
  },
  radar: {
    indicator: props.labels.map((l) => ({ name: l, max: props.max })),
    radius: "62%",
    splitArea: { show: false },
    splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.25)" } },
    axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.25)" } },
    axisName: { color: "#334155", fontSize: 11, fontFamily: chartFont },
  },
  series: [
    {
      type: "radar",
      data: props.series.map((s) => ({
        value: s.values,
        name: s.name,
        lineStyle: {
          color: s.color,
          width: s.dashed ? 1.5 : 2,
          type: s.dashed ? "dashed" : "solid",
        },
        areaStyle: s.fillAlpha != null ? { color: withAlpha(s.color, s.fillAlpha) } : undefined,
        itemStyle: { color: s.pointColors ?? s.color },
      })),
    },
  ],
}))
</script>

<template>
  <VChart :option="option" autoresize class="h-full min-h-64 w-full" />
</template>
