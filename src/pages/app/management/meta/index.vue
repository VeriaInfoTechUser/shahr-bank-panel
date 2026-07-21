<script setup>
import Button from "@/base-components/Button";
import Lucide from "@/base-components/Lucide";
import {useFetch} from "@/composables/useFetch.js";
import {onMounted, ref, shallowRef, nextTick} from "vue";
import Vue3Datatable from "@bhplugin/vue3-datatable";
import "@bhplugin/vue3-datatable/dist/style.css";
import {useRouter} from "vue-router";
import {uri} from "@/constants/config.js";
import "vue-awesome-paginate/dist/style.css";
import BasePagination from "@/base-components/Table/BasePagination.vue";
import FilterMetaKeyDialog from "./FilterMetaKeyDialog.vue";
import ConfirmationDialog from "@/base-components/Dialog/ConfirmationDialog.vue";
import AddMetaKeyDialog from "./AddMetaKeyDialog.vue";
import AddMetaContentDialog from "./AddMetaContentDialog.vue";
import {useI18n} from "vue-i18n";
import {toast} from "vue3-toastify";

const {t: $t} = useI18n()
const router = useRouter()
const selectedMetaKey = ref(null)
const showAddMetaDialogFlag = shallowRef(false)
const showAddMetaContentDialogFlag = shallowRef(false)
const filterData = ref({
  target: 'product',
  type: 'product',
})
const tempFilterData = {
  target: 'product',
  type: 'product',
}
const requestFilterData = {
  target: 'product',
  type: 'product',
}
const userList = ref([])
const dataLoadingFlag = ref(true)
const cols = ref([
  {field: "counter", title: "#"},
  {field: "value", title: "Value"},
  {field: "key", title: "Key"},
  {field: "action", title: ""},
]);
const pageOptions = ref({
  count: 1,
  limit: 25,
  page: 1
})
const defaultPageOption = ref({
  count: 1,
  limit: 25,
  page: 1
})

const filterMetaKeyDialogPreviewFlag = ref(false)
const selectedMetaKeyForContent = ref(null)

function openCreateMetaDialog() {
  selectedMetaKey.value = null
  showAddMetaDialogFlag.value = true
}

function openEditMetaDialog(metaKey) {
  selectedMetaKey.value = {...metaKey}
  showAddMetaDialogFlag.value = true
}

function closeMetaDialog() {
  showAddMetaDialogFlag.value = false
  selectedMetaKey.value = null
}

onMounted(async () => {
  await fetchMetaKeyList();
});

function setFilterMetaKeyDialogPreviewFlag(value) {
  filterMetaKeyDialogPreviewFlag.value = value;
}

function removeFilter() {
  Object.assign(filterData.value, tempFilterData);
  Object.assign(pageOptions.value, defaultPageOption.value);
  fetchMetaKeyList()
}

