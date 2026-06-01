<script setup lang="ts">
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { RadarChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, RadarComponent } from 'echarts/components';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

use([CanvasRenderer, RadarChart, TooltipComponent, LegendComponent, RadarComponent]);

interface Props {
  echarts_config?: Record<string, unknown>;
  indicators_i18n?: string[];
  rtl?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rtl: false,
});

const { t } = useI18n();

const chartOption = computed(() => {
  if (!props.echarts_config) return {};

  const config = JSON.parse(JSON.stringify(props.echarts_config));

  // Translate indicator names using i18n keys
  if (config.radar && config.radar.indicator && props.indicators_i18n) {
    config.radar.indicator.forEach((indicator: any, index: number) => {
      if (props.indicators_i18n && props.indicators_i18n[index]) {
        const i18nKey = props.indicators_i18n[index];
        if (i18nKey.startsWith('esg.')) {
          indicator.name = t(i18nKey);
        }
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
