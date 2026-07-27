<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import Lucide from '@/base-components/Lucide';
import { reportRepo } from '@/core/repositories/reportRepo';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const slug = ref(String(route.params.slug ?? ''));
const dashboardData = ref<Record<string, unknown> | null>(null);
const loading = ref(true);

onMounted(async () => {
    try {
      const response = await reportRepo.getSustainabilityDashboard({ slug: slug.value });
      if (response.data?.result) {
        dashboardData.value = response.data.data;
      }
    } catch (error) {
      console.error('Failed to load sustainability dashboard:', error);
    } finally {
      loading.value = false;
    }
  });
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12 rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
      <div class="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-darkmode-700">
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700"
          @click="router.push({ name: 'app-reports-baseline' })"
        >
          <Lucide icon="ArrowRight" class="h-4 w-4" />
        </button>
        <div>
          <h1 class="text-base font-semibold text-slate-800 dark:text-slate-100">
            {{ t('reports.sustainability-dashboard') }}
          </h1>
          <p class="text-xs text-slate-400 dark:text-slate-500">
            {{ slug }}
          </p>
        </div>
      </div>
      <div class="p-6">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <Lucide icon="Loader2" class="h-6 w-6 animate-spin text-slate-400" />
        </div>
        <div v-else-if="dashboardData" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="(value, key) in dashboardData"
              :key="key"
              class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-darkmode-700 dark:bg-darkmode-800"
            >
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ key }}</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ value }}</p>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12">
          <Lucide icon="FileChartColumnIncreasing" class="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600" />
          <p class="mt-4 text-sm text-slate-400 dark:text-slate-500">
            {{ t('general.no-data') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>