import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { BarChart, PieChart, LineChart, HeatmapChart, ScatterChart } from "echarts/charts"
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  TitleComponent,
} from "echarts/components"

/**
 * ثبت ماژول‌های مورد نیاز ECharts.
 * کافی است این فایل یک‌بار از طریق هر کامپوننت چارت import شود.
 */
use([
  CanvasRenderer,
  BarChart,
  PieChart,
  LineChart,
  HeatmapChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  TitleComponent,
])

export const chartFont = "Vazirmatn, system-ui, sans-serif"
export const axisColor = "#475569"
export const labelColor = "#cbd5e1"
export const splitLineColor = "rgba(148, 163, 184, 0.12)"

export const tooltipStyle = {
  backgroundColor: "rgba(15, 23, 42, 0.95)",
  borderColor: "rgba(148, 163, 184, 0.2)",
  borderWidth: 1,
  textStyle: { color: "#e2e8f0", fontFamily: chartFont },
  extraCssText: "border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.4);",
}
