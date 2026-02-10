<script setup lang="ts">
import {ref, provide, onMounted, toRef} from "vue";
import defaultAvatar from "@/assets/images/account-avatar-icon.svg";
import Button from "@/base-components/Button";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import Vue3Datatable from "@bhplugin/vue3-datatable";
import {useFetch} from '@/composables/useFetch';
import {uri} from "@/constants/config.js";
import Lucide from "@/base-components/Lucide";
import BasePagination from "@/base-components/Table/BasePagination.vue";
import {getDirection} from "@/utils/index.js";
import RequestDialog from "@/pages/request/list/RequestDialog.vue";
import ShowMessageDialog from "@/pages/support/public-message/ShowMessageDialog.vue";
import MessageDialog from "@/pages/support/public-message/MessageDialog.vue";
import ConfirmationDialog from "@/base-components/Dialog/ConfirmationDialog.vue";

const isRtl = ref(getDirection().isRtl)
const router = useRouter()
const {t: $t} = useI18n()
const isLoading = ref(true)
const publicMessageList = ref([])
const request = ref({})
const dataLoadingFlag = ref(true)
const cols = ref([
  {field: "counter", title: "#"},
  {field: "title", title: $t("title.title")},
  {field: "description", title: $t("title.description")},
  {field: "time_create_view", title: $t("title.created-at")},
  {field: "action", title: $t("title.action")},
]);
const pageOptions = ref({
  count: 1,
  limit: 10,
  page: 1
})
const openMessageFlag = ref(false)
async function listPublicMessageRequest() {
  let response = []
  isLoading.value = true
  const {data, error} = await useFetch(uri.admin.support.item.list, {body: {limit: 5, type: "public-message"}});
  if (data) {
    response = data.data?.list
  } else if (error.value) {
  }
  return response
}


const fetchData = async () => {
  isLoading.value = true
  try {
    const [publicMessage] = await Promise.all([
      listPublicMessageRequest(),
    ]);
    publicMessageList.value = publicMessage;
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    isLoading.value = false
  }
}

const messageDialogPreviewFlag = ref(false)
const currentMessage = ref(null)
function setMessageDialogPreviewFlag(value,message=null){
  currentMessage.value = message
  messageDialogPreviewFlag.value = value
}

function setOpenMessageFlag(value : any) {
  openMessageFlag.value = value
}

function openMessageDialog() {
  openMessageFlag.value = true
}
function onSuccessOpenMessage() {
  setOpenMessageFlag(false);
  fetchData()
}

const showUpdateStatusFlag = ref(false);
function cancelUpdateStatus() {
  showUpdateStatusFlag.value = false
}

function showConfirmationDialog(value){
  currentMessage.value = value
  showUpdateStatusFlag.value = true
}

async function confirmUpdateStatus() {
  isLoading.value = true
  currentMessage.value.status = 1-currentMessage.value.status
  currentMessage.value["edit_type"] ="change_status"
  useFetch(uri.admin.support.message.edit, {body: currentMessage.value});
  showUpdateStatusFlag.value = false
  await fetchData()
}
onMounted(fetchData)

</script>

<template>
  <section>

    <div v-if="showUpdateStatusFlag">
      <ConfirmationDialog
          :close="cancelUpdateStatus"
          :show="showUpdateStatusFlag"
          :accept="confirmUpdateStatus"
          :deny="cancelUpdateStatus"
      >
        {{ $t('message.are-you-sure-delete-message') }}
      </ConfirmationDialog>
    </div>

    <MessageDialog
        v-if="openMessageFlag"
        @close="setOpenMessageFlag(false)"
        @onSuccess="onSuccessOpenMessage"
        :show="openMessageFlag"
    />
    <div v-if="messageDialogPreviewFlag">
      <ShowMessageDialog
          :message = "currentMessage"
          @close="setMessageDialogPreviewFlag(false)"
          :show="messageDialogPreviewFlag"
      />
    </div>

    <div class="grid grid-cols-12 gap-6 mt-8">
      <div class="col-span-12 lg:col-span-12 2xl:col-span-12">
        <!-- BEGIN: Inbox Content -->
        <div class="mt-5 intro-y box">

          <div
              class="flex p-5 border-b sm:flex-row text-slate-500 border-slate-200/60 text-end w-full justify-end items-end"
          >
            <div class="w-5 h-5 ms-5 cursor-pointer" @click="fetchData">
              <Lucide icon="RefreshCw" class="w-6 h-6"/>
            </div>
            <div class="w-5 h-5 ms-5 cursor-pointer" @click="openMessageDialog">
              <Lucide icon="PlusCircle" class="w-6 h-6"/>
            </div>
          </div>
          <div class="mb-5 relative">
          </div>

          <vue3-datatable
              :columns="cols"
              :rows="publicMessageList"
              :loading="isLoading"
              :totalRows="pageOptions.count"
              :isServerMode="true"
              :pageSize="pageOptions.limit"
              :pagination="false"
              :sortable="false"
              class="advanced-table whitespace-nowrap px-4"
          >
            <!-- Empty header slot to remove the header -->
            <template #header>
              <!-- No content here will hide the header -->
            </template>
            <!-- Empty footer slot to remove the footer -->
            <template #footer>
              <!-- No content here will hide the footer -->
            </template>
            <template #counter="data,key">
              <div class="text-info" :dir="isRtl?'rtl':'ltr'" :class="{'text-right':isRtl}">
                <strong>
                  {{
                    (publicMessageList.indexOf(data.value) + 1) + ((pageOptions.page - 1) * pageOptions.limit)
                  }}
                </strong>
              </div>
            </template>
            <template #title="data,key">
              <div class="text-start " :dir="isRtl?'rtl':'ltr'"  >
                <strong>
                  {{ data.value.title }}
                </strong>
              </div>
            </template>
            <template #description="data,key">
              <div class="max-w-44 truncate justify-start overflow-ellipsis" :dir="isRtl?'rtl':'ltr'"
                   :class="{'text-right':isRtl}">
                <span>
                  {{ data.value.description }}
                </span>
              </div>
            </template>
            <template #time_create_view="data,key">
              <div class="max-w-44 truncate justify-start text-clip" :dir="isRtl?'rtl':'ltr'"
                   :class="{'text-right':isRtl}">
                <span>
                  {{ data.value.time_create_view }}
                </span>
              </div>
            </template>

            <template #action="data">
              <div class="    justify-start  " :dir="isRtl?'rtl':'ltr'"
                   :class="{'text-right':isRtl}">
                <div
                    class="flex items-center gap-3 justify-center"
                >
                  <div class="w-5 h-5 ms-5 cursor-pointer mb-1" @click="showConfirmationDialog(data.value)">
                    <Lucide icon="Trash2" class="w-6 h-6"/>
                  </div>
                  <Button variant="outline-dark" size="sm" @click="setMessageDialogPreviewFlag(true,data.value)">
                    <Lucide icon="Eye" class="w-4 h-4"/>
                  </Button>
                </div>
              </div>
            </template>


          </vue3-datatable>

          <div
              class="flex flex-col items-center p-5 text-center sm:flex-row sm:text-left text-slate-500"
          >
            <div>

              <BasePagination
                  v-if="pageOptions.count>pageOptions.limit"
                  :page-options="pageOptions"
                  @page-change="fetchData"
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
