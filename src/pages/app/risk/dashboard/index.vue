<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { grcRepo } from '@/core/repositories/grcRepo';
import RiskDashboard from "@/pages/app/risk/dashboard/risk-dashboard/RiskDashboard.vue";

const { t } = useI18n();
const loading = ref(false);
const dashboardData = ref<Record<string, unknown> | null>(null);
const error = ref<string | null>(null);

async function loadDashboard() {
  loading.value = true;
  error.value = null;
  try {
    const res = await grcRepo.riskDashboard();
    if (res?.result) {
      dashboardData.value = res.data ?? null;
    } else {
      error.value = res?.error?.[0] ?? t('risk.dashboard-load-error');
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t('risk.dashboard-load-error');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboard();
});
</script>

<template>
  <div >
    <RiskDashboard />
  </div>
</template>
