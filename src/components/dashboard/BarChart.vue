<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import "./echarts"
import { chartFont, tooltipStyle, splitLineColor } from "./echarts"
import { toFa } from "./helpers"

export interface BarSeries {
  name?: string
  values: (number | null)[]
  /** یک رنگ ثابت یا آرایه رنگ به ازای هر مقدار */
  color?: string | string[]
  borderColor?: string | string[]
  barWidth?: number | string
  /** فاصله بین سری‌های گروهی (مثلاً "10%") */
  barGap?: string | number
  /** رسم برچسب مقدار روی میله‌ها (پیش‌فرض true) */
  valueLabels?: boolean
  /** انباشته کردن سری‌ها روی هم (مناسب «میله انباشته») */
  stack?: boolean
  /** برچسب داخل میله (سفید پررنگ — مناسب بخش‌های میله انباشته) */
  labelInside?: boolean
  /** نمایش ندادن برچسب برای مقدار صفر (مناسب انباشته) */
  labelHideZero?: boolean
}

const props = withDefaults(
  defineProps<{
    labels: string[]
    series: BarSeries[]
    /** چارت افقی (میله‌های ردیفی) یا عمودی */
    horizontal?: boolean
    /** ترتیب ردیف‌ها در چارت افقی — true یعنی اولین داده بالا (پیش‌فرض) */
    inverse?: boolean
    showLegend?: boolean
    /** حداکثر محور مقدار (مثلاً ۱۰۰ برای امتیاز) */
    max?: number
    /** پسوند تول‌تیپ بعد از مقدار (مثلاً « / 100» یا «٪») */
    tooltipSuffix?: string
    /** پسوند برچسب محور مقدار (مثلاً «٪») */
    axisSuffix?: string
    /** بریدن برچسب‌های بلند محور دسته با این عرض پیکسلی */
    truncateLabels?: number
    /** رنگ برچسب مقدار به ازای هر آیتم (اختیاری) */
    labelColors?: (string | null)[]
    /** اسکرول و زوم محور دسته‌ها (dataZoom — اسلایدر + چرخ موس) */
    zoom?: boolean
    /** حداکثر دسته‌های قابل نمایش هم‌زمان وقتی zoom فعال است */
    zoomLimit?: number
  }>(),
  {
    horizontal: false,
    inverse: true,
    showLegend: false,
    max: undefined,
    tooltipSuffix: "",
    axisSuffix: "",
    truncateLabels: undefined,
    labelColors: undefined,
    zoom: false,
    zoomLimit: 12,
  },
)

