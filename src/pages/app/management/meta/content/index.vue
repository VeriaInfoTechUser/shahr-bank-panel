<script setup>
import Button from "@/base-components/Button";
import Lucide from "@/base-components/Lucide";
import { useFetch } from "@/composables/useFetch.js";
import { onMounted, ref, shallowRef, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Vue3Datatable from "@bhplugin/vue3-datatable";
import "@bhplugin/vue3-datatable/dist/style.css";
import AddMetaContentDialog from "../AddMetaContentDialog.vue";
import ConfirmationDialog from "@/base-components/Dialog/ConfirmationDialog.vue";
import BasePagination from "@/base-components/Table/BasePagination.vue";
import { uri } from "@/constants/config.js";
import { toast } from "vue3-toastify";

const { t: $t } = useI18n();
const route = useRoute();
const router = useRouter();

const metaKeyInfo = ref({
  key: route.params.key,
  value: route.query.value ?? "",
  id: route.query.id ?? null,
});

const contentList = ref([]);
const dataLoadingFlag = ref(true);
const pageOptions = ref({
  count: 0,
  limit: 10,
  page: 1,
});
const showContentDialogFlag = shallowRef(false);
const selectedMetaContent = ref(null);
const showDeleteDialogFlag = shallowRef(false);
const contentToDelete = ref(null);

const cols = ref([
  { field: "counter", title: "#" },
  { field: "title", title: "Title" },
  { field: "slug", title: "Slug" },
  { field: "action", title: "" },
]);

onMounted(() => {
  if (!metaKeyInfo.value.key) {
    router.push({ name: "app-management-meta" });
    return;
  }
  fetchMetaContentList();
});

async function fetchMetaContentList() {
  dataLoadingFlag.value = true;
  const { data, error, execute } = useFetch(uri.admin.meta.value, {
    method: "POST",
    body: {
      key: metaKeyInfo.value.key,
      meta_key: metaKeyInfo.value.key,
      limit: pageOptions.value.limit,
      page: pageOptions.value.page,
    },
    immediate: false,
  });
  await execute();
  if (!error.value) {
    const response = data.value?.data ?? {};
    contentList.value = response.list ?? [];
    if (response.paginator) {
      pageOptions.value = {
        count: response.paginator.count ?? contentList.value.length,
        limit: response.paginator.limit ?? pageOptions.value.limit,
        page: response.paginator.page ?? pageOptions.value.page,
      };
    }
  }
  if (error.value) {
    toast.error(error.value?.message ?? $t("message.undefined"));
  }
  dataLoadingFlag.value = false;
}

function openCreateContentDialog() {
  selectedMetaContent.value = null;
  showContentDialogFlag.value = true;
}

function openEditContentDialog(content) {
  selectedMetaContent.value = { ...content };
  showContentDialogFlag.value = true;
}

function closeContentDialog() {
  showContentDialogFlag.value = false;
  selectedMetaContent.value = null;
}

async function handleMetaContentSubmit({ metaKey, payload }) {
  const endpoint = payload?.id ? uri.admin.meta.valueUpdate : uri.admin.meta.valueAdd;
  const body = {
    ...payload,
    key: metaKey?.key ?? metaKeyInfo.value.key,
    meta_key: metaKey?.key ?? metaKeyInfo.value.key,
  };
  const { error } = await useFetch(endpoint, {
    method: "POST",
    body,
  });
  if (error.value) {
    return;
  }
  toast.success($t("message.register-successfully"));
  closeContentDialog();
  await nextTick();
  await fetchMetaContentList();
}

function confirmDeleteContent(content) {
  contentToDelete.value = content;
  showDeleteDialogFlag.value = true;
}

function cancelDeleteContent() {
  contentToDelete.value = null;
  showDeleteDialogFlag.value = false;
}

async function deleteMetaContent() {
  if (!contentToDelete.value) return;
  const { error } = await useFetch(uri.admin.meta.valueDelete, {
    method: "POST",
    body: { id: contentToDelete.value.id },
  });
  if (error.value) {
    return;
  }
  toast.success($t("message.register-successfully"));
  cancelDeleteContent();
  await nextTick();
  await fetchMetaContentList();
}

function goBack() {
  router.push({ name: "app-management-meta" });
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Lucide icon="Layers" class="w-6 h-6"/>
          {{ $t('title.meta-content') }}
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {{ $t('label.key') }}: <strong>{{ metaKeyInfo.key }}</strong>
          <template v-if="metaKeyInfo.value">
            · {{ $t('label.value') }}: <strong>{{ metaKeyInfo.value }}</strong>
          </template>
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline-secondary" size="sm" @click="goBack">
          <Lucide icon="ArrowLeft" class="w-4 h-4 mr-1"/>
          {{ $t('button.back') }}
        </Button>
        <Button variant="primary" size="sm" @click="openCreateContentDialog">
          <Lucide icon="Plus" class="w-4 h-4 mr-1"/>
          {{ $t('button.add-data') }}
        </Button>
      </div>
    </div>

    <div class="intro-y box">
      <div
          class="flex p-5 border-b sm:flex-row text-slate-500 border-slate-200/60 text-end w-full justify-end items-end gap-2"
      >
        <div class="w-5 h-5 cursor-pointer" @click="fetchMetaContentList">
          <Lucide icon="RefreshCw" class="w-6 h-6"/>
        </div>
      </div>

      <div class="rtl-table-container">
        <vue3-datatable
            v-if="contentList.length>0"
            :columns="cols"
            :rows="contentList"
            :loading="dataLoadingFlag"
            :isServerMode="false"
            :pagination="false"
            skin="bh-table-striped bh-table-hover"
            dir="rtl"
        >
          <template #header></template>
          <template #footer></template>

          <template #counter="data">
            <div class="w-full text-right">
              <strong class="text-info">
                {{ contentList.indexOf(data.value) + 1 }}
              </strong>
            </div>
          </template>

          <template #title="{ value }">
            <div class="text-right rtl">
              {{ value.title }}
            </div>
          </template>

          <template #slug="{ value }">
            <div class="text-right rtl">
              {{ value.slug }}
            </div>
          </template>

          <template #action="{ value }">
            <div class="flex items-center justify-end gap-2 text-right rtl">
              <Button variant="outline-secondary" size="sm" @click="openEditContentDialog(value)">
                <Lucide icon="Pencil" class="w-4 h-4"/>
              </Button>
              <Button variant="outline-danger" size="sm" @click="confirmDeleteContent(value)">
                <Lucide icon="Trash2" class="w-4 h-4"/>
              </Button>
            </div>
          </template>
        </vue3-datatable>
      </div>

      <div v-if="!dataLoadingFlag && contentList.length === 0" class="p-6 text-center text-slate-500">
        {{ $t('admin.meta.noMetaDescription') }}
      </div>

      <div
          v-if="pageOptions.count > pageOptions.limit"
          class="flex flex-col items-center p-5 text-center sm:flex-row sm:text-left text-slate-500"
      >
        <BasePagination
            :page-options="pageOptions"
            @page-change="fetchMetaContentList"
        />
      </div>
    </div>

    <AddMetaContentDialog
        :show="showContentDialogFlag"
        :meta-key="metaKeyInfo"
        :meta-content="selectedMetaContent"
        @close="closeContentDialog"
        @submit="handleMetaContentSubmit"
    />

    <ConfirmationDialog
        :show="showDeleteDialogFlag"
        :close="cancelDeleteContent"
        :accept="deleteMetaContent"
        :deny="cancelDeleteContent"
    >
      {{ $t('message.are-you-sure-delete-message') }} {{ contentToDelete?.title ?? '' }}
    </ConfirmationDialog>
  </section>
</template>

<style scoped>
.rtl-table-container table {
  direction: rtl;
  text-align: right;
}

.rtl-table-container td {
  direction: rtl !important;
  text-align: right !important;
}

/* Force RTL direction for the entire table */
.rtl-table-container {
  direction: rtl;
}

/* RTL-specific table styling */
.rtl-table-container .bh-table th,
.rtl-table-container .bh-table td {
  text-align: right;
}

/* Fix pagination controls for RTL */
.rtl-table-container .bh-pagination {
  direction: rtl;
}
</style>

