<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps<{
  statusKey: string;
}>();

const { t } = useI18n();
</script>

<template>
  <p class="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
    {{ t('compliance-page.status-form-placeholder') }}
  </p>
</template>