const option = computed(() => {
  const radius = props.horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]
  const position = props.horizontal ? "right" : "top"
  const labelColorOf = (i: number) => props.labelColors?.[i] ?? "#334155"
  const axisLabelFormatter = props.axisSuffix ? `{value}${props.axisSuffix}` : undefined
  const categoryLabel = {
    color: "#334155",
    fontFamily: chartFont,
    interval: 0,
    rotate: props.horizontal ? 0 : props.labels.some((l) => l.length > 10) ? 18 : 0,
    ...(props.truncateLabels
      ? { width: props.truncateLabels, overflow: "truncate" as const }
      : {}),
  }

  // ---------- dataZoom (اسکرول + زوم محور دسته‌ها) ----------
  const zoomLimit = props.zoomLimit ?? 12
  const zoomEnabled = !!props.zoom && props.labels.length > zoomLimit
  const zoomEnd = Math.min(100, Math.max(15, Math.round((zoomLimit / Math.max(1, props.labels.length)) * 100)))
  const zoomAxisIndex = props.horizontal ? 1 : 0
  const zoomAxisKey = props.horizontal ? "yAxisIndex" : "xAxisIndex"
  const dataZoom = zoomEnabled
    ? [
        {
          type: "slider" as const,
          [zoomAxisKey]: zoomAxisIndex,
          start: 0,
          end: zoomEnd,
          height: props.horizontal ? undefined : 14,
          width: props.horizontal ? 14 : undefined,
          right: props.horizontal ? 0 : undefined,
          bottom: props.horizontal ? undefined : 0,
          borderColor: "transparent",
          backgroundColor: "#f1f5f9",
          fillerColor: "rgba(15, 118, 110, 0.15)",
          moveHandleStyle: { color: "#0f766e", opacity: 0.2 },
          handleStyle: { color: "#0f766e", borderColor: "#0f766e" },
          textStyle: { color: "#64748b", fontFamily: chartFont, fontSize: 10 },
        },
        {
          type: "inside" as const,
          [zoomAxisKey]: zoomAxisIndex,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
        },
      ]
    : undefined

  return {
    grid: {
      top: 16,
      right: zoomEnabled && props.horizontal ? 24 : 16,
      bottom: zoomEnabled && !props.horizontal ? 40 : 8,
      left: 8,
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...tooltipStyle,
      formatter: (p: { name: string; seriesName: string; value: number }[]) => {
        const rows = p
          .filter((r) => r.value != null)
          .map(
            (r) => `${r.seriesName ? `${r.seriesName}: ` : ""}${toFa(r.value)}${props.tooltipSuffix}`,
          )
        return `${p[0].name}<br/>${rows.join("<br/>")}`
      },
    },
    legend: {
      show: props.showLegend,
      bottom: zoomEnabled && !props.horizontal ? 24 : 0,
      textStyle: { color: "#334155", fontFamily: chartFont },
      itemWidth: 10,
      itemHeight: 10,
    },
    dataZoom,
    xAxis: props.horizontal
      ? {
          type: "value",
          min: 0,
          max: props.max,
          axisLabel: { color: "#64748b", fontFamily: chartFont, formatter: axisLabelFormatter },
          splitLine: { lineStyle: { color: splitLineColor } },
        }
      : {
          type: "category",
          data: props.labels,
          axisLabel: categoryLabel,
          axisLine: { lineStyle: { color: "#cbd5e1" } },
          axisTick: { show: false },
        },
    yAxis: props.horizontal
      ? {
          type: "category",
          inverse: props.inverse,
          data: props.labels,
          axisLabel: { ...categoryLabel, rotate: 0 },
          axisLine: { lineStyle: { color: "#cbd5e1" } },
          axisTick: { show: false },
        }
      : {
          type: "value",
          min: 0,
          max: props.max,
          axisLabel: { color: "#64748b", fontFamily: chartFont, formatter: axisLabelFormatter },
          splitLine: { lineStyle: { color: splitLineColor } },
        },
    series: props.series.map((s) => {
      const inside = s.labelInside
      return {
        name: s.name,
        type: "bar",
        stack: s.stack ? "total" : undefined,
        barWidth: s.barWidth,
        barGap: s.barGap,
        emphasis: s.stack ? { focus: "series" } : undefined,
        data: s.values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: Array.isArray(s.color) ? s.color[i] : s.color,
            borderColor: Array.isArray(s.borderColor) ? s.borderColor[i] : s.borderColor,
            borderWidth: s.borderColor ? 1.5 : 0,
            /* میله انباشته گردگوشه داخلی نمی‌خواهد (فقط انتهای آخرین بخش) */
            borderRadius: s.stack ? 0 : radius,
          },
        })),
        label: {
          show: s.valueLabels !== false,
          position: inside ? "inside" : position,
          color: inside ? "#ffffff" : (p: { dataIndex: number }) => labelColorOf(p.dataIndex),
          fontWeight: inside ? "bold" : undefined,
          fontFamily: chartFont,
          formatter: (p: { value: number }) => {
            if (s.labelHideZero && !p.value) return ""
            return toFa(p.value)
          },
        },
      }
    }),
  }
})
</script>

<template>
  <VChart :option="option" autoresize class="h-full min-h-48 w-full" />
</template>
