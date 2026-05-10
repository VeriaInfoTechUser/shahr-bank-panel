<script setup lang="ts">
import { watch, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseConfirmModal from '@/core/ui/base/BaseConfirmModal.vue';
import Button from '@/base-components/Button';
import Table from '@/base-components/Table';
import { apiClient } from '@/core/api/apiClient';
import { useDownload } from '@/core/composables/useDownload';
import { ermRepo } from '@/core/repositories/ermRepo';

const props = defineProps<{
  show: boolean;
  relationModule: string;
  relationSection: string;
  relationItem: number | string;
  ruleId?: number | string;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const { download: downloadFile, loading: downloadLoading } = useDownload();
const attachments = ref<unknown[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const deleting = ref(false);
const uploadLoading = ref(false);
const uploadError = ref<string | null>(null);
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const confirmFile = ref<Record<string, unknown> | null>(null);

const activeTab = ref('task');
const ruleAttachments = ref<unknown[]>([]);
const ruleLoading = ref(false);
const ruleError = ref<string | null>(null);
const ruleInfo = ref<Record<string, unknown> | null>(null);

const fetchRuleAttachments = async () => {
  if (!props.relationModule || !props.ruleId) {
    ruleError.value = 'Missing rule parameters';
    ruleAttachments.value = [];
    return;
  }

  ruleLoading.value = true;
  ruleError.value = null;
  ruleAttachments.value = [];

  try {
    const response = await apiClient.post<{ result?: boolean; data?: { list?: unknown[] } }>(
      'media/private/list',
      {
        relation_module: props.relationModule,
        relation_section: 'compliance-rule',
        relation_item: props.ruleId,
      }
    );

    const data = response?.data;
    ruleAttachments.value = Array.isArray(data?.list) ? data.list : [];
  } catch (err) {
    ruleError.value = String(err instanceof Error ? err.message : err ?? 'Unknown error');
    toast(ruleError.value, { type: 'error' });
  } finally {
    ruleLoading.value = false;
  }
};

const fetchRuleInfo = async () => {
  if (!props.ruleId) {
    ruleInfo.value = null;
    return;
  }

  try {
    const response = await ermRepo.list({ id: props.ruleId, limit: 1 });
    const list = response?.data?.list ?? [];
    if (Array.isArray(list) && list.length > 0) {
      ruleInfo.value = list[0] as Record<string, unknown>;
    }
  } catch (err) {
    console.error('Failed to fetch rule info:', err);
  }
};

const fetchAttachments = async () => {
  if (!props.relationModule || !props.relationSection || props.relationItem == null) {
    error.value = 'Missing relation parameters';
    attachments.value = [];
    return;
  }

  loading.value = true;
  error.value = null;
  attachments.value = [];

  try {
    const response = await apiClient.post<{ result?: boolean; data?: { list?: unknown[] } }>(
      'media/private/list',
      {
        relation_module: props.relationModule,
        relation_section: props.relationSection,
        relation_item: props.relationItem,
      }
    );

    const data = response?.data;
    attachments.value = Array.isArray(data?.list) ? data.list : [];
  } catch (err) {
    error.value = String(err instanceof Error ? err.message : err ?? 'Unknown error');
    toast(error.value, { type: 'error' });
  } finally {
    loading.value = false;
  }
};

const downloadAttachment = async (attachment: Record<string, unknown>) => {
  const id = attachment.id;
  if (id == null) {
    toast('Missing attachment id', { type: 'error' });
    return;
  }

  const filename = String(attachment.original_name ?? attachment.title ?? 'download');
  await downloadFile('media/private/stream', { id }, filename);
};

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] ?? null;
  uploadError.value = null;
};

const uploadAttachment = async () => {
  if (!selectedFile.value) {
    toast('No file selected', { type: 'error' });
    return;
  }

  uploadLoading.value = true;
  uploadError.value = null;

  try {
    const formData = new FormData();
    formData.append('relation_module', props.relationModule);
    formData.append('relation_section', props.relationSection);
    formData.append('relation_item', String(props.relationItem));
    formData.append('file', selectedFile.value, selectedFile.value.name);

    const response = await apiClient.postFormData<{ result?: boolean }>('media/private/add-private', formData);
    if (response?.result !== true) {
      throw new Error('Upload failed');
    }

    toast('File uploaded successfully', { type: 'success' });
    selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    void fetchAttachments();
    emit('success');
  } catch (err) {
    const message = String(err instanceof Error ? err.message : err ?? 'Unknown error');
    uploadError.value = message;
    toast(message, { type: 'error' });
  } finally {
    uploadLoading.value = false;
  }
};

const deleteAttachment = async (attachment: Record<string, unknown>) => {
  const id = attachment.id;
  if (id == null) {
    toast('Missing attachment id', { type: 'error' });
    return;
  }

  deleting.value = true;
  try {
    const response = await apiClient.post<{ result?: boolean }>('media/private/delete', { id });
    if (response?.result !== true) {
      throw new Error('Delete failed');
    }
    toast('Attachment deleted successfully', { type: 'success' });
    void fetchAttachments();
    emit('success');
  } catch (err) {
    const message = String(err instanceof Error ? err.message : err ?? 'Unknown error');
    toast(message, { type: 'error' });
  } finally {
    deleting.value = false;
    confirmFile.value = null;
  }
};

watch(
  () => props.show,
  (show) => {
    if (show) {
      void fetchAttachments();
      void fetchRuleInfo();
      void fetchRuleAttachments();
    }
  },
  { immediate: true }
);

function closeModal() {
  selectedFile.value = null;
  uploadError.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  emit('update:show', false);
  emit('close');
}

function onModalVisible(v: boolean) {
  emit('update:show', v);
  if (!v) {
    emit('close');
  }
}

function openDeleteConfirm(attachment: Record<string, unknown>) {
  confirmFile.value = attachment;
}
</script>

<template>
  <div>
    <BaseModal
      :visible="props.show"
      :title="t('title.attachments')"
      size="md"
      @update:visible="onModalVisible"
    >
    <div class="space-y-4">
      <!-- Tabs -->
      <div class="flex w-full border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          class="flex-1 px-4 py-2 text-sm font-medium transition-colors"
          :class="[
            activeTab === 'task'
              ? 'border-b-2 border-primary text-primary dark:text-primary'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          ]"
          @click="activeTab = 'task'"
        >
          پیوست های تعهد
        </button>
        <button
          type="button"
          class="flex-1 px-4 py-2 text-sm font-medium transition-colors"
          :class="[
            activeTab === 'rule'
              ? 'border-b-2 border-primary text-primary dark:text-primary'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          ]"
          @click="activeTab = 'rule'"
        >
          پیوست های قانون تعهد
        </button>
      </div>

      <!-- Task Attachments Tab -->
      <div v-if="activeTab === 'task'" class="space-y-4">
        <div v-if="loading" class="text-sm text-slate-500">{{ t('general.loading') }}...</div>
        <div v-if="error" class="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {{ error }}
        </div>
        <div v-if="!loading && !error" class="space-y-4">
          <div class="rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
            <div class="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              {{ t('general.upload-file') || 'Upload attachment' }}
            </div>
            <div class="flex items-center gap-2">
              <input
                ref="fileInput"
                type="file"
                @change="onFileChange"
                class="file-input file-input-bordered flex-1 text-xs"
              />
              <Button
                type="button"
                variant="primary"
                size=" "
                @click="uploadAttachment"
                :disabled="uploadLoading || !selectedFile"
                class="shrink-0"
              >
                {{ t('general.upload') }}
              </Button>
            </div>
            <div v-if="selectedFile" class="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {{ selectedFile.name }}
            </div>
            <div v-if="uploadError" class="mt-2 text-sm text-red-600 dark:text-red-400">
              {{ uploadError }}
            </div>
            <div v-if="uploadLoading" class="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {{ t('general.uploading') }}...
            </div>
          </div>

          <div v-if="attachments.length === 0" class="text-sm text-slate-500">
            {{ t('general.no-data') }}
          </div>
          <div v-else class="overflow-x-auto">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                    {{ t('general.title') }}
                  </Table.Th>
                  <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                    {{ t('general.type') }}
                  </Table.Th>
                  <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                    {{ t('general.extension') }}
                  </Table.Th>
                  <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                    {{ t('general.size') }}
                  </Table.Th>
                  <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                    {{ t('general.created-at') }}
                  </Table.Th>
                  <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                    {{ t('general.actions') }}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr v-for="item in attachments" :key="item.id">
                  <Table.Td class="border-b dark:border-darkmode-400">
                    <div class="font-medium whitespace-nowrap">
                      {{ item.title || item.original_name }}
                    </div>
                  </Table.Td>
                  <Table.Td class="border-b dark:border-darkmode-400">
                    {{ item.type }}
                  </Table.Td>
                  <Table.Td class="border-b dark:border-darkmode-400">
                    {{ item.extension }}
                  </Table.Td>
                  <Table.Td class="border-b dark:border-darkmode-400">
                    {{ item.size_view }}
                  </Table.Td>
                  <Table.Td class="border-b dark:border-darkmode-400">
                    {{ item.time_create_view }}
                  </Table.Td>
                  <Table.Td class="border-b dark:border-darkmode-400">
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        class="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        :title="t('general.download')"
                        @click="() => downloadAttachment(item as Record<string, unknown>)"
                        :disabled="downloadLoading"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        class="inline-flex h-7 w-7 items-center justify-center rounded border border-red-300 text-red-600 transition hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                        :title="t('general.delete')"
                        @click="openDeleteConfirm(item as Record<string, unknown>)"
                        :disabled="deleting"
                      >
                        ✕
                      </button>
                    </div>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </div>
        </div>
      </div>

      <!-- Rule Attachments Tab -->
      <div v-if="activeTab === 'rule'" class="space-y-4">
        <div v-if="ruleInfo" class="rounded bg-slate-50 p-3 dark:bg-slate-900">
          <div class="text-sm font-medium text-slate-700 dark:text-slate-200">
            قانون: {{ ruleInfo.rule || ruleInfo.title || '—' }}
          </div>
        </div>
        <div v-if="ruleLoading" class="text-sm text-slate-500">{{ t('general.loading') }}...</div>
        <div v-if="ruleError" class="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {{ ruleError }}
        </div>
        <div v-if="!ruleLoading && !ruleError">
          <div v-if="ruleAttachments.length === 0" class="text-sm text-slate-500">
            {{ t('general.no-data') }}
          </div>
          <div v-else class="overflow-x-auto">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                    {{ t('general.title') }}
                  </Table.Th>
                  <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                    {{ t('general.type') }}
                  </Table.Th>
                  <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                    {{ t('general.extension') }}
                  </Table.Th>
                  <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                    {{ t('general.size') }}
                  </Table.Th>
                  <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                    {{ t('general.created-at') }}
                  </Table.Th>
                  <Table.Th class="border-b-2 dark:border-darkmode-400 whitespace-nowrap">
                    {{ t('general.actions') }}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr v-for="item in ruleAttachments" :key="item.id">
                  <Table.Td class="border-b dark:border-darkmode-400">
                    <div class="font-medium whitespace-nowrap">
                      {{ item.title || item.original_name }}
                    </div>
                  </Table.Td>
                  <Table.Td class="border-b dark:border-darkmode-400">
                    {{ item.type }}
                  </Table.Td>
                  <Table.Td class="border-b dark:border-darkmode-400">
                    {{ item.extension }}
                  </Table.Td>
                  <Table.Td class="border-b dark:border-darkmode-400">
                    {{ item.size_view }}
                  </Table.Td>
                  <Table.Td class="border-b dark:border-darkmode-400">
                    {{ item.time_create_view }}
                  </Table.Td>
                  <Table.Td class="border-b dark:border-darkmode-400">
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        class="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        :title="t('general.download')"
                        @click="() => downloadAttachment(item as Record<string, unknown>)"
                        :disabled="downloadLoading"
                      >
                        ↓
                      </button>
                    </div>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button type="button" variant="secondary" size="sm" @click="closeModal">
        {{ t('general.close') }}
      </Button>
    </template>
  </BaseModal>

  <BaseConfirmModal
    :show="confirmFile != null"
    :title="`${t('general.delete')} - ${confirmFile?.title || confirmFile?.original_name}`"
    :message="`${t('general.delete-confirm-message')}`"
    confirm-variant="danger"
    :confirm-label-key="`general.delete`"
    :on-confirm-action="confirmFile ? () => deleteAttachment(confirmFile) : undefined"
    @update:show="(v) => { if (!v) confirmFile = null; }"
  />
  </div>
</template>
