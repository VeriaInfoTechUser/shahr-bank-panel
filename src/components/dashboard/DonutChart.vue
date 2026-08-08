<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import "./echarts"
import { chartFont, tooltipStyle } from "./echarts"
import { toFa } from "./helpers"

interface DonutRow {
  key: string
  count: number
}

const props = withDefaults(
  defineProps<{
    data: DonutRow[]
    /** برچسب فارسی هر بخش (key → عنوان) */
    labels: Record<string, string>
    /** رنگ هر بخش — از تم مرکزی */
    colors: Record<string, string>
    /** ترتیب نمایش دلخواه (اختیاری) */
    order?: string[]
    /** واژه مورد شمارش در تول‌تیپ (مورد / وظیفه / …) */
    itemWord?: string
    /** عنوان مرکز دونات */
    centerLabel?: string
  }>(),
  {
    order: undefined,
    itemWord: "مورد",
    centerLabel: "کل",
  },
)

const total = computed(() => props.data.reduce((s, d) => s + d.count, 0))

const sorted = computed(() => {
  if (!props.order) return [...props.data]
  const rank = (key: string) => {
    const i = props.order!.indexOf(key)
    return i === -1 ? props.order!.length : i
  }
  return [...props.data].sort((a, b) => rank(a.key) - rank(b.key))
})

const option = computed(() => ({
  tooltip: {
    trigger: "item",
    ...tooltipStyle,
    formatter: (p: { name: string; value: number; percent: number }) =>
      `${p.name}<br/>${toFa(p.value)} ${props.itemWord} (${toFa(p.percent)}٪)`,
  },
  legend: {
    bottom: 0,
    textStyle: { color: "#334155", fontFamily: chartFont },
    itemWidth: 10,
    itemHeight: 10,
  },
  series: [
    {
      type: "pie",
      radius: ["52%", "75%"],
      center: ["50%", "44%"],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: "#ffffff", borderWidth: 2, borderRadius: 6 },
      label: { show: false },
      data: sorted.value.map((d) => ({
        value: d.count,
        name: props.labels[d.key],
        itemStyle: { color: props.colors[d.key] },
      })),
    },
  ],
}))
</script>

<template>
  <div class="relative">
    <VChart :option="option" autoresize class="h-full min-h-56 w-full" />
    <div class="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 text-center">
      <p class="text-2xl font-extrabold text-slate-900">{{ toFa(total) }}</p>
      <p class="text-xs text-slate-500">{{ centerLabel }}</p>
    </div>
  </div>
</template>
