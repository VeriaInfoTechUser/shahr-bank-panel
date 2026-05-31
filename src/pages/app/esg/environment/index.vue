<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {useQuery} from "@core/composables";
import {esgRepo} from "@core/repositories/esgRepo";
import {onMounted, onUnmounted} from "vue";
const { t } = useI18n();


const {
  data: performanceData,
  isLoading,
  error,
  refetch,
  invalidate,
} = useQuery(
    ['esg-environment-list',],
    () => esgRepo.list({type:'domain',source:'environmental'}) ,
    {
      enabled: true,
      staleTime: 300000,
      refetchOnMount: true,
    }
);


onMounted(() => {
});

onUnmounted(() => {
  invalidate();
});

</script>

<template>
  <div class="mx-auto max-w-7xl px-1 pb-12 pt-2 md:px-2">
    <div class="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {{ t('menu.esg') }} - {{ t('menu.esg-environment') }}
      </h1>
      <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {{ t('general.no-data') }}
      </p>
    </div>
  </div>
</template>
