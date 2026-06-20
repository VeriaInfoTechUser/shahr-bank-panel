<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { grcRepo } from '@/core/repositories/grcRepo';

const { t } = useI18n();
const loading = ref(false);
const dashboardData = ref<Record<string, unknown> | null>(null);
const error = ref<string | null>(null);

async function loadDashboard() {
  loading.value = true;
  error.value = null;
  try {
    const res = await grcRepo.complianceDashboard();
    if (res?.result) {
      dashboardData.value = res.data ?? null;
    } else {
      error.value = res?.error?.[0] ?? t('compliance.dashboard-load-error');
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t('compliance.dashboard-load-error');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboard();
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-1 pb-12 pt-2 md:px-2">
    <div v-if="loading" class="flex items-center justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span>{{ error }}</span>
    </div>

    <pre v-else-if="dashboardData" class="bg-base-200 rounded-box p-4 text-sm overflow-auto">{{ JSON.stringify(dashboardData, null, 2) }}</pre>

    <div v-else class="text-center py-20 opacity-50">
      {{ t('common.no-data') }}
    </div>
  </div>
</template>