async function fetchMetaKeyList() {
  try {
    // Reset states
    userList.value = [];
    setFilterMetaKeyDialogPreviewFlag(false);
    dataLoadingFlag.value = true;
    // Prepare request data
    Object.assign(requestFilterData, filterData.value);
    requestFilterData.status = filterData.value.status ? filterData.value.status.value : [0, 1];

    // Make the API call and wait for execution
    const {data: users, error, execute} = useFetch(uri.admin.meta.list, {
      body: {...pageOptions.value, ...requestFilterData},
      immediate: false // We'll trigger manually
    });

    await execute();

    if (error.value) {
      console.error('Error fetching metaKey list:', error.value);
      // Handle error (show toast, etc.)
      return;
    }

    if (users.value?.data?.list) {
      userList.value = users.value.data.list;
      pageOptions.value = users.value.data.paginator;
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  } finally {
    dataLoadingFlag.value = false;
  }
}

function confirmDeleteMetaKey(metaKey) {
  currentMetaKey.value =  {...metaKey}
  setShowDeleteMetaKeyDialogFlag(true)
}

function openAddMetaContentDialog(metaKey) {
  selectedMetaKeyForContent.value = {...metaKey}
  showAddMetaContentDialogFlag.value = true
}

function closeAddMetaContentDialog() {
  showAddMetaContentDialogFlag.value = false
  selectedMetaKeyForContent.value = null
}

async function handleMetaContentSubmit({ metaKey, payload }) {
  const endpoint = payload?.id ? uri.admin.meta.valueUpdate : uri.admin.meta.valueAdd;
  const body = {
    ...payload,
    key: metaKey?.key ?? metaKey?.id,
    meta_key: metaKey?.key ?? metaKey?.id,
  };
  const { error } = await useFetch(endpoint, {
    method: 'POST',
    body,
  });
  if (error.value) {
    return;
  }
  toast.success($t('message.register-successfully'));
  closeAddMetaContentDialog();
}

function setShowDeleteMetaKeyDialogFlag(value) {
  showDeleteMetaKeyDialogFlag.value = value
}

function deleteMetaKey() {
  deleteMetaKeyRequest(currentMetaKey.value);
}

async function deleteMetaKeyRequest(metaKey) {
  if (metaKey == null) {
    cancelDeleteMetaKey();
  }
  dataLoadingFlag.value = true
  setShowDeleteMetaKeyDialogFlag(false)
  // Instead of delete, update status to 0
  const { error } = await useFetch(uri.admin.meta.update, {
    method: 'POST',
    body: { 
      id: metaKey.id,
      status: 0
    },
  });
  if (!error.value) {
    await nextTick();
    await fetchMetaKeyList();
  }
  dataLoadingFlag.value = false;
}

function cancelDeleteMetaKey() {
  currentMetaKey.value = {...defaultMetaKey};
  setShowDeleteMetaKeyDialogFlag(false)
}

async function handleMetaKeySuccess() {
  await nextTick();
  await fetchMetaKeyList();
}

function openMetaContentList(metaKey) {
  router.push({
    name: 'app-management-meta-content',
    params: { key: metaKey.key },
    query: {
      value: metaKey.value ?? '',
      id: metaKey.id ?? ''
    }
  });
}





const defaultMetaKey = {
  id: null,
  key: '',
  value: '',
  status: 1,
}
const showDeleteMetaKeyDialogFlag = ref(false)
const currentMetaKey = ref({...defaultMetaKey})
</script>

<template>
  <section>

      <ConfirmationDialog
          :close="cancelDeleteMetaKey"
          :show="showDeleteMetaKeyDialogFlag"
          :accept="deleteMetaKey"
          :deny="cancelDeleteMetaKey"
      >
        {{ $t('message.are-you-sure-delete-message') }} {{ currentMetaKey.key ?? '' }}
      </ConfirmationDialog>

      <AddMetaKeyDialog
          :show="showAddMetaDialogFlag"
          :meta-key="selectedMetaKey"
          @close="closeMetaDialog"
          @onSuccess="handleMetaKeySuccess"
      />

      <AddMetaContentDialog
          :show="showAddMetaContentDialogFlag"
          :meta-key="selectedMetaKeyForContent"
          :meta-content="null"
          @close="closeAddMetaContentDialog"
          @submit="handleMetaContentSubmit"
      />




    <div v-if="filterMetaKeyDialogPreviewFlag">
      <FilterMetaKeyDialog
          @close="setFilterMetaKeyDialogPreviewFlag(false)"
          @filter="fetchMetaKeyList"
          @removeFilter="removeFilter"
          :filterData="filterData"
          :show="filterMetaKeyDialogPreviewFlag"
      />
    </div>

    <div class="grid grid-cols-12 gap-6 mt-8">
      <div class="col-span-12 lg:col-span-12 2xl:col-span-12">

        <!-- BEGIN: Inbox Filter -->
        <div class="flex flex-col-reverse items-center intro-y sm:flex-row">
          <div class="relative w-full mt-3 mr-auto sm:w-auto sm:mt-0">

          </div>
          <div class="flex w-full sm:w-auto gap-2">

          </div>
        </div>
        <!-- END: Inbox Filter -->

        <!-- BEGIN: Inbox Content -->
        <div class="mt-5 intro-y box">
          <div
              class="flex p-5 border-b sm:flex-row text-slate-500 border-slate-200/60 text-end w-full justify-end items-end"
          >
            <div class="w-5 h-5 ms-5 cursor-pointer" @click="fetchMetaKeyList">
              <Lucide icon="RefreshCw" class="w-6 h-6"/>
            </div>
            <div class="w-5 h-5 ms-5 cursor-pointer" @click="setFilterMetaKeyDialogPreviewFlag(true)">
              <Lucide icon="Search" class="w-6 h-6"/>
            </div>
            <div class="w-5 h-5 ms-5 cursor-pointer" @click="openCreateMetaDialog">
              <Lucide icon="PlusCircle" class="w-6 h-6"/>
            </div>
          </div>
          <div class="mb-5 relative">
          </div>

          <div class="mb-5 relative">
          </div>

          <div class="rtl-table-container">
            <vue3-datatable
                :columns="cols"
                :rows="userList"
                :loading="dataLoadingFlag"
                :totalRows="pageOptions.count"
                :isServerMode="true"
                :pageSize="pageOptions.limit"
                :pagination="false"
                dir="rtl"
                :sortable="false"
                skin="bh-table-striped bh-table-hover"
            >
              <!-- Optional: remove headers and footers -->
              <template #header></template>
              <template #footer></template>

              <!-- Counter -->
              <template #counter="data,key">
                <div class="w-full text-right">
                  <strong class="text-info">{{
                      (userList.indexOf(data.value) + 1) + ((pageOptions.page - 1) * pageOptions.limit)
                    }}</strong>
                </div>
              </template>

              <!-- Key -->
              <template #key="{ value }">
                <div class="text-right rtl">
                  {{ value.key }}
                </div>
              </template>

              <!-- Value -->
              <template #value="{ value }">
                <div class="text-right rtl">
                  {{ value.value }}
                </div>
              </template>


              <!-- Action -->
              <template #action="{ value }">
                <div class="flex items-center justify-end gap-2 text-right rtl">
                  <Button
                      v-if="value?.option?.has_content"
                      variant="outline-primary"
                      size="sm"
                      @click="openAddMetaContentDialog(value)"
                  >
                    {{ $t('button.add-data') }}
                  </Button>
                  <Button
                      v-if="value?.option?.has_content"
                      variant="outline-secondary"
                      size="sm"
                      @click="openMetaContentList(value)"
                  >
                    <Lucide icon="List" class="w-4 h-4" />
                  </Button>

                  <Button
                      variant="outline-secondary"
                      size="sm"
                      @click="openEditMetaDialog(value)"
                  >
                    <Lucide icon="Pencil" class="w-4 h-4" />
                  </Button>
                  <Button variant="outline-danger" size="sm" @click="confirmDeleteMetaKey(value)">
                    <Lucide icon="Trash2" class="w-4 h-4" />
                  </Button>
                </div>
              </template>
            </vue3-datatable>
          </div>
          <div
              class="flex flex-col items-center p-5 text-center sm:flex-row sm:text-left text-slate-500"
          >
            <div>

              <BasePagination
                  v-if="pageOptions.count>pageOptions.limit"
                  :page-options="pageOptions"
                  @page-change="fetchMetaKeyList"
              />

            </div>
            <div class="mt-2 sm:ml-auto sm:mt-0">

            </div>
          </div>
        </div>
        <!-- END: Inbox Content -->
      </div>
    </div>
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

/* Adjust action buttons spacing for RTL */
.rtl-table-container .action-buttons button {
  margin-right: 0;
  margin-left: 8px;
}

/* Your existing badge and color classes */
.badge {
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  color: white;
}

/* ... rest of your existing styles ... */
</style>