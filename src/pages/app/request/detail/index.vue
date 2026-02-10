<script setup>
import Button from "@/base-components/Button";
import Lucide from "@/base-components/Lucide";
import Table from "@/base-components/Table";
import {computed, onMounted, ref} from "vue";
import {useFetch} from "@/composables/useFetch";
import {useRoute} from 'vue-router';
import {uri} from "@/constants/config.js";
import router from "@/router/index.ts";
import {useDownload} from "@/composables/useDownload.js";
import EditRequestDialog from "@/pages/request/detail/EditRequestDialog.vue";
import ViewRequestDialog from "./ViewRequestDialog.vue";
import ChatComponent from "@/pages/request/detail/ChatComponent.vue";
import {getCurrentUser} from "@/utils/cookie";
import avatar from "@/assets/images/avatar.png";

const isSendMessageLoading = ref(false)
const isLoading = ref(true)
const requestDetail = ref(null)
const requestTempDetail = ref(null)
const route = useRoute();
const slug = ref(route.params.slug);
const loadingMap = ref({});
const editRequestModalPreviewFlag = ref(false)
const viewRequestDetailModalPreviewFlag = ref(false)
const detail = ref({})
const defaultDetail = {}
const user = getCurrentUser()
// Function to handle file download
const downloadFile = async (file) => {
  const {handleDownload, error, loading} = useDownload(file);
  if (typeof handleDownload === 'function') {
    loadingMap.value[file.id] = true;
    await handleDownload();
    loadingMap.value[file.id] = loading.value;
    if (error.value) {
      console.error("Download failed: ", error.value);
    }
  } else {
    console.error("handleDownload is not a function");
  }
};

onMounted(async () => {
  await fetchRequestDetail();
});

async function fetchRequestDetail() {
  isLoading.value = true
  const result = await useFetch(uri.admin.request.get, {body: {type: 'slug', slug: slug.value}});
  if (result.data.result) {
    requestDetail.value = result.data.data
    requestTempDetail.value = result.data.data
  }
  isLoading.value = false
}

async function returnToRequestList() {
  await router.push({name: 'request-list'})
}

function setEditRequestModalPreviewFlag(value) {
  editRequestModalPreviewFlag.value = value;
}

function setViewRequestDetailModalPreviewFlag(value) {
  viewRequestDetailModalPreviewFlag.value = value;
  if (!value) {
    Object.assign(detail.value, defaultDetail)
  }
}

function showMore(information, index) {
  information.index = index
  information.title = requestDetail.value.title
  if (index === 0) {
    information.time_create_view = requestDetail.value.time_create_view
    information.is_new_customer = requestDetail.value.is_new_customer
  }
  Object.assign(detail.value, information)
  setViewRequestDetailModalPreviewFlag(true)
}

const timeline = computed(() => requestDetail.value ? requestDetail.value?.history : []);

function sendMessage(message){
  // isSendMessageLoading.value=true
  console.log(message)
  sendMessageRequest(message)
}

async function sendMessageRequest(message) {
  isSendMessageLoading.value = true
  const requestParams = {
    edit_type:'admin_request_chat',
    slug: slug.value,
    conversation_message : message
  }
  const result = await useFetch(uri.admin.request.edit, {body: requestParams});
  if (result.data.result) {
    requestDetail.value.conversation = result.data.data.conversation
  }
  isSendMessageLoading.value = false
}

</script>

