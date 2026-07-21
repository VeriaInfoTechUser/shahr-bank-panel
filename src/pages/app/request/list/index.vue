<script setup>
import Button from "@/base-components/Button";
import Lucide from "@/base-components/Lucide";
import {useFetch} from "@/composables/useFetch.js";
import {onMounted, ref} from "vue";
import Vue3Datatable from "@bhplugin/vue3-datatable";
import "@bhplugin/vue3-datatable/dist/style.css";
import {useRoute, useRouter} from "vue-router";
import {uri} from "@/constants/config.js";
import RequestDialog from "./RequestDialog.vue";
import "vue-awesome-paginate/dist/style.css";
import BasePagination from "@/base-components/Table/BasePagination.vue";
import FilterRequestDialog from "@/pages/request/list/FilterRequestDialog.vue";
import {getDirection} from "@/utils/index.js";

const route = useRoute()
const router = useRouter()
const filterData = ref({
  type: "request",
  data_from: "",
  data_to: "",
  support_follow_up_date: "",
  support_customer_name: null,
  support_customer_email: null,
  support_product_title: null,
  support_title:null,
  support_order_status:null,
  support_status:null
})
const tempFilterData =ref({
  type: "request",
  data_from: "",
  data_to: "",
  support_follow_up_date: "",
  support_customer_name: null,
  support_customer_email: null,
  support_product_title: null,
  support_title:null,
  support_order_status:null,
  support_status:null
})
const request = ref({})
const requestList = ref([])
const dataLoadingFlag = ref(true)
const cols = ref([
  {field: "counter", title: "#"},
  {field: "title", title: "Title"},
  {field: "customer.name", title: "Customer"},
  {field: "customer.email", title: "Email"},
  {field: "order.product.title", title: "Product"},
  {field: "time_create_view", title: "Created at"},
  {field: "follow_up_date", title: "Follow up"},
  {field: "status", title: "Status"},
  {field: "order.order_status.label", title: "Order status"},
  {field: "action", title: "Action"},
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

const isRtl = ref(getDirection().isRtl)
const usersList = ref([])
const userDataLoadingFlag = ref(true)
const data = null;
const requestDialogPreviewFlag = ref(false)
const filterRequestDialogPreviewFlag = ref(false)

onMounted(async () => {
  await fetchRequestList();
  await fetchUsersList();

});

function setRequestDialogPreviewFlag(value) {
  requestDialogPreviewFlag.value = value;
}

function setFilterRequestDialogPreviewFlag(value) {
  filterRequestDialogPreviewFlag.value = value;
}

function removeFilter(){
  Object.assign(filterData.value,tempFilterData.value);
  Object.assign(pageOptions.value,defaultPageOption.value);
  fetchRequestList()
}

async function fetchRequestList() {
  setFilterRequestDialogPreviewFlag(false)
  dataLoadingFlag.value = true
  setRequestDialogPreviewFlag(false)
  const result = await useFetch(uri.admin.request.list, {body: {...pageOptions.value, ...filterData.value}});
  if (result.data.result) {
    requestList.value = result.data.data.list
    pageOptions.value = result.data.data.paginator
  }
  dataLoadingFlag.value = false
}

async function fetchUsersList() {
  const result = await useFetch(uri.admin.user.profile.list, {body: {limit: 1000}});
  if (result.data.result) {
    usersList.value = result.data.data.list
  }
  userDataLoadingFlag.value = false
}

</script>

<template>
  <section>

    <div v-if="filterRequestDialogPreviewFlag">
      <FilterRequestDialog
          @close="setFilterRequestDialogPreviewFlag(false)"
          @filter="fetchRequestList"
          @removeFilter="removeFilter"
          :filterData="filterData"
          :show="filterRequestDialogPreviewFlag"
      />
    </div>

    <div v-if="requestDialogPreviewFlag">
      <RequestDialog
          @close="setRequestDialogPreviewFlag(false)"
          @onSuccess="removeFilter"
          :show="requestDialogPreviewFlag"
      />
    </div>
    <div class="grid grid-cols-12 gap-6 mt-8">
      <div class="col-span-12 lg:col-span-12 2xl:col-span-12">
        <!-- BEGIN: Inbox Content -->
        <div class="mt-5 intro-y box">

          <div
              class="flex p-5 border-b sm:flex-row text-slate-500 border-slate-200/60 text-end w-full justify-end items-end"
          >
            <div class="w-5 h-5 ms-5 cursor-pointer" @click="fetchRequestList">
              <Lucide icon="RefreshCw" class="w-6 h-6"/>
            </div>
            <div class="w-5 h-5 ms-5 cursor-pointer" @click="setFilterRequestDialogPreviewFlag(true)">
              <Lucide icon="Search" class="w-6 h-6"/>
            </div>
            <div class="w-5 h-5 ms-5 cursor-pointer" @click="setRequestDialogPreviewFlag(true)">
              <Lucide icon="PlusCircle" class="w-6 h-6"/>
            </div>
          </div>
          <div class="mb-5 relative">
          </div>

          <vue3-datatable
              :columns="cols"
              :rows="requestList"
              :loading="dataLoadingFlag"
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
                    (requestList.indexOf(data.value) + 1) + ((pageOptions.page - 1) * pageOptions.limit)
                  }}
                </strong>
              </div>
            </template>
            <template #status="data">
              <div class="text-info" :dir="isRtl?'rtl':'ltr'" :class="{'text-right':isRtl}">
                <Button :variant="data.value.status?'outline-primary':'outline-dark'" size="sm"
                        class="inline-block w-16 mb-2 mr-1">
                  {{ data.value.status ? $t('button.active') : $t('button.inactive') }}
                </Button>
              </div>
            </template>
            <template #title="data">
              <div class="text-info" :dir="isRtl?'rtl':'ltr'" :class="{'text-right':isRtl}">
                {{data.value.title}}
              </div>
            </template>
            <template #customer.name="data">
              <div class="" :dir="isRtl?'rtl':'ltr'" :class="{'text-right':isRtl}">
                {{data.value.customer.name}}
              </div>
            </template>
            <template #order.product.title="data">
              <div class="" :dir="isRtl?'rtl':'ltr'" :class="{'text-right':isRtl}">
                {{data.value.order.product.title}}
              </div>
            </template>
            <template #time_create_view="data">
              <div class="" :dir="isRtl?'rtl':'ltr'" :class="{'text-right':isRtl}">
                {{data.value.time_create_view}}
              </div>
            </template>
            <template #follow_up_date="data">
              <div class="" :dir="isRtl?'rtl':'ltr'" :class="{'text-right':isRtl}">
                {{data.value.follow_up_date}}
              </div>
            </template>
            <template #order.order_status.label="data">
              <div class="" :dir="isRtl?'rtl':'ltr'" :class="{'text-right':isRtl}">
                {{data.value.order.order_status.label}}
              </div>
            </template>
            <template #action="data">
              <div class="text-info" :dir="isRtl?'rtl':'ltr'" :class="{'text-right':isRtl}">
                <div
                    class="flex items-center gap-2 justify-center"
                >
                  <Button variant="outline-dark" size="sm" @click="router.push('/request/'+data.value.slug)">
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
                  @page-change="fetchRequestList"
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
