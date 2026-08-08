import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import {
  BarChart,
  PieChart,
  LineChart,
  HeatmapChart,
  ScatterChart,
  RadarChart,
} from "echarts/charts"
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  TitleComponent,
  RadarComponent,
  DataZoomComponent,
} from "echarts/components"

/**
 * ثبت ماژول‌های مورد نیاز ECharts — مشترک بین همه داشبوردها.
 * کافی است این فایل یک‌بار از طریق هر کامپوننت چارت import شود.
 */
use([
  CanvasRenderer,
  BarChart,
  PieChart,
  LineChart,
  HeatmapChart,
  ScatterChart,
  RadarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  TitleComponent,
  RadarComponent,
  DataZoomComponent,
])

export const chartFont = "Vazirmatn, system-ui, sans-serif"
export const axisColor = "#64748b"
export const labelColor = "#334155"
export const splitLineColor = "rgba(148, 163, 184, 0.25)"

export const tooltipStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  borderColor: "rgba(148, 163, 184, 0.3)",
  borderWidth: 1,
  textStyle: { color: "#1e293b", fontFamily: chartFont },
  extraCssText: "border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.1);",
}