<template>


  <div v-if="viewRequestDetailModalPreviewFlag" >
    <ViewRequestDialog
        :data="detail"
        @close="setViewRequestDetailModalPreviewFlag(false)"
        :show="viewRequestDetailModalPreviewFlag"
    />
  </div>

  <div v-if="editRequestModalPreviewFlag" >
    <EditRequestDialog
        :data="requestTempDetail"
        @close="setEditRequestModalPreviewFlag(false)"
        @onSuccess="fetchRequestDetail"
        :show="editRequestModalPreviewFlag"
    />
  </div>

  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">

    <h2 class="me-auto text-lg font-medium">
      {{ $t('title.request-detail') }}
    </h2>
    <div class="flex w-full mt-4 sm:w-auto sm:mt-0 gap-2">
      <Button variant="outline-dark" size="sm" class="shadow-md" @click="returnToRequestList">
        {{ $t('button.back') }}
      </Button>
      <Button variant="primary" size="sm" class="shadow-md" @click="setEditRequestModalPreviewFlag(true)">
        {{ $t('button.edit') }}
      </Button>
    </div>
  </div>

  <!-- BEGIN: Invoice -->
  <div v-if="isLoading" class="mt-5 overflow-hidden box">
    <div
        class="flex flex-col px-5 pt-10 text-center lg:flex-row sm:px-20 sm:pt-20 lg:pb-20 sm:text-start"
    >
      <div class="text-3xl font-semibold text-primary w-24">
        <ParagraphShimmer :lines="2" :is-loading="isLoading"/>
      </div>
      <div class="mt-20 lg:mt-0 lg:ms-auto lg:text-end">
        <div class="text-xl font-medium text-primary w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
        <div class="mt-1 w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
        <div class="mt-1 w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
      </div>
    </div>
    <div
        class="flex flex-col px-5 pt-10 pb-10 text-center border-b lg:flex-row sm:px-20 sm:pb-20 sm:text-start"
    >
      <div>
        <div class="text-base text-slate-500 w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
        <div class="mt-2 text-lg font-medium text-primary w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
        <div class="mt-1 w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
        <div class="mt-1 w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
      </div>
      <div class="mt-10 lg:mt-0 lg:ms-auto lg:text-end">
        <div class="text-base text-slate-500 w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
        <div class="mt-2 text-lg font-medium text-primary w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
        <div class="mt-1 w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
      </div>
    </div>
    <div class="px-5 py-10 sm:px-16 sm:py-20">
      <div class="overflow-x-auto">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th
                  class="border-b-2 dark:border-darkmode-400 whitespace-nowrap"
              >
                <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
              </Table.Th>
              <Table.Th
                  class="text-end border-b-2 dark:border-darkmode-400 whitespace-nowrap"
              >
                <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
              </Table.Th>
              <Table.Th
                  class="text-end border-b-2 dark:border-darkmode-400 whitespace-nowrap"
              >
                <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
              </Table.Th>
              <Table.Th
                  class="text-end border-b-2 dark:border-darkmode-400 whitespace-nowrap"
              >
                <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td class="border-b dark:border-darkmode-400">
                <div class="font-medium whitespace-nowrap">
                  <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
                </div>
                <div class="text-slate-500 text-sm mt-0.5 whitespace-nowrap">
                  <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
                </div>
              </Table.Td>
              <Table.Td
                  class="w-32 text-end border-b dark:border-darkmode-400"
              >
                <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
              </Table.Td>
              <Table.Td
                  class="w-32 text-end border-b dark:border-darkmode-400"
              >
                <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
              </Table.Td>
              <Table.Td
                  class="w-32 font-medium text-end border-b dark:border-darkmode-400"
              >
                <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td class="border-b dark:border-darkmode-400">
                <div class="font-medium whitespace-nowrap">
                  <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
                </div>
                <div class="text-slate-500 text-sm mt-0.5 whitespace-nowrap">
                  <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
                </div>
              </Table.Td>
              <Table.Td
                  class="w-32 text-end border-b dark:border-darkmode-400"
              >
                <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
              </Table.Td>
              <Table.Td
                  class="w-32 text-end border-b dark:border-darkmode-400"
              >
                <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
              </Table.Td>
              <Table.Td
                  class="w-32 font-medium text-end border-b dark:border-darkmode-400"
              >
                <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </div>
    </div>
    <div class="flex flex-col-reverse px-5 pb-10 sm:px-20 sm:pb-20 sm:flex-row">
      <div class="mt-10 text-center sm:text-start sm:mt-0">
        <div class="text-base text-slate-500 w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
        <div class="mt-2 text-lg font-medium text-primary w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
        <div class="mt-1 w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
        <div class="mt-1 w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
        <div class="mt-1 w-32">
          <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
        </div>
      </div>
      <div class="text-center sm:text-end sm:ms-auto">
        <div class="mt-10 text-center sm:text-start sm:mt-0">
          <div class="text-base text-slate-500 w-32">
            <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
          </div>
          <div class="mt-2 text-lg font-medium text-primary w-32">
            <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
          </div>
          <div class="mt-1 w-32">
            <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
          </div>
          <div class="mt-1 w-32">
            <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
          </div>
          <div class="mt-1 w-32">
            <ParagraphShimmer :lines="1" :is-loading="isLoading"/>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="mt-5 overflow-hidden box">

    <div class="flex flex-col px-10 pt-10 text-center lg:flex-row sm:px-10 sm:pt-10 lg:pb-5 sm:text-start">
      <div class="text-3xl font-semibold text-primary">
        {{ requestTempDetail.title }}
        <span class="text-xs text-slate-500">
          ({{ $t('title.follow-up-date') }}:
          {{ requestTempDetail.follow_up_date }})
        </span>
      </div>
      <div class="mt-10 lg:mt-0 lg:ms-auto lg:text-end">
        <div class="text-xl font-medium text-primary">
          <span class="text-xs text-slate-400" v-if="requestTempDetail.send_from==='admin'">
            ( {{ $t('message.registered-by-admin') }} )
          </span>
          {{ requestTempDetail.slug }}
        </div>
      </div>
    </div>
    <div class="flex flex-col px-5 pb-10 text-center border-b lg:flex-row sm:px-10 sm:pb-5 sm:text-start">
      <div>
        <div class="mt-2 text-lg font-medium text-primary">
          {{ requestTempDetail.customer.name }}
          <span class="text-xs text-slate-400" v-if="requestTempDetail.is_new_customer">
            ( {{ $t('message.first-request') }} )
          </span>
        </div>
        <div class="mt-1">
          {{ requestTempDetail.customer.email }}
        </div>
        <div class="mt-1">
          {{ requestTempDetail.order.delivery.address }}
        </div>
      </div>
      <div class="mt-10 lg:mt-0 lg:ms-auto lg:text-end">
        <div class="mt-2 text-lg font-medium text-primary flex">
          {{ requestTempDetail.order.order_status.label }}
        </div>
        <div class="mt-1 text-gray-300">
          {{
            requestTempDetail.time_create_view
          }}
        </div>
      </div>
    </div>
    <div class="px-5 py-10 sm:px-5 sm:py-10">
      <div class="overflow-x-auto">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th
                  class="border-b-2 dark:border-darkmode-400 whitespace-nowrap"
              >
                {{ $t('title.product') }}
              </Table.Th>
              <Table.Th
                  class="text-end border-b-2 dark:border-darkmode-400 whitespace-nowrap"
              >
                {{ $t('title.company') }}
              </Table.Th>
              <Table.Th
                  class="text-end border-b-2 dark:border-darkmode-400 whitespace-nowrap"
              >
                {{ $t('title.quantity') }}
              </Table.Th>
              <Table.Th
                  class="text-end border-b-2 dark:border-darkmode-400 whitespace-nowrap"
              >
                {{ $t('title.unit') }}
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td class="border-b dark:border-darkmode-400">
                <div class="font-medium whitespace-nowrap">
                  {{ requestTempDetail.order.product.title }}
                </div>
                <div class="text-slate-500 text-sm mt-0.5 whitespace-nowrap">
                  {{ requestTempDetail.order.product.description }}
                </div>
              </Table.Td>
              <Table.Td
                  class="w-32 text-end border-b dark:border-darkmode-400"
              >
                {{ requestTempDetail.order.product.company }}
              </Table.Td>
              <Table.Td
                  class="w-32 text-end border-b dark:border-darkmode-400"
              >
                {{ requestTempDetail.order.product.quantity }}
              </Table.Td>
              <Table.Td
                  class="w-32 text-end border-b dark:border-darkmode-400"
              >
                {{ requestTempDetail.order.product.quantity_unit }}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </div>
    </div>
    <div class="flex flex-col-reverse px-5 pb-10 sm:px-10 border-b sm:pb-10 sm:flex-row">
      <div class="mt-10 text-center sm:text-start sm:mt-0">
        <div class="text-base text-slate-500">
          {{ $t('title.delivery') }}
        </div>
        <div class="mt-2 text-lg font-medium text-primary">
          {{ requestTempDetail.order.delivery.country }}
        </div>
        <div class="mt-1">
          {{ requestTempDetail.order.delivery.state }}
          {{ requestTempDetail.order.delivery.city }}
          {{ requestTempDetail.order.delivery.zip_code }}
        </div>
        <div>
          {{ requestTempDetail.order.delivery.address }}
        </div>
      </div>
      <div class="text-center sm:text-end sm:ms-auto" v-if="requestTempDetail.order.attachments.length>0">
        <div class="mt-2 text-xl font-medium text-primary">
          {{ $t('title.attachments') }}
        </div>
        <div class="mt-1 grid " v-for="file in requestTempDetail.order.attachments" :key="file.id">
          <Button
              variant="outline-primary"
              size="sm"
              class="mb-2"
              @click="downloadFile(file)"
              :disabled="loadingMap[file.id]"
          >
            <Lucide icon="Download" class="w-4 h-4 mx-1 text-black"/>
            {{ file.type }}.{{ file.extension }}
          </Button>
        </div>
      </div>
    </div>

    <div class="text-center lg:flex-row sm:text-start">
      <div dir="ltr">
        <vue-horizontal-timeline :min-width="'300px'" :line-color="'primary'" :timeline-background="'white'"
                                 :items="timeline"
                                 classax="border-none shadow-none"
                                 style="box-shadow: 0 0 0 0 ">

          <template v-slot:default="{item,index}">
            <div
                @click="showMore(item,index)"
            >
              <div v-if="index===0">
                <div>
                  <div class="mb-3 text-xs text-slate-500 flex gap-1">
                    <div class="flex w-full">
                    <span>
                       <Lucide icon="CalendarClock" class="w-4 h-4 text-primary"/>
                    </span>
                      <span>
                        {{ requestDetail.time_create_view }}
                     </span>
                    </div>
                    <div class="w-40 flex item-end justify-end" v-if="item.owner_account">
                      <img
                          :src="item.owner_account.avatar??avatar"
                          class="w-5 h-5 mb-3 ms-1"
                           alt="Avatar"
                      />
                      <span class="text-primary font-medium text-xs">
                    {{item.owner_account.name}}
                      </span>
                    </div>
                  </div>
                  <div class="text-base text-primary">
                  <span>
                     {{ item.order.order_status.label }}
                  </span>
                    <span class="text-xs text-green-400" v-if="requestDetail.is_new_customer">
                    ( {{ $t('message.new-customer') }} )
                  </span>
                  </div>
                  <hr/>
                  <div class="text-xs text-slate-500 mb-3">
                    ({{ $t('title.follow-up-date') }}:
                    {{ item.follow_up_date }})
                  </div>
                  <div class="my-1" v-if="item.is_new_customer">
                    <span class="text-xs text-gray-900">
                      - {{ $t('message.registered-by-admin') }}
                    </span>
                  </div>
                  <div class="my-1 mb-2">
                    <span class="text-xs text-gray-900">
                      - {{
                        item.send_from === 'admin' ? $t('message.request-from-admin') : $t('message.request-from-customer')
                      }}
                    </span>
                  </div>
                  <div v-if="item.order.attachments.length>0" class="cursor-default">
                    <div class="mt-1 flex  flex-wrap gap-3" v-for="file in item.order.attachments" :key="file.id">
                      <div class="border-[1px] m-1 rounded-full p-2   shadow-sm shadow-primary"

                      >
                        <Lucide icon="Download" class="w-4 h-4 text-primary"/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else>
                <div class="mb-3 text-xs text-slate-500 flex gap-1">
                  <div class="flex w-full">
                    <span>
                       <Lucide icon="CalendarClock" class="w-4 h-4 text-primary"/>
                    </span>
                     <span>
                        {{ item.time_update_view }}
                     </span>
                  </div>
                  <div class="w-40 flex item-end justify-end" v-if="item.owner_account">
                    <img
                        alt="Avatar"
                        :src="item.owner_account.avatar??avatar"
                        class="w-5 h-5 mb-3 ms-1"
                      />
                    <span class="text-primary font-medium text-xs">
                    {{item.owner_account.name}}
                      </span>
                  </div>
                </div>
                <div class="text-slate-500 text-xs">
                  {{ $t('title.from') }} {{ item.old_values.order_status.label }} {{ $t('title.to') }}
                </div>
                <div class="text-base text-primary ps-3">
                    <span class="text-xs">
                     {{ item.order_status.label }}
                    </span>
                </div>
                <hr/>
                <div class="text-slate-500 text-[10px] mt-2">
                  {{ $t('title.from') }} {{ item.old_values.follow_up_date }} {{ $t('title.to') }}
                </div>
                <div class="ps-3 text-xs text-primary">
                    <span class="text-slate-500 text-[10px]">
                      {{ $t('title.follow-up-date') }} :
                    </span>
                  <span class="text-sm">
                      {{ item.follow_up_date }}
                    </span>
                </div>
                <hr/>
                <div class="my-1 mb-2" v-if="item.comment">
                  <p class="text-xs text-gray-900 text-ellipsis line-clamp-3">
                    {{ item.comment }}
                  </p>
                </div>
                <div v-if="item.attachments.length>0">
                  <div class="mt-1 flex flex-wrap gap-3" v-for="file in item.attachments" :key="file.id"
                       style="display: inline-flex!important;">
                    <div class="border-[1px] m-1 rounded-full p-2 shadow-sm shadow-primary"
                         style="display: inline-flex!important;"
                    >
                      <Lucide icon="Download" class="w-4 h-4 text-primary"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </vue-horizontal-timeline>
      </div>
    </div>
  </div>
  <!-- END: Invoice -->
  <div v-if="requestDetail">
    <ChatComponent
        :is-loading="isSendMessageLoading"
        :conversation="requestDetail.conversation"
        :recipient="requestDetail.customer"
        :owner="user"
        @send="sendMessage"
    />
  </div>

</template>

<style scoped>
:deep(.vue-horizontal-timeline .timeline[data-v-c7fa1b17]) {
  @apply py-48
}
</style>
