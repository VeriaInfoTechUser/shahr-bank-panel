

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@/core/composables/useQuery';
import { userRepo } from '@/core/repositories/userRepo';
import Lucide from '@/base-components/Lucide/Lucide.vue';
import Button from '@/base-components/Button';

interface HistoryItem {
  id: number;
  user_id: number;
  user_identity: string;
  user_name: string;
  user_email: string;
  user_mobile: string | null;
  operator_id: number;
  operator_identity: string;
  operator_name: string;
  operator_email: string;
  operator_mobile: string;
  time_create: number;
  state: string;
  information: {
    request: Record<string, unknown>;
    account: Record<string, unknown>;
    ip: string;
    method: string;
  };
  time_create_view: string;
}

interface HistoryResponse {
  result: boolean;
  data: {
    list: HistoryItem[];
    paginator: {
      count: number;
      limit: number;
      page: number;
    };
  };
  error: unknown[];
}

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();
const isOpen = computed({
  get: () => props.open,
  set: (value) => {
    if (!value) emit('close');
  },
});

const {
  data: historyData,
  isLoading,
  error,
  refetch,
  invalidate,
} = useQuery(
  ['user-profile-history'],
  () => userRepo.getProfileHistory({ page: 1, limit: 10 }) as Promise<HistoryResponse>,
  {
    enabled: props.open,
    staleTime: 0,
    refetchOnMount: true,
  }
);

const historyList = computed(() => historyData.value?.data?.list || []);
const totalItems = computed(() => historyData.value?.data?.paginator?.count || 0);

function getStateIcon(state: string) {
  return state === 'login' ? 'LogIn' : 'LogOut';
}

function getStateColor(state: string) {
  return state === 'login' 
    ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/15'
    : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/15';
}

function close() {
  emit('close');
}
watch(() => props.open, (val) => {
  if (val) {
    invalidate();
    refetch();
  }
});
</script>


<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 dark:bg-black/60"
        @click.self="close"
      >
        <div
          class="relative w-full max-w-2xl rounded-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-darkmode-600 dark:bg-darkmode-800"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-slate-200/90 p-6 dark:border-darkmode-600">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                <Lucide icon="History" class="h-5 w-5" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {{ t('login-history.title') }}
                </h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  {{ t('login-history.subtitle', { count: totalItems }) }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-700 dark:hover:text-slate-200"
              @click="close"
            >
              <Lucide icon="X" class="h-5 w-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="max-h-[60vh] overflow-y-auto p-6">
            <div v-if="isLoading" class="flex items-center justify-center py-12">
              <div class="text-center">
                <div class="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary dark:border-darkmode-600 dark:border-t-primary"></div>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  {{ t('general.loading') }}
                </p>
              </div>
            </div>

            <div
              v-else-if="error"
              class="flex flex-col items-center justify-center py-12 text-center"
            >
              <Lucide icon="AlertCircle" class="mb-4 h-12 w-12 text-danger" />
              <h3 class="mb-2 font-semibold text-slate-900 dark:text-slate-50">
                {{ t('login-history.error-title') }}
              </h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ error.message || t('login-history.error-message') }}
              </p>
            </div>

            <div v-else-if="historyList.length === 0" class="py-12 text-center">
              <Lucide icon="Inbox" class="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <h3 class="mb-2 font-semibold text-slate-900 dark:text-slate-50">
                {{ t('login-history.no-data-title') }}
              </h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ t('login-history.no-data-message') }}
              </p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="item in historyList"
                :key="item.id"
                class="flex items-start gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-slate-300 dark:border-darkmode-700 dark:bg-darkmode-900/40 dark:hover:border-darkmode-600"
              >
                <div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', getStateColor(item.state)]">
                  <Lucide :icon="getStateIcon(item.state)" class="h-5 w-5" />
                </div>
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {{ item.state === 'login' ? t('login-history.login') : t('login-history.logout') }}
                    </span>
                    <span class="text-xs text-slate-500 dark:text-slate-400">
                      {{ item.time_create_view }}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <span class="flex items-center gap-1">
                      <Lucide icon="Monitor" class="h-3 w-3" />
                      {{ item.information?.ip || '-' }}
                    </span>
                    <span class="flex items-center gap-1">
                      <Lucide icon="Globe" class="h-3 w-3" />
                      {{ item.information?.method || '-' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}
</style>
