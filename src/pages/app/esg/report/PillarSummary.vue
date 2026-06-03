<template>
  <div class="bg-white rounded-2xl p-7 shadow">
    <div class="text-4xl mb-4">{{ pillar.icon || '📊' }}</div>
    <h3 class="font-bold text-xl mb-4">{{ pillar.title }}</h3>
    <div class="space-y-4">
      <div class="flex justify-between">
        <span class="text-gray-600">امتیاز</span>
        <span class="font-semibold">{{ pillar.summary.avg_score }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-600">تکمیل</span>
        <span class="font-semibold">{{ pillar.summary.completion }}%</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-600">KPI پاسخ داده شده</span>
        <span class="font-semibold">{{ pillar.summary.answered }} / {{ pillar.summary.total_kpis }}</span>
      </div>
    </div>
  </div>
</template>