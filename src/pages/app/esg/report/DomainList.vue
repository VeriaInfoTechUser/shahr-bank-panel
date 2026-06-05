<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{ domains: any[] }>(), { domains: [] })
const openTables = ref<Record<string, boolean>>({})
function toggleTable(slug: string) {
  openTables.value[slug] = !openTables.value[slug]
}
</script>

<template>
  <div class="space-y-8">
    <div v-for="domain in domains" :key="domain.code"
         class="bg-white rounded-2xl shadow p-8 page-section">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-2xl font-bold">{{ domain.title }}</h3>
          <p class="text-sm text-gray-500 mt-1">{{ domain.description }}</p>
        </div>
        <div class="text-right">
          <div class="text-emerald-600 font-semibold text-2xl">{{ domain.avg_score }}</div>
          <div class="text-sm text-gray-500">امتیاز دامنه</div>
          <div class="mt-3">
            <button @click="toggleTable(domain.slug)"
                    class="px-3 py-1 text-xs bg-slate-100 rounded-md hover:bg-slate-200">
              {{ openTables[domain.slug] ? 'نمایش کارت‌ها' : 'نمایش جدول' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="!openTables[domain.slug]" class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div v-else class="overflow-auto mt-4">
        <table class="min-w-full">
          <thead>
            <tr>
              <th class="text-right px-3 py-2">کد</th>
              <th class="text-right px-3 py-2">عنوان</th>
              <th class="text-right px-3 py-2">مقدار</th>
              <th class="text-right px-3 py-2">واحد</th>
              <th class="text-right px-3 py-2">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="kpi in domain.kpis" :key="kpi.code">
              <td class="px-3 py-2 text-right">{{ kpi.code }}</td>
              <td class="px-3 py-2 text-right">{{ kpi.title }}</td>
              <td class="px-3 py-2 text-right">{{ kpi.value ?? '—' }}</td>
              <td class="px-3 py-2 text-right">{{ kpi.unit ?? '-' }}</td>
              <td class="px-3 py-2 text-right">{{ kpi.status ?? '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>