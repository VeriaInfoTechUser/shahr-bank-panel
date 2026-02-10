<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="grid grid-cols-12 gap-6">
    <div class="col-span-12">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {{ t('menu.rules-regulations') }}
          </h2>
        </div>
      </div>
    </div>
  </div>
</template>
