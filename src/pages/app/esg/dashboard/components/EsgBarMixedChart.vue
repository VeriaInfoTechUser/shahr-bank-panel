<script setup lang="ts">
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

use([CanvasRenderer, BarChart, LineChart, TooltipComponent, LegendComponent, GridComponent]);

interface Props {
  echarts_config?: Record<string, unknown>;
  rtl?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rtl: false,
});

const { t } = useI18n();

const chartOption = computed(() => {
  if (!props.echarts_config) return {};

  const config = JSON.parse(JSON.stringify(props.echarts_config));

  // Translate xAxis labels
  if (config.xAxis && config.xAxis.data) {
    config.xAxis.data = config.xAxis.data.map((label: string) =>
      label.startsWith('esg.') ? t(label) : label
    );
  }

  // Translate yAxis labels
  if (config.yAxis && config.yAxis.data) {
    config.yAxis.data = config.yAxis.data.map((label: string) =>
      label.startsWith('esg.') ? t(label) : label
    );
  }

  // Translate series names
  if (config.series && Array.isArray(config.series)) {
    config.series.forEach((s: any) => {
      if (s.name && s.name.startsWith('esg.')) {
        s.name = t(s.name);
      }
      if (s.data && Array.isArray(s.data)) {
        s.data.forEach((item: any) => {
          if (item.name && item.name.startsWith('esg.')) {
            item.name = t(item.name);
          }
        });
      }
    });
  }

  return config;
});
</script>

<template>
  <div class="w-full h-full">
    <VChart :option="chartOption" autoresize />
  </div>
</template>

<style scoped>
:deep(.echarts-container) {
  width: 100% !important;
  height: 100% !important;
}
</style>
