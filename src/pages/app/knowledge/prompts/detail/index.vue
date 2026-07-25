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

const typeLabels: Record<string, string> = {
  'structure-data': 'داده ساخت‌یافته',
  agent: 'عامل',
};

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
    const res = await grcHttp.get(`${endpoints.rag.prompts.list}/${slug}`);
    const body = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
    detail.value = (body?.data as Record<string, unknown>) ?? null;
  } catch {
    toast(t('prompts.detail-load-error'), { type: 'error' });
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

        <div class="mt-4 space-y-4 text-sm">
          <div>
            <span class="text-xs text-slate-400 dark:text-slate-500">{{ t('prompts.form-summary') }}</span>
            <p class="mt-1 text-xs text-slate-700 dark:text-slate-300">{{ detail.summary ?? '—' }}</p>
          </div>

          <div>
            <span class="text-xs text-slate-400 dark:text-slate-500">{{ t('prompts.form-type') }}</span>
            <p class="mt-1 text-xs text-slate-700 dark:text-slate-300">{{ typeLabels[String(detail.type ?? '')] ?? detail.type ?? '—' }}</p>
          </div>

          <div>
            <span class="text-xs text-slate-400 dark:text-slate-500">{{ t('prompts.form-text') }}</span>
            <pre class="mt-1 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-xs text-slate-700 dark:bg-darkmode-700 dark:text-slate-300">{{ detail.text ?? '—' }}</pre>
          </div>

          <div>
            <span class="text-xs text-slate-400 dark:text-slate-500">{{ t('prompts.col-created-at') }}</span>
            <p class="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{{ formatDate(String(detail.createdAt ?? '')) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
