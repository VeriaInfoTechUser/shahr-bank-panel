<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import Lucide from '@/base-components/Lucide';
import { grcHttp } from '@/core/api/grcHttp';
import { endpoints } from '@/core/api/endpoints';

const { t } = useI18n();
const route = useRoute();

const loading = ref(true);
const detail = ref<Record<string, unknown> | null>(null);

function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fa-IR');
  } catch {
    return iso;
  }
}

onMounted(async () => {
  const slug = route.params.slug as string;
  try {
    const res = await grcHttp.get(`${endpoints.rag.structuredData.list}/${slug}`);
    const body = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
    detail.value = (body?.data as Record<string, unknown>) ?? null;
  } catch {
    toast(t('structured-data.detail-load-error'), { type: 'error' });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12 rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Lucide icon="Loader2" class="h-6 w-6 animate-spin text-primary" />
      </div>

      <div v-else-if="detail">
        <h1 class="text-base font-semibold text-slate-800 dark:text-slate-100">
          {{ detail.title ?? '—' }}
        </h1>

        <div class="mt-4 space-y-3 text-sm">
          <div>
            <span class="text-xs text-slate-400 dark:text-slate-500">{{ t('structured-data.form-data') }}</span>
            <pre class="mt-1 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-xs text-slate-700 dark:bg-darkmode-700 dark:text-slate-300">{{ detail.data ?? '—' }}</pre>
          </div>

          <div v-if="detail.isConverted">
            <span class="text-xs text-slate-400 dark:text-slate-500">{{ t('structured-data.form-converted') }}</span>
            <pre class="mt-1 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-xs text-slate-700 dark:bg-darkmode-700 dark:text-slate-300">{{ detail.converted ?? '—' }}</pre>
          </div>

          <div v-if="detail.tags && (detail.tags as string[]).length">
            <span class="text-xs text-slate-400 dark:text-slate-500">{{ t('structured-data.form-tags') }}</span>
            <div class="mt-1 flex flex-wrap gap-1">
              <span
                v-for="tag in (detail.tags as string[])"
                :key="tag"
                class="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <div>
            <span class="text-xs text-slate-400 dark:text-slate-500">{{ t('structured-data.col-created-at') }}</span>
            <p class="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{{ formatDate(String(detail.createdAt ?? '')) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
