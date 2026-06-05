<script setup>
defineProps({
  domains: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <div class="space-y-8">
    <div v-for="domain in domains" :key="domain.code"
         class="bg-white rounded-2xl shadow p-8">
      <div class="flex justify-between items-start mb-6">
        <h3 class="text-2xl font-bold">{{ domain.title }}</h3>
        <div class="text-right">
          <div class="text-emerald-600 font-semibold text-2xl">{{ domain.avg_score }}</div>
          <div class="text-sm text-gray-500">امتیاز دامنه</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="kpi in domain.kpis" :key="kpi.code"
             class="border border-gray-100 rounded-xl p-5 hover:border-emerald-200 transition-colors">
          <div class="text-sm text-gray-600 mb-1">{{ kpi.code }}</div>
          <div class="font-medium leading-tight">{{ kpi.title }}</div>
          <div class="mt-4 text-2xl font-bold text-gray-800">
            {{ kpi.value ?? '—' }}
            <span class="text-base font-normal text-gray-500">{{ kpi.unit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>