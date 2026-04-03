<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="mt-4 border-t border-slate-200 pt-3 dark:border-darkmode-600">
    <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
      {{ t('compliance-page.doing-parent-body') }}
    </p>
  </div>
</template>
