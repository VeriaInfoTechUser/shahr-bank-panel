<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { esgRepo } from '@/core/repositories/esgRepo'
import ReportPdfContainer from './ReportPdfContainer.vue'

const { t } = useI18n()
const response = ref<any | null>(null)
const loading = ref<boolean>(true)
const error = ref<string | null>(null)

async function loadReport() {
  loading.value = true
  error.value = null
  try {
    response.value = await esgRepo.report({})
  } catch (err) {
    console.error(err)
    error.value = (err as Error)?.message || t('esg.report.download.error')
  } finally {
    loading.value = false
  }
}

onMounted(loadReport)
</script>

<template>
  <div>
    <div v-if="loading" class="py-12 text-center">{{ t('general.loading') }}</div>
    <div v-else-if="error" class="py-12 text-center text-red-600">{{ error }}</div>
    <ReportPdfContainer v-else :response="response" />
  </div>
</template>
