<template>
  <div class="bg-white p-8 rounded-2xl shadow-xl mb-12">
    <h3 class="text-xl font-semibold mb-6">نمودار مقایسه‌ای دامنه‌ها</h3>
    <VChart :option="chartOption" class="h-96" />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ data: Array })

const chartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  radar: {
    indicator: props.data.map(item => ({ name: item.domain, max: 100 }))
  },
  series: [{
    type: 'radar',
    data: [{
      value: props.data.map(item => item.score),
      name: 'امتیاز دامنه',
      areaStyle: { color: 'rgba(16, 185, 129, 0.2)' },
      lineStyle: { color: '#10b981' },
      itemStyle: { color: '#10b981' }
    }]
  }]
}))
</script>