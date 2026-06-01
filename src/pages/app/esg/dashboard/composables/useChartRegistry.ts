import { defineAsyncComponent, Component } from 'vue';

export interface ChartComponentRegistry {
  EsgCompletionDonut: Component;
  EsgPillarCompare: Component;
  EsgRadarChart: Component;
  EsgBarMixedChart: Component;
}

export function useChartRegistry(): ChartComponentRegistry {
  return {
    EsgCompletionDonut: defineAsyncComponent(() =>
      import('../components/EsgCompletionDonut.vue')
    ),
    EsgPillarCompare: defineAsyncComponent(() =>
      import('../components/EsgPillarCompare.vue')
    ),
    EsgRadarChart: defineAsyncComponent(() =>
      import('../components/EsgRadarChart.vue')
    ),
    EsgBarMixedChart: defineAsyncComponent(() =>
      import('../components/EsgBarMixedChart.vue')
    ),
  };
}

export function getChartComponent(
  componentName: string,
  registry: ChartComponentRegistry
): Component | null {
  return (registry as any)[componentName] || null;
}
