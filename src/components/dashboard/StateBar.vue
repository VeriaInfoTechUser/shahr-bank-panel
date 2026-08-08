<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import "./echarts"
import { chartFont, tooltipStyle, splitLineColor } from "./echarts"
import { toFa } from "./helpers"

interface StateRow {
  state: string
  count: number
}

const props = withDefaults(
  defineProps<{
    data: StateRow[]
    /** برچسب فارسی هر وضعیت (state → عنوان) */
    labels: Record<string, string>
    /** رنگ هر وضعیت — از تم مرکزی */
    colors: Record<string, string>
    /** ترتیب نمایش دلخواه (اختیاری) */
    order?: string[]
    /** واژه مورد شمارش در تول‌تیپ (مورد / وظیفه / …) */
    itemWord?: string
  }>(),
  {
    order: undefined,
    itemWord: "مورد",
  },
)

const rows = computed(() => {
  if (!props.order) return [...props.data]
  const rank = (key: string) => {
    const i = props.order!.indexOf(key)
    return i === -1 ? props.order!.length : i
  }
  return [...props.data].sort((a, b) => rank(a.state) - rank(b.state))
})

const option = computed(() => ({
  grid: { top: 10, right: 16, bottom: 8, left: 8, containLabel: true },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    ...tooltipStyle,
    formatter: (p: { name: string; value: number }[]) =>
      `${p[0].name}<br/>${toFa(p[0].value)} ${props.itemWord}`,
  },
  xAxis: {
    type: "value",
    axisLabel: { color: "#64748b", fontFamily: chartFont },
    splitLine: { lineStyle: { color: splitLineColor } },
  },
  yAxis: {
    type: "category",
    inverse: true,
    data: rows.value.map((d) => props.labels[d.state]),
    axisLabel: { color: "#334155", fontFamily: chartFont },
    axisLine: { lineStyle: { color: "#cbd5e1" } },
    axisTick: { show: false },
  },
  series: [
    {
      type: "bar",
      barWidth: "55%",
      data: rows.value.map((d) => ({
        value: d.count,
        itemStyle: { color: props.colors[d.state], borderRadius: [0, 6, 6, 0] },
      })),
      label: {
        show: true,
        position: "right",
        color: "#334155",
        fontFamily: chartFont,
        formatter: (p: { value: number }) => toFa(p.value),
      },
    },
  ],
}))
</script>

<template>
  <VChart :option="option" autoresize class="h-full min-h-56 w-full" />
</template>
