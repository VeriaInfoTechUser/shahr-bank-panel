<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
    <div class="bg-white p-6 rounded-xl shadow">
      <div class="text-emerald-600 text-sm font-medium">KPIهای پاسخ‌داده‌شده</div>
      <div class="text-4xl font-bold mt-2">{{ summary.answered }} / {{ summary.total_kpis }}</div>
    </div>
    <div class="bg-white p-6 rounded-xl shadow">
      <div class="text-emerald-600 text-sm font-medium">درصد تکمیل</div>
      <div class="text-4xl font-bold mt-2">{{ summary.completion }}%</div>
    </div>
    <div class="bg-white p-6 rounded-xl shadow">
      <div class="text-emerald-600 text-sm font-medium">امتیاز میانگین</div>
      <div class="text-4xl font-bold mt-2">{{ summary.avg_score }}</div>
    </div>
  </div>
</template>